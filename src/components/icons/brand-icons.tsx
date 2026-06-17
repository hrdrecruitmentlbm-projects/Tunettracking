import * as React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const base = (size = 20): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export function TunetMark({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      {/* A "T" formed by signal arcs */}
      <path d="M3 7h18" />
      <path d="M12 7v14" />
      <path d="M5 11a7 7 0 0 1 0 6" opacity="0.5" />
      <path d="M19 11a7 7 0 0 1 0 6" opacity="0.5" />
      <circle cx="12" cy="21" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SignalTower({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M5 12.55a11 11 0 0 1 14 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" opacity="0.5" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12" y2="20" />
      <path d="M12 20l-2-4h4l-2 4z" fill="currentColor" />
    </svg>
  );
}

export function PipelineArrow({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M7 12h10" strokeDasharray="2 2" />
    </svg>
  );
}
