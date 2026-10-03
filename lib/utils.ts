import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0";
  const cleanInt = Math.round(amount);
  return `₹${cleanInt.toLocaleString("en-IN")}`;
}
