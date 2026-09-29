// gridData.js drives the conversion of raw power_quality values (Δv in per-unit) into a 0–100% health score.
// Additionally, it sets the observed bus and profile (distribution or transmission) which determines which DB values are shown.

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);


// Phase A residential meter at SX_293471A (Primary node 293471) from IEEE 8500 distribution grid
export const DISTRIBUTION_BUS_ID = 293471;
// Bus ID #6 in Poland case2383wp.m transmission grid
export const TRANSMISSION_BUS_ID = 6;


// Toggle observed bus in the UI, changing this which DB values are shown
export const BUS_ID = DISTRIBUTION_BUS_ID;

// String which denotes which grid type is being observed
export const PQ_PROFILE = BUS_ID === DISTRIBUTION_BUS_ID ? 'distribution' : 'transmission';


// Current UTC timestamp string for use as a Lambda target_time.
export function utcNow() {
    return dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
}

// Normalise the gridData shape used across graph components.
export function normalizeGridRows(gridData) {
    if (!gridData) return [];
    return Array.isArray(gridData?.rows) ? gridData.rows : [gridData];
}

// Piecewise linear interpolation between two points to map pq to a percentage
function lerp(x, x0, x1, y0, y1) {
    const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
    return y0 + t * (y1 - y0);
}


// If global pq drops 0.30 p.u. below ideal 1p.u., grid health is 0% (global outage)
const DIST_SAG_PU_FOR_ZERO_HEALTH = 0.30;

// Distribution: v (p.u.) = meter V − expected daily low V → 0–100% Grid Health.
// Transmission: v (p.u.) = meter V − expected daily high V (~1.0 p.u.) → piecewise linear ANSI bands.
export function pqLabel(rawPq, profile) {
    const v = Number(rawPq);
    if (!Number.isFinite(v)) return 'No Data';
    if (v <= -1.0) return 'Outage';
    const pct = pqToPercent(v, profile);
    if (profile === 'distribution') {
        if (pct >= 95 && v >= 0) return 'Off-peak';
        if (pct >= 75) return 'Moderate load';
        if (pct >= 45) return 'Peak stress';
        return 'Heavy stress';
    }
    const high = v > 0;
    if (pct >= 95) return 'Ideal';
    if (pct >= 80) return high ? 'Slightly High' : 'Slightly Low';
    if (pct >= 50) return high ? 'Above Normal'  : 'Below Normal';
    if (pct >= 20) return high ? 'Well Above'    : 'Well Below';
    return               high  ? 'Critical High' : 'Critical Low';
}

// Converts a raw power_quality value (Δv in per-unit) into a 0–100% health score.
// Δv = measured voltage minus the ideal reference voltage, in per-unit (1.0 p.u. = nominal).
//   Δv = 0   → perfectly on target
//   Δv > 0   → voltage is above ideal  (overvoltage)
//   Δv < 0   → voltage is below ideal  (sag / undervoltage)
//   Δv ≤ −1  → outage (bus is de-energised)
export function pqToPercent(pq, profile) {
    const v = Number(pq);
    if (!Number.isFinite(v)) return 0;  // missing / null data → 0%
    if (v <= -1.0) return 0;            // outage → 0%

    // ── Distribution mode (IEEE 8500-Node case) ───────────────────────────────
    // The distribution grid runs close to nominal by design, so any positive Δv
    // is treated as healthy (100%). Only downward sags are penalised, scaling
    // linearly from 100% at Δv = 0 down to 0% at Δv = −DIST_SAG_PU_FOR_ZERO_HEALTH.
    if (profile === 'distribution') {
        if (v >= 0) return 100;
        const sag = -v;   // make the sag magnitude positive
        return Math.round(
            Math.max(0, 100 * (1 - sag / DIST_SAG_PU_FOR_ZERO_HEALTH)),
        );
    }

    // ── Transmission mode (IEEE case2383wp) ───────────────────────────────────
    // Transmission buses are sensitive to both over- and under-voltage, so both
    // directions are penalised using ANSI-style piecewise linear bands.
    // ANSI-inspired piecewise bands on ±Δv ─────
    // lerp(v, 0, 0.01, 100, 90) → Δv 0…0.01 p.u. maps to 100→90%
    if (v >= 0) {
        // Overvoltage: small deviations tolerated, large ones collapse to 0%
        if (v <= 0.010) return Math.round(lerp(v, 0,     0.010, 100, 90));
        if (v <= 0.030) return Math.round(lerp(v, 0.010, 0.030,  90, 60));
        if (v <= 0.060) return Math.round(lerp(v, 0.030, 0.060,  60, 10));
        return Math.max(0, Math.round(lerp(v, 0.060, 0.100, 10, 0)));
    }
    // Undervoltage: same idea but more lenient at small sags, steeper at large ones
    const a = -v;   // make the sag magnitude positive
    if (a <= 0.010) return Math.round(lerp(a, 0,     0.010, 100, 90));
    if (a <= 0.050) return Math.round(lerp(a, 0.010, 0.050,  90, 50));
    if (a <= 0.070) return Math.round(lerp(a, 0.050, 0.070,  50, 20));
    if (a <= 0.200) return Math.round(lerp(a, 0.070, 0.200,  20,  0));
    return 0;   // beyond 0.2 p.u. sag → 0%
}

// Parse a DB timestamp string as UTC using dayjs.
// dayjs.utc() handles "2026-06-05 00:33:55" and ISO formats reliably.
export function parseDbTime(str) {
    if (!str) return new Date(NaN);
    return dayjs.utc(String(str)).toDate();
}

// Format a DB timestamp for display in UTC — matches what the DB stores.
export function formatDbTime(str, opts = {}) {
    const d = parseDbTime(str);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString([], { timeZone: 'UTC', ...opts });
}
