// Small pure helpers kept dependency-free on purpose — this is what CI's unit tests exercise
// without needing any live Supabase/Zoho credentials.

/** Formats a whole-rupee integer amount as "₹1,23,456" (Indian digit grouping). */
export function formatInr(amountInRupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInRupees);
}

/** Minimum order value rule from the build plan — ₹10,000 placeholder, confirm before launch. */
export const MINIMUM_ORDER_VALUE_RUPEES = 10_000;

export function meetsMinimumOrderValue(cartTotalRupees: number): boolean {
  return cartTotalRupees >= MINIMUM_ORDER_VALUE_RUPEES;
}
