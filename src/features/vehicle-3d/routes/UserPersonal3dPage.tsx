import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload } from 'lucide-react';
import {
  isThreeDMockMode,
  vehicle3dApi,
  type ThreeDJobStatusResponse,
} from '../api/vehicle3dApi';
import { LocalModelViewer } from '../../3dgeneration';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { Input } from '../../../components/ui/Input';
import { notifyError, notifySuccess } from '../../../lib/toast';

type Slot = 'front' | 'left' | 'back' | 'right';

function modelUrlHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

const SLOTS: { key: Slot; labelKey: string; fallback: string }[] = [
  { key: 'front', labelKey: 'threeD.viewFront', fallback: 'Front' },
  { key: 'left', labelKey: 'threeD.viewLeft', fallback: 'Left' },
  { key: 'back', labelKey: 'threeD.viewBack', fallback: 'Back' },
  { key: 'right', labelKey: 'threeD.viewRight', fallback: 'Right' },
];

const mockMode = isThreeDMockMode();

export function UserPersonal3dPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [files, setFiles] = useState<Partial<Record<Slot, File>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ThreeDJobStatusResponse | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  useEffect(() => {
    if (!jobId) return;
    stopPoll();
    pollRef.current = setInterval(() => {
      vehicle3dApi
        .getPersonalJob(jobId)
        .then((j) => {
          console.debug('[3D] poll', {
            jobId,
            status: j.status,
            hasModelUrl: Boolean(j.modelUrl),
            modelHost: modelUrlHost(j.modelUrl),
          });
          setJob(j);
          if (j.status === 'COMPLETED' || j.status === 'FAILED') {
            stopPoll();
            if (j.status === 'COMPLETED') {
              console.info('[3D] job completed', {
                jobId,
                modelHost: modelUrlHost(j.modelUrl),
              });
              notifySuccess(t('threeD.jobComplete', '3D model is ready.'));
            }
            if (j.status === 'FAILED') {
              console.error('[3D] job failed', { jobId, errorMessage: j.errorMessage });
              if (j.errorMessage) notifyError(j.errorMessage);
            }
          }
        })
        .catch((err: unknown) => {
          console.error('[3D] poll error', err);
          stopPoll();
        });
    }, mockMode ? 800 : 2500);
    return () => stopPoll();
  }, [jobId, stopPoll]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setJob(null);
    try {
      let res: { jobId: string };
      if (mockMode) {
        if (!modelFile) {
          notifyError(t('threeD.needGlb', 'Please upload a GLB file.'));
          return;
        }
        res = await vehicle3dApi.createPersonalJobWithModel(
          modelFile,
          title.trim() || undefined,
        );
      } else {
        const front = files.front;
        const left = files.left;
        const back = files.back;
        const right = files.right;
        if (!front || !left || !back || !right) {
          notifyError(t('threeD.needFour', 'Please upload all four views.'));
          return;
        }
        res = await vehicle3dApi.createPersonalJob(
          { front, left, back, right },
          title.trim() || undefined,
        );
      }
      setJobId(res.jobId);
      setJob({ id: res.jobId, status: 'PENDING', errorMessage: null, modelUrl: null });
      console.info('[3D] job created', { jobId: res.jobId, type: 'personal', mockMode });
      notifySuccess(
        mockMode
          ? t('threeD.mockJobStarted', 'Upload started (mock mode).')
          : t('threeD.jobStarted', 'Generation started. This may take several minutes.'),
      );
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/user/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="me-1 rtl:me-0 rtl:ms-1" />
            {t('threeD.backToDashboard', 'Dashboard')}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-mesh-text">
          {t('threeD.personalTitle', 'My car in 3D')}
        </h1>
      </div>

      <Card>
        {mockMode && (
          <p className="text-xs font-medium text-amber-400/90 mb-3 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2">
            {t('threeD.mockBadge', 'Mock mode — no Tripo credits')}
          </p>
        )}
        <p className="text-sm text-mesh-muted mb-4">
          {mockMode
            ? t(
                'threeD.personalHelpMock',
                'Testing mode: upload a ready-made .glb file. It is stored in Supabase like production models.',
              )
            : t(
                'threeD.personalHelp',
                'This is private to your account (not a public listing). Upload four views: front, left, back, right.',
              )}
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label={t('threeD.optionalTitle', 'Optional name')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('threeD.optionalTitlePh', 'e.g. My daily driver')}
          />
          {mockMode ? (
            <label className="flex flex-col gap-2 rounded-[var(--radius-mesh-sm)] border border-mesh-border bg-white/[0.02] p-4 cursor-pointer hover:border-mesh-gold/30 transition-colors">
              <span className="text-sm font-medium text-mesh-text flex items-center gap-2">
                <Upload size={16} className="text-mesh-gold" />
                {t('threeD.glbFile', '3D model (.glb)')}
              </span>
              <input
                type="file"
                accept=".glb,model/gltf-binary"
                className="text-xs text-mesh-muted file:mr-2 file:rounded file:border-0 file:bg-mesh-gold/20 file:px-2 file:py-1 file:text-mesh-text"
                onChange={(e) => setModelFile(e.target.files?.[0] ?? null)}
              />
              {modelFile && (
                <span className="text-xs text-mesh-muted truncate">{modelFile.name}</span>
              )}
            </label>
          ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {SLOTS.map(({ key, labelKey, fallback }) => (
              <label
                key={key}
                className="flex flex-col gap-2 rounded-[var(--radius-mesh-sm)] border border-mesh-border bg-white/[0.02] p-4 cursor-pointer hover:border-mesh-gold/30 transition-colors"
              >
                <span className="text-sm font-medium text-mesh-text flex items-center gap-2">
                  <Upload size={16} className="text-mesh-gold" />
                  {t(labelKey, fallback)}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="text-xs text-mesh-muted file:mr-2 file:rounded file:border-0 file:bg-mesh-gold/20 file:px-2 file:py-1 file:text-mesh-text"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setFiles((prev) => (f ? { ...prev, [key]: f } : { ...prev, [key]: undefined }));
                  }}
                />
                {files[key] && (
                  <span className="text-xs text-mesh-muted truncate">{files[key]!.name}</span>
                )}
              </label>
            ))}
          </div>
          )}
          <Button type="submit" loading={submitting}>
            {mockMode
              ? t('threeD.submitMock', 'Upload model')
              : t('threeD.submit', 'Start generation')}
          </Button>
        </form>
      </Card>

      {job && (
        <Card>
          <h2 className="text-sm font-medium text-mesh-muted mb-2">{t('threeD.status', 'Status')}</h2>
          <p className="text-mesh-text font-medium">{job.status}</p>
          {job.status !== 'COMPLETED' && job.status !== 'FAILED' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-mesh-muted">
              <Spinner size={18} />
              {t('threeD.processing', 'Processing on server…')}
            </div>
          )}
          {job.status === 'FAILED' && job.errorMessage && (
            <p className="mt-2 text-sm text-red-400">{job.errorMessage}</p>
          )}
          {job.status === 'COMPLETED' && job.modelUrl && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-mesh-muted">{t('threeD.preview', 'Preview')}</p>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <LocalModelViewer src={job.modelUrl} />
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
