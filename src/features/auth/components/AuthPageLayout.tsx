import type { ReactNode } from 'react';

type AuthPageLayoutProps = {
  heroTagline: string;
  children: ReactNode;
};

export function AuthPageLayout({ heroTagline, children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-mesh-bg">
      <aside className="relative lg:w-[52%] min-h-[32vh] lg:min-h-screen flex flex-col justify-center items-center px-10 py-16 lg:py-12 bg-mesh-surface border-b border-mesh-border lg:border-b-0 lg:border-r overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(var(--color-mesh-border) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-mesh-border) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
          aria-hidden
        />
        <div className="relative z-10 max-w-xl text-center lg:text-left">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-mesh-gold font-medium mb-5">
            CarMesh
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-mesh-text tracking-tight leading-[1.1]">
            Precision for every drive.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-mesh-muted font-light leading-relaxed max-w-md mx-auto lg:mx-0">
            {heroTagline}
          </p>
          <div className="mt-10 h-px w-16 bg-mesh-gold/80 mx-auto lg:mx-0" aria-hidden />
        </div>
      </aside>

      <main className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-16">
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">{children}</div>
      </main>
    </div>
  );
}
