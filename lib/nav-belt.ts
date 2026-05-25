import type { Belt } from "@/data/academy";

/** BJJ belt accent per sidebar route — active nav uses these instead of generic accent. */
export const navBeltByHref: Record<
  string,
  { belt: Belt | "brand"; bar: string; bg: string; text: string; ring: string; darkBg?: string; darkText?: string; darkRing?: string }
> = {
  "/": {
    belt: "white",
    bar: "#7c3aed",
    bg: "rgba(124, 58, 237, 0.1)",
    text: "#4c1d95",
    ring: "rgba(124, 58, 237, 0.32)",
    darkBg: "rgba(244, 244, 245, 0.12)",
    darkText: "#f4f4f5",
    darkRing: "rgba(244, 244, 245, 0.35)",
  },
  "/members": {
    belt: "blue",
    bar: "#0ea5e9",
    bg: "rgba(14, 165, 233, 0.14)",
    text: "#075985",
    ring: "rgba(14, 165, 233, 0.45)",
    darkText: "#7dd3fc",
  },
  "/clubs": {
    belt: "purple",
    bar: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.14)",
    text: "#5b21b6",
    ring: "rgba(139, 92, 246, 0.45)",
    darkText: "#c4b5fd",
  },
  "/schedule": {
    belt: "purple",
    bar: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.14)",
    text: "#5b21b6",
    ring: "rgba(139, 92, 246, 0.45)",
    darkText: "#c4b5fd",
  },
  "/competitions": {
    belt: "brown",
    bar: "#8b3a1f",
    bg: "rgba(139, 58, 31, 0.11)",
    text: "#6b2e1a",
    ring: "rgba(139, 58, 31, 0.34)",
    darkBg: "rgba(124, 45, 18, 0.18)",
    darkText: "#fed7aa",
    darkRing: "rgba(124, 45, 18, 0.52)",
  },
  "/training-camps": {
    belt: "black",
    bar: "#27272a",
    bg: "rgba(39, 39, 42, 0.08)",
    text: "#27272a",
    ring: "rgba(39, 39, 42, 0.22)",
    darkBg: "rgba(255, 255, 255, 0.08)",
    darkText: "#fafafa",
    darkRing: "rgba(255, 255, 255, 0.22)",
  },
  "/training-feed": {
    belt: "white",
    bar: "#7c3aed",
    bg: "rgba(124, 58, 237, 0.1)",
    text: "#4c1d95",
    ring: "rgba(124, 58, 237, 0.32)",
    darkBg: "rgba(244, 244, 245, 0.1)",
    darkText: "#e4e4e7",
    darkRing: "rgba(244, 244, 245, 0.3)",
  },
  "/rankings": {
    belt: "blue",
    bar: "#0284c7",
    bg: "rgba(2, 132, 199, 0.14)",
    text: "#075985",
    ring: "rgba(2, 132, 199, 0.45)",
    darkText: "#38bdf8",
  },
  "/tv": {
    belt: "purple",
    bar: "#a78bfa",
    bg: "rgba(167, 139, 250, 0.12)",
    text: "#5b21b6",
    ring: "rgba(167, 139, 250, 0.4)",
    darkText: "#ddd6fe",
  },
  "/admin": {
    belt: "black",
    bar: "#27272a",
    bg: "rgba(39, 39, 42, 0.08)",
    text: "#27272a",
    ring: "rgba(39, 39, 42, 0.22)",
    darkBg: "rgba(255, 255, 255, 0.08)",
    darkText: "#fafafa",
    darkRing: "rgba(255, 255, 255, 0.22)",
  },
  "/settings": {
    belt: "brown",
    bar: "#8b3a1f",
    bg: "rgba(139, 58, 31, 0.11)",
    text: "#6b2e1a",
    ring: "rgba(139, 58, 31, 0.34)",
    darkBg: "rgba(146, 64, 14, 0.14)",
    darkText: "#fdba74",
    darkRing: "rgba(146, 64, 14, 0.42)",
  },
};

export function getNavBeltAccent(href: string) {
  return navBeltByHref[href] ?? navBeltByHref["/"];
}
