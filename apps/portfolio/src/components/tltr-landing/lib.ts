import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const colors = {
  primary: "#8B4513",
  secondary: "#D2B48C",
  accent: "#A0522D",
  background: "#FDF5E6",
  "paper-light": "#FAF0E6",
  "paper-dark": "#F5DEB3",
  text: "#3E2723",
  "text-light": "#5D4037",
};

export const gradients = {
  hero: "linear-gradient(135deg, #FDF5E6 0%, #F5DEB3 50%, #DEB887 100%)",
  card: "linear-gradient(180deg, #FAF0E6 0%, #FDF5E6 100%)",
};