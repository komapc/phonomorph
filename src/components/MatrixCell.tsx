import React from 'react';
import type { IPASymbol, TransformationMeta } from '../data/loader';

interface MatrixCellProps {
  rowSymbol: IPASymbol;
  colSymbol: IPASymbol;
  isDiagonal: boolean;
  details?: TransformationMeta;
  inverseDetails?: TransformationMeta;
  unattested: boolean;
  getCommonalityColor: (comm: number, active: boolean) => string;
  handleCellClick: (from: string, to: string) => void;
  highlighted?: boolean;
}

const MatrixCell: React.FC<MatrixCellProps> = ({
  rowSymbol,
  colSymbol,
  isDiagonal,
  details,
  inverseDetails,
  unattested,
  getCommonalityColor,
  handleCellClick,
  highlighted
}) => {
  const active = !!details;
  const inverseActive = !!inverseDetails;

  let cellClass = 'cell-empty';
  if (isDiagonal) cellClass = 'cell-diagonal';
  else if (active) cellClass = 'cell-transformation';
  else if (inverseActive) cellClass = 'cell-inverse-transformation';
  else if (unattested) cellClass = 'cell-unattested';

  let titleText = `No data for [${rowSymbol.symbol}] → [${colSymbol.symbol}] (Click to contribute)`;
  if (active) titleText = `${details.name} [${rowSymbol.symbol}] → [${colSymbol.symbol}] (Commonality: ${details.commonality}/5)`;
  else if (inverseActive) titleText = `See inverse shift: [${colSymbol.symbol}] → [${rowSymbol.symbol}]`;
  else if (unattested) titleText = `Researched: No regular shift found for [${rowSymbol.symbol}] → [${colSymbol.symbol}]`;

  // Predictive Prefetching: Start loading the JSON when user hovers
  const handleMouseEnter = () => {
    if (active) {
      const url = `${import.meta.env.BASE_URL}data/transformations/${rowSymbol.id}_to_${colSymbol.id}.json`;
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'fetch';
      document.head.appendChild(link);
    }
  };

  // Keyboard handler for accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableDataCellElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (active) handleCellClick(rowSymbol.id, colSymbol.id);
      else if (inverseActive) handleCellClick(colSymbol.id, rowSymbol.id);
      else if (!isDiagonal && !unattested) handleCellClick(rowSymbol.id, colSymbol.id);
    }
  };

  return (
    <td
      className={`${cellClass} ${highlighted ? 'cell-highlighted' : ''}`}
      style={{
        backgroundColor: isDiagonal
          ? undefined
          : getCommonalityColor(
              active ? details.commonality : (inverseActive ? inverseDetails.commonality : 0),
              active || inverseActive
            ),
        border: highlighted ? '2px solid var(--accent-color)' : undefined,
        boxShadow: highlighted ? '0 0 10px var(--accent-color)' : undefined,
        zIndex: highlighted ? 10 : 1,
        cursor: !isDiagonal ? 'pointer' : 'default'
      }}
      role="gridcell"
      tabIndex={isDiagonal ? -1 : 0}
      aria-label={titleText}
      onClick={() => {
        if (active) handleCellClick(rowSymbol.id, colSymbol.id);
        else if (inverseActive) handleCellClick(colSymbol.id, rowSymbol.id);
        else if (!isDiagonal && !unattested) handleCellClick(rowSymbol.id, colSymbol.id);
      }}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      title={titleText}
    >
      {active && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: details.commonality >= 3 ? 'white' : 'var(--accent-color)', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '90px', textOverflow: 'ellipsis' }}>
            {details.name}
          </div>
          {details.isAllophone && (
            <div style={{ padding: '1px 4px', background: 'rgba(16, 185, 129, 0.4)', border: '1px solid var(--success-color)', borderRadius: '4px', fontSize: '0.5rem', fontWeight: 800, color: 'white', marginTop: '2px' }}>
              ALLO
            </div>
          )}
        </div>
      )}
      {isDiagonal && (
        <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 900 }}>
          [{rowSymbol.symbol}]
        </div>
      )}
      {inverseActive && inverseDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center', opacity: 0.55 }}>
          <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '90px', textOverflow: 'ellipsis' }}>
            ← {inverseDetails.name}
          </div>
          {inverseDetails.isAllophone && (
            <div style={{ padding: '0px 3px', border: '1px solid var(--text-secondary)', borderRadius: '3px', fontSize: '0.45rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '1px' }}>
              ALLO
            </div>
          )}
        </div>
      )}
      {unattested && !active && !inverseActive && (
        <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>
          X
        </div>
      )}
    </td>
  );
};

export default React.memo(MatrixCell);
