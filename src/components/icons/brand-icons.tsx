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

export function TuTrackMark({ size = 20, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      {/* A "T" where the stem is a location pin */}
      <path d="M7 5h10" strokeWidth="2" />
      <path d="M12 5C12 5 8 9 8 13a4 4 0 0 0 8 0c0-4-4-8-4-8z" fill="currentColor" stroke="none" opacity="0.85" />
      <circle cx="12" cy="13" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
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
