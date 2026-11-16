/** Key to the matrix cell colours and marks. Mirrors MatrixCell / getCommonalityColor. */
const COMMONALITY = [
  { level: 1, alpha: 0.1 },
  { level: 2, alpha: 0.2 },
  { level: 3, alpha: 0.35 },
  { level: 4, alpha: 0.5 },
  { level: 5, alpha: 0.7 },
];

export const MatrixLegend = () => (
  <div className="matrix-legend" aria-label="Matrix legend">
    <span className="legend-item">
      <span className="legend-scale" title="Commonality 1 (rare) to 5 (very common) across the world's languages">
        <span className="legend-end">Rare</span>
        {COMMONALITY.map(c => (
          <span key={c.level} className="legend-swatch" style={{ background: `rgba(79, 70, 229, ${c.alpha})` }} aria-label={`Commonality ${c.level}`} />
        ))}
        <span className="legend-end">Common</span>
      </span>
    </span>
    <span className="legend-item"><span className="legend-swatch legend-inverse">←</span> Only the reverse shift is documented</span>
    <span className="legend-item"><span className="legend-swatch legend-unattested">X</span> Researched, no regular shift found</span>
    <span className="legend-item"><span className="legend-badge">ALLO</span> Allophone (ALLO+ also historical)</span>
    <span className="legend-item"><span className="legend-swatch legend-empty" /> Not yet researched: click to suggest</span>
  </div>
);

export default MatrixLegend;
