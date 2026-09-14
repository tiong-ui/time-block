// A big, calm pie chart that visually drains as time passes.
// No numbers, no seconds — just the shrinking colored wedge.
export default function PieTimer({ fraction, color, trackColor, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;

  const clamped = Math.max(0, Math.min(1, fraction));

  // Wedge sweeps clockwise from the top (12 o'clock) as time remains,
  // shrinking toward nothing as the fraction approaches 0.
  const wedgePath = describeWedge(cx, cy, r, clamped);

  return (
    <svg
      className="pie-timer"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Time remaining"
    >
      <circle cx={cx} cy={cy} r={r} fill={trackColor} />
      {clamped > 0 && <path d={wedgePath} fill={color} />}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth="2" />
    </svg>
  );
}

function describeWedge(cx, cy, r, fraction) {
  if (fraction >= 0.9999) {
    // Full circle — draw as two arcs since a single arc can't span 360°.
    return [
      `M ${cx} ${cy - r}`,
      `A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`,
      'Z',
    ].join(' ');
  }

  const startAngle = -90; // 12 o'clock
  const endAngle = startAngle + fraction * 360;
  const start = polarPoint(cx, cy, r, startAngle);
  const end = polarPoint(cx, cy, r, endAngle);
  const largeArcFlag = fraction > 0.5 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function polarPoint(cx, cy, r, angleDeg) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}
