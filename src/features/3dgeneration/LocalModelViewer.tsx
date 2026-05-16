import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LocalModelScene } from './LocalModelScene';
import { getModelExtension } from './modelExtension';

class LocalModelErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LocalModelViewer]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 p-6 text-center text-sm text-red-100/90">
          <p className="font-medium">Could not load the 3D file.</p>
          <p className="max-w-md text-xs text-red-100/70">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/15"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface LocalModelViewerProps {
  /** Public URL, e.g. `/assets/3d/demo.glb` */
  src: string;
  className?: string;
}

export function LocalModelViewer({ src, className }: LocalModelViewerProps) {
  const ext = getModelExtension(src);
  if (!ext) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center text-sm text-amber-100/90">
        Unsupported or missing file extension. Use <code className="rounded bg-black/30 px-1">.glb</code>,{' '}
        <code className="rounded bg-black/30 px-1">.gltf</code>, <code className="rounded bg-black/30 px-1">.obj</code>, or{' '}
        <code className="rounded bg-black/30 px-1">.stl</code>.
      </div>
    );
  }

  return (
    <LocalModelErrorBoundary>
      <LocalModelScene assetUrl={src} extension={ext} className={className ?? 'h-[min(70vh,560px)] w-full'} />
    </LocalModelErrorBoundary>
  );
}
