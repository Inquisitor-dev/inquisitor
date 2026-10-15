import React from 'react';
import styles from '../../map.module.scss';
import { expandPath, type Point, type RoadNetwork } from '../../roads';
import { smoothPath } from '../../walkPath';

interface RoadDebugOverlayProps {
  roads: RoadNetwork;
  image: { width: number; height: number };
}

// Geliştirici aracı: yol ağını ve düğümleri haritanın üstünde gösterir
export default function RoadDebugOverlay({ roads, image }: RoadDebugOverlayProps) {
  return (
    <svg
      className={styles.roadDebug}
      viewBox={`0 0 ${image.width} ${image.height}`}
      preserveAspectRatio="none"
    >
      {roads.edges.map(([a, b]) => (
        <polyline
          key={`${a}-${b}`}
          points={smoothPath(expandPath(roads, [a, b]), 6)
            .map((p: Point) => `${p.x},${p.y}`)
            .join(' ')}
        />
      ))}
      {Object.entries(roads.nodes).map(([id, p]) => (
        <g key={id}>
          <circle cx={p.x} cy={p.y} r={9} />
          <text x={p.x + 14} y={p.y + 6}>
            {id}
          </text>
        </g>
      ))}
    </svg>
  );
}
