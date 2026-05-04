import { HelpCircle } from 'lucide-react';
import type { PanelProps } from '../features/drawing/types';

export function Panel({ title, hint, children }: PanelProps) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>{title}</h2>
        {hint && (
          <span title={hint}>
            <HelpCircle size={18} />
          </span>
        )}
      </div>
      {hint && <p className="panelHint">{hint}</p>}
      {children}
    </section>
  );
}
