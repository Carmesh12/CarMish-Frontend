import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';

export function AuthLayout({ children, hideHeader = false }: { children: ReactNode; hideHeader?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-mesh-bg auth-mesh-bg">
      {!hideHeader && (
        <header className="relative z-10 flex items-center justify-between px-6 py-4">
          <Link to="/vehicles" className="flex items-center gap-2 group">
            <Car
              size={28}
              className="text-mesh-gold group-hover:drop-shadow-[0_0_8px_rgba(212,168,83,0.4)] transition-all duration-300"
            />
            <span className="text-xl font-bold tracking-tight text-gradient-gold">CarMesh</span>
          </Link>
          <LanguageSwitcher compact />
        </header>
      )}
      <main className="relative z-10 flex-1 w-full">
        <div className="w-full h-full animate-[modalIn_400ms_ease-out]">
          {children}
        </div>
      </main>
    </div>
  );
}
