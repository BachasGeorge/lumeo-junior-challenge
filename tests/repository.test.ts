import { describe, expect, it } from "vitest";
import {
  findInvoiceForTenant,
  listInvoicesForTenant,
  listMyDataRecordsForTenant
} from "../server/repository.js";

describe("tenant-scoped fixture repository", () => {
  it("returns only invoices owned by the selected tenant", () => {
    expect(listInvoicesForTenant("tenant-a")).not.toHaveLength(0);
    expect(listInvoicesForTenant("tenant-a").every((row) => row.tenantId === "tenant-a")).toBe(true);
  });

  it("does not return another tenant's invoice by id", () => {
    expect(findInvoiceForTenant("inv-b-001", "tenant-a")).toBeUndefined();
  });

  it("returns only myDATA records owned by the selected tenant", () => {
    expect(listMyDataRecordsForTenant("tenant-b").every((row) => row.tenantId === "tenant-b")).toBe(true);
  });
});
