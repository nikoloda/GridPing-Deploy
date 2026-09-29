import { useState } from 'react';
import { pqToPercent, pqLabel, parseDbTime, formatDbTime, PQ_PROFILE } from '../utils/gridData';

const columns = [
  { key: 'time',          label: 'Time' },
  { key: 'powerQuality',  label: 'Bus PQ' },
  { key: 'outageState',   label: 'Voltage Status' },
  { key: 'powerLost', label: 'Power Lost' },
];

// Direction-neutral fallback (used only if raw value missing)
function deriveOutageState(pqPct) {
  if (pqPct <= 19) return 'Critical';
  if (pqPct <= 49) return 'Poor';
  if (pqPct <= 79) return 'Normal Load';
  return 'Ideal';
}

function mapRow(row) {
  const pqPct = pqToPercent(row.power_quality, PQ_PROFILE);
  return {
    time: row.record_time
      ? formatDbTime(row.record_time, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '—',
    powerQuality: pqPct,
    outageState: row.power_quality != null ? pqLabel(row.power_quality, PQ_PROFILE) : deriveOutageState(pqPct),
    // Quality Alert: only truly critical (beyond ANSI limits)
    powerLost: pqPct <= 19 ? 'Yes' : 'No',
  };
}

const PREVIEW_COUNT = 5;

export default function PowerQualityTable({ rows = [] }) {
  const [expanded, setExpanded] = useState(false);

  const sortedRows = [...rows].sort(
    (a, b) => parseDbTime(b.record_time) - parseDbTime(a.record_time)
  );
  const allTableRows = sortedRows.map(mapRow);
  const visibleRows = expanded ? allTableRows : allTableRows.slice(0, PREVIEW_COUNT);
  const hasMore = allTableRows.length > PREVIEW_COUNT;

  const mostRecentTime = sortedRows.length ? sortedRows[0].record_time : null;

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Power Quality Data</h2>
      <p style={{ marginTop: 0, marginBottom: 8, fontSize: '12px', color: '#555' }}>
        Last Updated:{' '}
        {mostRecentTime ? formatDbTime(mostRecentTime) : 'No data'}
      </p>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table
          cellPadding="10"
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '6px',
            fontSize: '11px',
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ backgroundColor: '#d0d0d0', color: 'black', borderRadius: '6px' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', backgroundColor: '#e8e8e8', borderRadius: '6px' }}>
                  Loading…
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => (
                <tr key={index}>
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key}
                      style={{
                        backgroundColor: '#e8e8e8',
                        color: 'black',
                        borderRadius: '6px',
                        fontWeight: colIndex === 0 ? 'bold' : 'normal',
                      }}
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            marginTop: '6px',
            padding: '8px 0',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#555',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
        >
          {expanded ? 'Show less' : `Show all ${allTableRows.length} readings`}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="M2 4.5L7 9.5L12 4.5" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
