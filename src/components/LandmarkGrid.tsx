import { Link } from 'react-router-dom';
import type { LandmarkItem } from '../data/transformPayload';

/** Cards linking the landmark shifts (the Landmarks tab). */
export function LandmarkGrid({ items }: { items: LandmarkItem[] }) {
  return (
    <div className="landmarks-grid">
      {items.map((t) => {
        const [f, to] = t.id.split('_to_');
        return (
          <Link key={t.id} to={`/transform/${f}/${to}`} className="landmark-card">
            <div className="landmark-symbol">{t.from} → {t.to}</div>
            <div className="landmark-name">{t.name}</div>
          </Link>
        );
      })}
    </div>
  );
}
