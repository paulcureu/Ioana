/**
 * Obiectele de pe biroul arhitectului: calc cu schițe, creion și scalimetru.
 * Toate sunt desenate în SVG / CSS (fără imagini externe), dimensionate relativ la lățimea paginii (--pw).
 */

function Pencil() {
  return (
    <svg className="prop prop--pencil" viewBox="0 0 420 26" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pencilBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a524b" />
          <stop offset="0.32" stopColor="#3a413b" />
          <stop offset="0.34" stopColor="#2c322d" />
          <stop offset="0.66" stopColor="#262b27" />
          <stop offset="0.68" stopColor="#1b1f1c" />
          <stop offset="1" stopColor="#151816" />
        </linearGradient>
        <linearGradient id="pencilWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ecd2ad" />
          <stop offset="0.5" stopColor="#d9b585" />
          <stop offset="1" stopColor="#b98f5f" />
        </linearGradient>
        <linearGradient id="pencilLead" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b6b6b" />
          <stop offset="1" stopColor="#2a2a2a" />
        </linearGradient>
      </defs>
      {/* capăt tăiat (hexagon) */}
      <rect x="2" y="2" width="6" height="22" rx="1.2" fill="#d6b58a" />
      <rect x="6" y="2" width="330" height="22" fill="url(#pencilBody)" />
      {/* inscripție aurie */}
      <g fill="#c8ab73" opacity="0.85">
        <rect x="40" y="11.4" width="46" height="1.6" />
        <rect x="92" y="11.4" width="10" height="1.6" />
        <rect x="108" y="11.4" width="22" height="1.6" />
      </g>
      {/* lemn ascuțit, marginea vopselei ondulată */}
      <path
        d="M336 2 C340 5 336 8 340 11 C336 14 340 18 336 24 L392 15 L392 11 Z"
        fill="url(#pencilWood)"
      />
      <path d="M380 10.6 L414 13 L380 15.4 Z" fill="url(#pencilLead)" />
    </svg>
  );
}

function ScaleRuler() {
  // scalimetru triunghiular văzut de sus: o față cu gradații 1:100
  const ticks = [];
  for (let i = 0; i <= 150; i++) {
    const x = 24 + i * 3.6;
    const h = i % 10 === 0 ? 14 : i % 5 === 0 ? 9 : 5;
    ticks.push(<line key={i} x1={x} y1={4} x2={x} y2={4 + h} />);
  }
  const nums = [];
  for (let i = 0; i <= 15; i++) {
    nums.push(
      <text key={i} x={24 + i * 36} y={30} textAnchor="middle">
        {i}
      </text>
    );
  }
  return (
    <svg className="prop prop--ruler" viewBox="0 0 600 52" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="rulerFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f5ef" />
          <stop offset="0.62" stopColor="#ece9e0" />
          <stop offset="0.64" stopColor="#d8d4c9" />
          <stop offset="1" stopColor="#c9c4b8" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="600" height="52" rx="3" fill="url(#rulerFace)" />
      <rect x="0" y="32.5" width="600" height="1.2" fill="#b4573c" opacity="0.75" />
      <g stroke="#3b3a36" strokeWidth="0.8">{ticks}</g>
      <g fill="#3b3a36" fontFamily="IBM Plex Mono, monospace" fontSize="7.5">
        {nums}
      </g>
      <text x="570" y="46" fill="#3b3a36" fontFamily="IBM Plex Mono, monospace" fontSize="8" textAnchor="end">
        1:100
      </text>
    </svg>
  );
}

export default function DeskProps() {
  return (
    <div className="props" aria-hidden="true">
      <div className="prop prop--trace">
        <div className="trace__sketch" />
      </div>
      <ScaleRuler />
      <Pencil />
    </div>
  );
}
