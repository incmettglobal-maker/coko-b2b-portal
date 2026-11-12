import { describe, expect, it } from "vitest";
import { formatInr, meetsMinimumOrderValue, MINIMUM_ORDER_VALUE_RUPEES } from "@/lib/money";

describe("formatInr", () => {
  it("formats with Indian digit grouping and no decimals", () => {
    expect(formatInr(123456)).toBe("₹1,23,456");
  });

  it("formats zero", () => {
    expect(formatInr(0)).toBe("₹0");
  });
});

describe("meetsMinimumOrderValue", () => {
  it("rejects totals below the minimum", () => {
    expect(meetsMinimumOrderValue(MINIMUM_ORDER_VALUE_RUPEES - 1)).toBe(false);
  });

  it("accepts totals at or above the minimum", () => {
    expect(meetsMinimumOrderValue(MINIMUM_ORDER_VALUE_RUPEES)).toBe(true);
    expect(meetsMinimumOrderValue(MINIMUM_ORDER_VALUE_RUPEES + 1)).toBe(true);
  });
});
