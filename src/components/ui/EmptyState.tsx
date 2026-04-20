import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 blur-2xl opacity-30 bg-gradient-to-br from-mesh-gold/40 to-mesh-accent/30 rounded-full scale-150" />
        <div className="relative text-mesh-muted/30">
          {icon || <Inbox size={48} />}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-mesh-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-mesh-muted max-w-sm mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}
