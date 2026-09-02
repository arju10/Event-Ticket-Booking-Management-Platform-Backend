import { customAlphabet } from "nanoid";

const alphanumeric = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

// e.g. BK-20260902-K3F9QZ
export function generateBookingNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `BK-${datePart}-${alphanumeric()}`;
}

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${alphanumeric().toLowerCase()}`;
}
