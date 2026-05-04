"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { Arrow } from "./Arrow";

type Variant = "solid" | "ghost";

type CommonProps = {
  children: React.ReactNode;
  variant?: Variant;
  arrow?: "e" | "ne" | "none";
  className?: string;
  fullWidth?: boolean;
};

type LinkCta = CommonProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "href" | "className" | "children"
  >;

type ButtonCta = CommonProps & {
  href?: undefined;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

type Props = LinkCta | ButtonCta;

/**
 * Button-in-button CTA.
 * - Pill body with generous padding, custom cubic-bezier transition
 * - Trailing arrow nested in its own circular wrapper that translates +
 *   scales on hover (magnetic micro-physics)
 * - Tactile :active push (scale 0.985)
 */
export function Cta({
  children,
  variant = "solid",
  arrow = "e",
  className = "",
  fullWidth = false,
  ...rest
}: Props) {
  const base =
    "group relative inline-flex items-center gap-3 rounded-full pl-6 pr-2 py-2 text-[11px] uppercase tracking-[0.32em] " +
    "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.985] " +
    (fullWidth ? "w-full justify-between " : "");

  const skin =
    variant === "solid"
      ? "bg-cream text-night hover:bg-cream/90"
      : "bg-transparent text-cream ring-1 ring-inset ring-cream/25 hover:ring-cream/55";

  const inner =
    "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] " +
    "group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-[1.06] " +
    (variant === "solid"
      ? "bg-night/10 text-night group-hover:bg-night/15"
      : "bg-cream/[0.06] text-cream group-hover:bg-cream/[0.12]");

  const content = (
    <>
      <span className="leading-none">{children}</span>
      {arrow !== "none" && (
        <span className={inner}>
          <Arrow dir={arrow} />
        </span>
      )}
    </>
  );

  if ("href" in rest && rest.href) {
    const { href, ...linkProps } = rest as LinkCta;
    return (
      <Link href={href} className={`${base} ${skin} ${className}`} {...linkProps}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${base} ${skin} ${className}`}
      {...(rest as ComponentPropsWithoutRef<"button">)}
    >
      {content}
    </button>
  );
}
