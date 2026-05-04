type Props = {
  /** Diameter in px */
  size?: number;
  /** "ne" → ↗ diagonal up-right · "e" → → straight right */
  dir?: "ne" | "e";
  className?: string;
  strokeWidth?: number;
};

/**
 * Phosphor-light style arrow, inline SVG. No icon-library dep.
 * Used inside the Cta button-in-button trailing circle.
 */
export function Arrow({ size = 14, dir = "e", className = "", strokeWidth = 1.4 }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {dir === "e" ? (
        <>
          <path d="M5 12h14" />
          <path d="M13 5l7 7-7 7" />
        </>
      ) : (
        <>
          <path d="M7 17L17 7" />
          <path d="M9 7h8v8" />
        </>
      )}
    </svg>
  );
}
