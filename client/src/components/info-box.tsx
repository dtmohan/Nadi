import React, { type DetailsHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared visual vocabulary for reading surfaces. Colours follow the active light/dark theme. */
export const INFO_BOX = "nadi-info-box";
export const INFO_BOX_TITLE = "nadi-info-title";
export const INFO_BOX_DESCRIPTION = "nadi-info-description";
export const INFO_BOX_EYEBROW = "nadi-info-eyebrow";
export const INFO_BOX_INSET = "nadi-info-inset";
export const INFO_BOX_DISCLOSURE = "nadi-info-disclosure";
export const INFO_BOX_ROWS = "nadi-info-rows";
export const INFO_BOX_ROW = "nadi-info-row";
export const INFO_BOX_ROW_SUMMARY = "nadi-info-summary";

type BoxProps = HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" };

/** A full-width, neutral information surface. Status colours belong to the finding inside it. */
export function InfoBox({ as: Element = "section", className, ...props }: BoxProps) {
  return <Element className={cn(INFO_BOX, className)} {...props} />;
}

export function InfoBoxTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn(INFO_BOX_TITLE, className)} {...props} />;
}

export function InfoBoxDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn(INFO_BOX_DESCRIPTION, className)} {...props} />;
}

/** Native disclosures remain keyboard-accessible and keep the user's open/closed state. */
export function InfoBoxDisclosure({ label, className, children, ...props }: DetailsHTMLAttributes<HTMLDetailsElement> & { label: ReactNode }) {
  return <details className={cn(INFO_BOX_DISCLOSURE, className)} {...props}>
    <summary className={INFO_BOX_ROW_SUMMARY}>{label}</summary>
    <div className="mt-3 space-y-2">{children}</div>
  </details>;
}
