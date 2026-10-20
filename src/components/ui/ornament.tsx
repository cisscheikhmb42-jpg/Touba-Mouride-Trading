/**
 * Frise d'étoiles à huit branches, reprise de l'esprit de la frise
 * dorée du logo. Purement décorative.
 */
export function StarFrieze({ count = 4, className = "" }: { count?: number; className?: string }) {
  const unit = 28;
  const width = unit * count;
  return (
    <svg
      viewBox={`0 0 ${width} 20`}
      width={width}
      height={20}
      aria-hidden="true"
      className={`text-gold-bright ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <line x1="0" y1="10" x2={width} y2="10" strokeOpacity="0.6" />
      {Array.from({ length: count }, (_, i) => {
        const cx = unit * i + unit / 2;
        return (
          <g key={i} transform={`translate(${cx} 10)`}>
            <rect x="-6" y="-6" width="12" height="12" />
            <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" />
            <circle r="2.2" fill="currentColor" stroke="none" />
          </g>
        );
      })}
    </svg>
  );
}

export function EightPointStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-12 -12 24 24" aria-hidden="true" className={className} fill="currentColor">
      <rect x="-7" y="-7" width="14" height="14" />
      <rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" />
    </svg>
  );
}

/** Motif géométrique très discret pour les fonds de section. */
export function PatternBackground({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      <defs>
        <pattern id="tmt-stars" width="56" height="56" patternUnits="userSpaceOnUse">
          <g transform="translate(28 28)" fill="none" stroke="currentColor" strokeWidth="0.8">
            <rect x="-9" y="-9" width="18" height="18" />
            <rect x="-9" y="-9" width="18" height="18" transform="rotate(45)" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tmt-stars)" />
    </svg>
  );
}
