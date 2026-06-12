import type { CSSProperties } from "react";

interface IconProps {
  name: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, className = "", style }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={style}>
      {name}
    </span>
  );
}
