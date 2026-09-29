import { useState, useEffect } from 'react';
import { useGlobalGridState } from '../hooks/useGridData';
import { pqToPercent, utcNow, PQ_PROFILE } from '../utils/gridData';

export default function GridWidePQ() {
  const [targetTime, setTargetTime] = useState(utcNow);

  useEffect(() => {
    const id = setInterval(() => setTargetTime(utcNow()), 30000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading } = useGlobalGridState(targetTime);

  const pqPct  = pqToPercent(data?.power_quality, PQ_PROFILE);
  const isHigh = (data?.power_quality ?? 0) > 0;

  let stage;
  if (isLoading || !data) {
    stage = { bg: '#f5f5f5', border: '#aaa', label: 'Loading…', text: '' };
  } else if (pqPct <= 19) {
    stage = {
      bg: '#ffd6d6', border: '#d32f2f', label: 'Critical',
      text: isHigh ? 'Significantly higher voltage than expected' : 'Significantly lower voltage than expected',
    };
  } else if (pqPct <= 49) {
    stage = {
      bg: '#fff4cc', border: '#f2c300', label: 'Poor',
      text: isHigh ? 'Higher voltage than expected' : 'Lower voltage than expected',
    };
  } else if (pqPct <= 79) {
    stage = {
      bg: '#e8f4c6', border: '#b9d84a', label: 'Fair',
      text: isHigh ? 'Slightly higher voltage than expected' : 'Slightly lower voltage than expected',
    };
  } else if (pqPct <= 94) {
    stage = {
      bg: '#d9f5dd', border: '#2e7d32', label: 'Normal',
      text: isHigh ? 'Slightly higher voltage than expected' : 'Slightly lower voltage than expected',
    };
  } else {
    stage = {
      bg: '#c8f5d0', border: '#1b5e20', label: 'Ideal',
      text: 'Ideal voltage conditions',
    };
  }

  return (
    <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: stage.bg, border: `3px solid ${stage.border}`, color: '#111' }}>
      <h4 style={{ margin: '0 0 6px 0' }}>Poland Grid Power Quality:</h4>
      <p style={{ margin: 0, fontWeight: 700, fontSize: '20px', textAlign: 'center' }}>{stage.label}</p>
      {stage.text ? <p style={{ margin: '2px 0 0 0', fontSize: '13px', textAlign: 'center' }}>{stage.text}</p> : null}
    </div>
  );
}
