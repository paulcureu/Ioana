import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P): P => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
  ...p,
});

export const IconPrev = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconNext = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
export const IconFirst = (p: P) => (
  <svg {...base(p)}>
    <path d="M17 5l-7 7 7 7M7 5v14" />
  </svg>
);
export const IconToc = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth={2.4} />
  </svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="7.5" height="5.5" rx="0.8" />
    <rect x="13" y="5" width="7.5" height="5.5" rx="0.8" />
    <rect x="3.5" y="13.5" width="7.5" height="5.5" rx="0.8" />
    <rect x="13" y="13.5" width="7.5" height="5.5" rx="0.8" />
  </svg>
);
export const IconZoom = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5M10.5 8v5M8 10.5h5" />
  </svg>
);
export const IconZoomOut = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5M8 10.5h5" />
  </svg>
);
export const IconExpand = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const IconShrink = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </svg>
);
export const IconSound = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
  </svg>
);
export const IconMute = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" />
  </svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconMagnify = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5" />
  </svg>
);
