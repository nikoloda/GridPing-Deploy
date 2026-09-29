import { pqToPercent, formatDbTime, PQ_PROFILE } from '../utils/gridData';

/** Apply the right formatter based on field name + value type. */
function formatValue(key, value) {
  if (value == null) return '—';

  // "converges" field: converges=1 means grid converged (no outage) → invert
  if (/^converges$/i.test(key)) {
    const isConverged = value === 1 || value === true || value === '1' || String(value).toLowerCase() === 'true';
    return isConverged ? 'No' : 'Yes';
  }

  // Native JSON booleans
  if (typeof value === 'boolean') return value ? 'true' : 'false';

  // PQ fields: small decimal → percent via pqToPercent
  if (/pq|quality/i.test(key) && typeof value === 'number') {
    return `${pqToPercent(value, PQ_PROFILE)}%`;
  }

  // Timestamp fields
  if (/time|date/i.test(key) && typeof value === 'string') {
    return formatDbTime(value);
  }

  // Boolean-like integer (0/1) fields
  if (/outag/i.test(key) && (value === 0 || value === 1)) {
    return value ? 'true' : 'false';
  }

  return String(value);
}

/** Prettify snake_case / camelCase keys for display. */
function labelFromKey(key) {
  if (/^converges$/i.test(key)) return 'Global Outage';
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function GlobalStateCard({ data }) {
  if (!data) {
    return (
      <div style={styles.card}>
        <p style={{ color: '#888', textAlign: 'center' }}>Loading global state…</p>
      </div>
    );
  }

  const entries = Object.entries(data).filter(([key]) => !/_id$/i.test(key) && !/^id$/i.test(key));

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Global Grid State</h3>
      <table style={styles.table} cellPadding="10">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <td style={styles.labelCell}>{labelFromKey(key)}</td>
              <td style={styles.valueCell}>{formatValue(key, value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '16px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    margin: '0 auto',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#111',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '6px',
    fontSize: '13px',
  },
  labelCell: {
    backgroundColor: '#d0d0d0',
    color: '#000',
    fontWeight: 'bold',
    borderRadius: '6px',
    width: '45%',
  },
  valueCell: {
    backgroundColor: '#e8e8e8',
    color: '#000',
    borderRadius: '6px',
  },
};
