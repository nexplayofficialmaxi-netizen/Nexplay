import React, { useMemo } from 'react';
import { CircuitSpec } from '../types/game';
import { compileTrack } from '../engine/trackMath';

interface CircuitMapSvgProps {
  circuit: CircuitSpec;
  className?: string;
  accentColor?: string;
}

export const CircuitMapSvg: React.FC<CircuitMapSvgProps> = ({
  circuit,
  className = 'w-full h-36',
  accentColor = '#E11D48',
}) => {
  const pts = useMemo(() => {
    const compiled = compileTrack(circuit, 120);
    return compiled.minimapPoints;
  }, [circuit]);

  const pointsAttr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const startPt = pts[0] || { x: 50, y: 50 };

  return (
    <svg viewBox="0 0 100 100" className={className} aria-label={`Mapa de ${circuit.name}`}>
      <polygon
        points={pointsAttr}
        fill="none"
        stroke="#1E293B"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <polygon
        points={pointsAttr}
        fill="none"
        stroke={accentColor}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <circle
        cx={startPt.x}
        cy={startPt.y}
        r="4.2"
        fill="#F8FAFC"
        stroke="#090B10"
        strokeWidth="1.5"
      />
    </svg>
  );
};
