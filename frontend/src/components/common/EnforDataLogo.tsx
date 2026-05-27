import React from 'react';

interface Props {
  height?: number;
  showTagline?: boolean;
  variant?: 'light' | 'dark';
}

const EnforDataLogo: React.FC<Props> = ({
  height = 40,
  showTagline = false,
  variant = 'light',
}) => {
  const VW = 230;
  const VH = showTagline ? 72 : 48;
  const w = Math.round((height / VH) * VW);

  const orange    = '#C8622A';
  // On dark bg: use a muted blue-white that reads as "navy-ish" but is visible
  const dataColor = variant === 'dark' ? '#A8BDD8' : '#1B2A4A';
  const tagColor  = variant === 'dark' ? 'rgba(168,189,216,0.65)' : '#1B2A4A';

  // SVG text doesn't support mixed colors in one <text> element.
  // We position two <text> elements back-to-back with NO gap.
  // "Enfor" at Georgia 38px ≈ 105px wide (measured).
  // "data"  starts at x=105, no space.
  // Rectangle: x=100 (5px before "data"), width=128, so right edge=228.
  // Rectangle top=2, height=44 → vertically wraps the 38px text (baseline y=38).

  return (
    <svg
      width={w}
      height={height}
      viewBox={`0 0 ${VW} ${VH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Enfordata"
    >
      {/* Rectangle — starts just before "data", ends just after */}
      <rect
        x="100" y="2"
        width="128" height="44"
        rx="1"
        stroke={orange}
        strokeWidth="2"
        fill="none"
      />

      {/* "Enfor" — orange */}
      <text
        x="0" y="38"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="38"
        fontWeight="400"
        fill={orange}
        xmlSpace="preserve"
      >Enfor</text>

      {/* "data" — navy/light, NO leading space, starts right after "Enfor" */}
      <text
        x="105" y="38"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="38"
        fontWeight="400"
        fill={dataColor}
        xmlSpace="preserve"
      >data</text>

      {showTagline && (
        <text
          x="115" y="62"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="11"
          fontWeight="400"
          fill={tagColor}
          textAnchor="middle"
          letterSpacing="0.5"
        >Strong Data Smart Solution</text>
      )}
    </svg>
  );
};

export default EnforDataLogo;
