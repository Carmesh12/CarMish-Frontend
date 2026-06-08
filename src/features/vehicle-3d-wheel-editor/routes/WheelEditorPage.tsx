import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Settings2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { notifyError, notifySuccess } from '../../../lib/toast';
import { WheelEditorViewer } from '../components/WheelEditorViewer';
import { WheelPicker } from '../components/WheelPicker';
import {
  wheelEditorApi,
  type WheelEditorModelResponse,
  type WheelModelOption,
} from '../api/wheelEditorApi';
import type { WheelDetectionResult } from '../utils/wheelDetection';

type WheelEditorMode = 'vendor' | 'personal';

type WheelEditorPageProps = {
  mode: WheelEditorMode;
};

function isReplaceableDetection(result: WheelDetectionResult | null) {
  return result?.detectedCount === 2 || result?.detectedCount === 4;
}

export function WheelEditorPage({ mode }: WheelEditorPageProps) {
  const { t } = useTranslation();
  const { id: vehicleId, modelId } = useParams<{
    id: string;
    modelId: string;
  }>();
  const [model, setModel] = useState<WheelEditorModelResponse | null>(null);
  const [wheelOptions, setWheelOptions] = useState<WheelModelOption[]>([]);
  const [selectedWheel, setSelectedWheel] = useState<WheelModelOption | null>(
    null,
  );
  const selectedWheelRef = useRef<WheelModelOption | null>(null);
  const pendingAutoApplyRef = useRef(false);
  const [detection, setDetection] = useState<WheelDetectionResult | null>(null);
  const [replaceSignal, setReplaceSignal] = useState(0);
  const [status, setStatus] = useState(
    t('wheelEditor.loading', 'Loading wheel editor...'),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backTo = mode === 'vendor' ? '/vendor/vehicles' : '/user/dashboard';
  const canReplace = isReplaceableDetection(detection);

  useEffect(() => {
    selectedWheelRef.current = selectedWheel;
  }, [selectedWheel]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (mode === 'vendor' && !vehicleId) return;
      if (mode === 'personal' && !modelId) return;

      setLoading(true);
      setError(null);
      setStatus(t('wheelEditor.loading', 'Loading wheel editor...'));

      try {
        const [wheels, modelData] = await Promise.all([
          wheelEditorApi.listWheels(),
          mode === 'vendor'
            ? wheelEditorApi.getVendorModel(vehicleId!)
            : wheelEditorApi.getPersonalModel(modelId!),
        ]);

        if (cancelled) return;

        setWheelOptions(wheels);
        setModel(modelData);

        const savedWheel = modelData.wheelEdit
          ? wheels.find((wheel) => wheel.id === modelData.wheelEdit?.selectedWheelId)
          : undefined;

        if (savedWheel) {
          selectedWheelRef.current = savedWheel;
          setSelectedWheel(savedWheel);
          pendingAutoApplyRef.current = true;
          setStatus(
            t(
              'wheelEditor.savedSelectionLoaded',
              'Saved wheel selection loaded. Detecting wheels...',
            ),
          );
        } else if (modelData.wheelEdit) {
          setStatus(
            t(
              'wheelEditor.savedSelectionMissing',
              'Saved wheel asset is no longer available. Choose another wheel.',
            ),
          );
        } else {
          setStatus(t('wheelEditor.detecting', 'Detecting wheel objects...'));
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : t('wheelEditor.loadError', 'Could not load wheel editor.'),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [mode, modelId, vehicleId, t]);

  const handleDetection = useCallback((result: WheelDetectionResult | null) => {
    setDetection(result);

    if (
      result &&
      isReplaceableDetection(result) &&
      pendingAutoApplyRef.current &&
      selectedWheelRef.current
    ) {
      pendingAutoApplyRef.current = false;
      setReplaceSignal((value) => value + 1);
    }
  }, []);

  const handleReplacementStatus = useCallback((message: string) => {
    setStatus(message);
  }, []);

  function handleWheelSelect(option: WheelModelOption) {
    selectedWheelRef.current = option;
    setSelectedWheel(option);

    if (!canReplace) {
      setStatus(
        t(
          'wheelEditor.needDetectedWheels',
          'Detect 2 or 4 wheels before replacing them.',
        ),
      );
      return;
    }

    setStatus(t('wheelEditor.replacing', 'Replacing wheels...'));
    setReplaceSignal((value) => value + 1);
  }

  async function saveSelection() {
    if (!selectedWheel) {
      notifyError(t('wheelEditor.chooseWheel', 'Choose a wheel first.'));
      return;
    }

    if (!canReplace) {
      notifyError(
        t(
          'wheelEditor.needDetectedWheels',
          'Detect 2 or 4 wheels before replacing them.',
        ),
      );
      return;
    }

    setSaving(true);
    try {
      const saved =
        mode === 'vendor'
          ? await wheelEditorApi.saveVendorEdit(vehicleId!, selectedWheel.id)
          : await wheelEditorApi.savePersonalEdit(modelId!, selectedWheel.id);
      setModel(saved);
      notifySuccess(t('wheelEditor.saveSuccess', 'Wheel edit saved.'));
    } catch (err: unknown) {
      notifyError(
        err instanceof Error
          ? err.message
          : t('wheelEditor.saveError', 'Could not save wheel edit.'),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="max-w-lg mx-auto space-y-4 py-12">
        <Card>
          <p className="text-sm text-red-400" role="alert">
            {error ?? t('wheelEditor.loadError', 'Could not load wheel editor.')}
          </p>
        </Card>
        <Link to={backTo}>
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="me-1 rtl:me-0 rtl:ms-1" />
            {t('common.back', 'Back')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={backTo}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} className="me-1 rtl:me-0 rtl:ms-1" />
              {t('common.back', 'Back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-mesh-text">
              {t('wheelEditor.title', 'Edit car wheels')}
            </h1>
            <p className="mt-1 text-sm text-mesh-muted">
              {t(
                'wheelEditor.subtitle',
                'Detect wheel meshes and preview a replacement wheel set.',
              )}
            </p>
          </div>
        </div>
        <Button
          type="button"
          loading={saving}
          disabled={!selectedWheel || !canReplace}
          onClick={saveSelection}
        >
          <Save size={16} />
          {t('common.save', 'Save')}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,380px)_1fr]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3">
              <Settings2 size={18} className="mt-0.5 text-mesh-gold" />
              <div>
                <h2 className="text-sm font-semibold text-mesh-text">
                  {t('wheelEditor.controls', 'Wheel options')}
                </h2>
                <p className="mt-1 text-xs text-mesh-muted">
                  {t(
                    'wheelEditor.controlsHint',
                    'Choose a wheel model to preview it on this 3D car.',
                  )}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <WheelPicker
                disabled={!canReplace}
                options={wheelOptions}
                selectedWheelId={selectedWheel?.id}
                onSelect={handleWheelSelect}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-medium uppercase tracking-wider text-mesh-muted mb-4">
              {t('threeD.status', 'Status')}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-mesh-muted">
                  {t('wheelEditor.detectedWheels', 'Detected wheels')}
                </span>
                <span className="font-semibold text-mesh-text">
                  {detection?.detectedCount ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-mesh-muted">
                  {t('wheelEditor.candidates', 'Circular candidates')}
                </span>
                <span className="font-semibold text-mesh-text">
                  {detection?.candidateCount ?? 0}
                </span>
              </div>
              <div className="rounded-[var(--radius-mesh-sm)] border border-mesh-border bg-white/[0.02] px-3 py-2 text-xs text-mesh-muted">
                {status}
              </div>
            </div>
          </Card>
        </div>

        <WheelEditorViewer
          modelUrl={model.modelUrl}
          replaceSignal={replaceSignal}
          wheelModelUrl={selectedWheel?.url}
          onDetection={handleDetection}
          onReplacementStatus={handleReplacementStatus}
        />
      </div>
    </div>
  );
}
