/**
 * Ornements inspirés du logo : la frise dorée d'étoiles à huit branches
 * et le sac turquoise. Purement décoratifs (aria-hidden).
 */

/** Frise d'étoiles à huit branches reliées par un filet (comme sous le nom du logo). */
export function StarFrieze({
  count = 4,
  className = "",
  tone = "gold",
}: {
  count?: number;
  className?: string;
  tone?: "gold" | "ink";
}) {
  const unit = 24;
  const width = unit * count;
  return (
    <svg
      viewBox={`0 0 ${width} 18`}
      width={width}
      height={18}
      aria-hidden="true"
      className={`${tone === "gold" ? "text-gold-bright" : "text-ink/70"} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    >
      <line x1="0" y1="9" x2={width} y2="9" strokeOpacity="0.55" />
      {Array.from({ length: count }, (_, i) => (
        <g key={i} transform={`translate(${unit * i + unit / 2} 9)`}>
          <polygon points="0.00,-7.00 -1.19,-2.86 -4.95,-4.95 -2.86,-1.19 -7.00,-0.00 -2.86,1.19 -4.95,4.95 -1.19,2.86 -0.00,7.00 1.19,2.86 4.95,4.95 2.86,1.19 7.00,0.00 2.86,-1.19 4.95,-4.95 1.19,-2.86" fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  );
}

export function EightPointStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-8 -8 16 16" aria-hidden="true" className={className} fill="currentColor">
      <polygon points="0.00,-7.00 -1.19,-2.86 -4.95,-4.95 -2.86,-1.19 -7.00,-0.00 -2.86,1.19 -4.95,4.95 -1.19,2.86 -0.00,7.00 1.19,2.86 4.95,4.95 2.86,1.19 7.00,0.00 2.86,-1.19 4.95,-4.95 1.19,-2.86" />
    </svg>
  );
}

/** Silhouette du sac du logo (sans le minaret, qui appartient au logo officiel). */
export function BagMark({ className = "", tone = "brand" }: { className?: string; tone?: "brand" | "ink" }) {
  const color = tone === "brand" ? "#0fbddf" : "#0b2a33";
  return (
    <svg viewBox="0 0 48 56" aria-hidden="true" className={className}>
      <path d="M15 17V14a9 9 0 0 1 18 0v3" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M6 17h36l-2 34.5a3 3 0 0 1-3 2.5H11a3 3 0 0 1-3-2.5Z" fill={color} />
    </svg>
  );
}
