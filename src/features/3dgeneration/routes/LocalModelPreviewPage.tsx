import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LocalModelViewer } from '../LocalModelViewer';
import { DEFAULT_LOCAL_MODEL_SRC } from '../constants';

/**
 * Preview static files from `frontend/public/assets/3d/`.
 * Example: `/local-3d?src=/assets/3d/demo.glb`
 */
export function LocalModelPreviewPage() {
  const [params] = useSearchParams();
  const src = useMemo(() => {
    const raw = params.get('src')?.trim();
    return raw && raw.length > 0 ? raw : DEFAULT_LOCAL_MODEL_SRC;
  }, [params]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Local 3D preview</h1>
        <p className="mt-1 text-sm text-white/65">
          Showing:{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-100/90">{src}</code>
        </p>
        <p className="mt-2 text-xs text-white/50">
          Files live under <code className="rounded bg-white/10 px-1">frontend/public/assets/3d/</code>. Supported:{' '}
          <code className="rounded bg-white/10 px-1">.glb</code>, <code className="rounded bg-white/10 px-1">.gltf</code>,{' '}
          <code className="rounded bg-white/10 px-1">.obj</code>, <code className="rounded bg-white/10 px-1">.stl</code>.
          Override with <code className="rounded bg-white/10 px-1">?src=/assets/3d/yourfile.stl</code>
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <LocalModelViewer src={src} />
      </div>
    </div>
  );
}
