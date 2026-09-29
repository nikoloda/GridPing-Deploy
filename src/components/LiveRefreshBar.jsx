import { BUS_ID, PQ_PROFILE } from '../utils/gridData';

const CASE_LABEL = PQ_PROFILE === 'distribution' ? '8500 Node case' : 'case2383wp';

/** Shared live-status dot + manual refresh button shown at the top of data pages. */
export default function LiveRefreshBar({ isLive, isLoading, onRefresh, spinning }) {
  return (
    <div style={styles.row}>
      <span style={styles.location}>
        <svg width="9" height="13" viewBox="0 0 10 14" style={{ marginRight: '3px', verticalAlign: 'middle', flexShrink: 0 }}>
          <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" fill="#aaa"/>
        </svg>
        Daniel's Smart Meter · <em>{CASE_LABEL}</em>
      </span>
      <span style={styles.status}>
        <span style={{ ...styles.dot, background: isLive ? '#22c55e' : '#d1d5db' }} />
        {isLoading ? 'Updating…' : isLive ? 'Live' : 'No data'}
      </span>
      <button
        onClick={onRefresh}
        title="Refresh data"
        style={{
          ...styles.btn,
          transform: spinning ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      >
        ↻
      </button>
    </div>
  );
}

const styles = {
  row: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  location: {
    fontSize: '11px',
    color: '#aaa',
    marginRight: 'auto',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: '#888',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  btn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.5s ease',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
  },
};
