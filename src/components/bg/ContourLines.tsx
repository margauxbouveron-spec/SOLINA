"use client";

import { useEffect, useRef } from "react";

/**
 * Topographic contour-line background — thin curved horizontal lines
 * with subtle warping and parallax-on-pointer drift. Pure SVG, no canvas
 * tax, no shader load. Sits between the night background and the page
 * content (z-index 0).
 *
 * Inspired by enyo.co's signature wavy line texture, but in warm gold
 * tones to match SOLINA's palette.
 */

const LINES = 28; // total horizontal contour lines

function buildPath(
  index: number,
  lines: number,
  width: number,
  height: number,
  amp: number,
  freq: number,
  phase: number
) {
  // Base y position — distributed evenly with slight non-linearity for depth
  const t = index / (lines - 1);
  const y = height * (0.04 + Math.pow(t, 1.05) * 0.96);

  // Build a smooth path by sampling sine + secondary wave
  const segments = 80;
  let d = "";
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const lf = Math.sin((x / width) * freq * Math.PI + phase + index * 0.18);
    const hf = Math.sin((x / width) * freq * 2.6 * Math.PI + phase * 1.4);
    // Lines bend more at extremes, less in the middle
    const taper = 1 - Math.pow(1 - 2 * Math.abs(t - 0.5), 2);
    const yy = y + (lf * 0.7 + hf * 0.3) * amp * (0.4 + taper);
    d += i === 0 ? `M ${x.toFixed(1)} ${yy.toFixed(1)}` : ` L ${x.toFixed(1)} ${yy.toFixed(1)}`;
  }
  return d;
}

export function ContourLines() {
  const svgRef = useRef<SVGSVGElement>(null);

  // Mount-time pointer drift — translates the whole pattern slightly
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!svgRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      svgRef.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const width = 1600;
  const height = 1000;

  // Pre-compute paths once on render — each contour gets a unique phase
  const paths = Array.from({ length: LINES }, (_, i) =>
    buildPath(i, LINES, width, height, 22, 1.4 + (i % 3) * 0.2, i * 0.31)
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        // Soft radial mask — fades the lines at the very edges so they
        // don't fight the navigation chrome.
        maskImage:
          "radial-gradient(110% 90% at 50% 45%, black 50%, transparent 95%)",
        WebkitMaskImage:
          "radial-gradient(110% 90% at 50% 45%, black 50%, transparent 95%)",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
      >
        <defs>
          {/* Gold-tinted gradient stroke that fades to transparent at edges */}
          <linearGradient id="contourGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E0C275" stopOpacity="0" />
            <stop offset="20%" stopColor="#E0C275" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#E0C275" stopOpacity="0.55" />
            <stop offset="80%" stopColor="#E0C275" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#E0C275" stopOpacity="0" />
          </linearGradient>
        </defs>

        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="url(#contourGrad)"
            strokeWidth={0.55}
            fill="none"
            opacity={0.22 + (i / LINES) * 0.18}
          />
        ))}
      </svg>
    </div>
  );
}
