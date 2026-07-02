const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL as string;
const SECRET = import.meta.env.VITE_REVALIDATE_SECRET as string;

export async function revalidateOccasions(): Promise<void> {
  if (!FRONTEND_URL || !SECRET) return;
  try {
    await fetch(
      `${FRONTEND_URL}/api/revalidate?tag=occasions&secret=${SECRET}`,
      { method: "POST" }
    );
  } catch {
    // best-effort — a failed revalidation just means ISR picks it up within 1h
  }
}
