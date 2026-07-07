const WIDTH = 600;
const HEIGHT = 80;
const PADDING = 4;

export function ValueSparkline({ points }: { points: { at: string; valueCents: number }[] }) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.valueCents);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = PADDING + (i / (points.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - ((p.valueCents - min) / range) * (HEIGHT - PADDING * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-20 w-full text-neutral-900 dark:text-neutral-100">
      <polyline points={coords.join(" ")} fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}
