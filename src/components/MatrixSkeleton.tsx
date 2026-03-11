/**
 * MatrixSkeleton - Loading skeleton for the IPA matrix
 * Displays placeholder rows/cols while data loads
 */
export function MatrixSkeleton() {
  const cols = 8;
  const rows = 6;

  return (
    <div className="matrix-wrapper" style={{ minHeight: '400px' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-cell {
          background: linear-gradient(
            90deg,
            var(--surface-hover) 0%,
            var(--surface-color) 20%,
            var(--surface-hover) 40%,
            var(--surface-hover) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
          height: 3rem;
          border-radius: 4px;
        }
      `}</style>

      <table className="ipa-table">
        <thead>
          <tr>
            <th className="row-header" style={{ width: '80px' }}>
              <div className="skeleton-cell" style={{ width: '60px' }} />
            </th>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={`col-${i}`} style={{ width: '100px' }}>
                <div className="skeleton-cell" style={{ width: '80px' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={`row-${rowIdx}`}>
              <td className="row-header">
                <div className="skeleton-cell" style={{ width: '60px' }} />
              </td>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={`cell-${rowIdx}-${colIdx}`}>
                  <div className="skeleton-cell" style={{ width: '70px' }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * CardSkeleton - Loading skeleton for detail cards
 */
export function CardSkeleton() {
  return (
    <div className="card">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-line {
          background: linear-gradient(
            90deg,
            var(--surface-hover) 0%,
            var(--surface-color) 20%,
            var(--surface-hover) 40%,
            var(--surface-hover) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
          height: 1rem;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }
        .skeleton-title {
          height: 1.5rem;
          margin-bottom: 1rem;
        }
        .skeleton-paragraph {
          margin-bottom: 1.5rem;
        }
      `}</style>

      {/* Header skeleton */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <div className="skeleton-title" style={{ width: '100px' }} />
        <div className="skeleton-title" style={{ width: '30px' }} />
        <div className="skeleton-title" style={{ width: '100px' }} />
        <div style={{ marginLeft: 'auto', width: '150px' }}>
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      </div>

      {/* Tags skeleton */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`tag-${i}`} className="skeleton-line" style={{ width: '80px', height: '0.75rem' }} />
        ))}
      </div>

      {/* Content sections */}
      {Array.from({ length: 3 }).map((_, sectionIdx) => (
        <div key={`section-${sectionIdx}`} style={{ marginBottom: '2rem' }}>
          <div className="skeleton-title" style={{ width: '150px' }} />
          <div className="skeleton-paragraph">
            {Array.from({ length: 3 }).map((_, lineIdx) => (
              <div key={`line-${lineIdx}`} className="skeleton-line" style={{ marginBottom: '0.5rem' }} />
            ))}
            <div className="skeleton-line" style={{ width: '80%', marginBottom: 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
