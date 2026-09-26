import { describe, expect, it } from "vitest";
import {
    findInvoiceForTenant,
    listMyDataRecordsForTenant
} from "../server/repository.js";
import { verifyInvoice } from "../server/verification.js";
import type { Invoice, MyDataRecord } from "../src/types.js";

// ---------- helpers ----------

/** Loads a fixture invoice and fails loudly if it does not exist. */
function fixtureInvoice(id: string, tenantId = "tenant-a"): Invoice {
    const invoice = findInvoiceForTenant(id, tenantId);
    if (!invoice) throw new Error(`Fixture invoice ${id} not found for ${tenantId}`);
    return invoice;
}

/** Verifies a fixture invoice against the fixture records of its own tenant. */
function verifyFixture(id: string, tenantId = "tenant-a") {
    return verifyInvoice(fixtureInvoice(id, tenantId), listMyDataRecordsForTenant(tenantId));
}

/** Synthetic invoice for edge cases that the fixtures do not cover. */
function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
    return {
        id: "inv-test",
        tenantId: "tenant-test",
        issuerVat: "011111111",
        receiverVat: "022222222",
        issueDate: "2026-01-15",
        invoiceType: "1.1",
        series: "T",
        sequentialNumber: "1",
        netAmount: 10.0,
        vatAmount: 2.4,
        grossAmount: 12.4,
        ...overrides
    };
}

/** Synthetic myDATA record with the same identity and amounts as makeInvoice(). */
function makeRecord(overrides: Partial<MyDataRecord> = {}): MyDataRecord {
    return {
        tenantId: "tenant-test",
        mark: "900000000000001",
        uid: "uid-test-1",
        issuerVat: "011111111",
        receiverVat: "022222222",
        issueDate: "2026-01-15",
        invoiceType: "1.1",
        series: "T",
        sequentialNumber: "1",
        netAmount: 10.0,
        vatAmount: 2.4,
        grossAmount: 12.4,
        ...overrides
    };
}

// ---------- required scenarios (fixtures) ----------

describe("verifyInvoice with fixture data", () => {
    it("1. returns verified for a matching active record", () => {
        const result = verifyFixture("inv-a-001");
        expect(result.status).toBe("verified");
        expect(result.mark).toBe("400000000000001");
        expect(result.differences).toBeUndefined();
    });

    it("2. returns not_found when no record matches", () => {
        const result = verifyFixture("inv-a-004");
        expect(result.status).toBe("not_found");
        expect(result.mark).toBeUndefined();
    });

    it("3. returns mismatch with field-level differences when identity matches but totals differ", () => {
        const result = verifyFixture("inv-a-002");
        expect(result.status).toBe("mismatch");
        expect(result.mark).toBe("400000000000002");
        expect(result.differences).toEqual([
            { field: "netAmount", lumeoValue: 200, myDataValue: 201 },
            { field: "vatAmount", lumeoValue: 48, myDataValue: 48.24 },
            { field: "grossAmount", lumeoValue: 248, myDataValue: 249.24 }
        ]);
    });

    it("4. returns cancelled when the matching record has a cancellation MARK", () => {
        const result = verifyFixture("inv-a-003");
        expect(result.status).toBe("cancelled");
        expect(result.mark).toBe("400000000000003");
        expect(result.explanation).toContain("500000000000003");
    });

    it("5. returns ambiguous when more than one active record matches", () => {
        const result = verifyFixture("inv-a-005");
        expect(result.status).toBe("ambiguous");
        expect(result.mark).toBeUndefined();
        expect(result.explanation).toContain("400000000000005");
        expect(result.explanation).toContain("400000000000006");
    });

    it("7. returns verified when amount differences are within the €0.01 tolerance", () => {
        const result = verifyFixture("inv-a-006");
        expect(result.status).toBe("verified");
        expect(result.differences).toBeUndefined();
    });

    it("matches by exact MARK when the invoice contains one", () => {
        const result = verifyFixture("inv-a-007");
        expect(result.status).toBe("verified");
        expect(result.mark).toBe("400000000000007");
    });

    it("matches by exact UID when the invoice contains one", () => {
        const result = verifyFixture("inv-a-003");
        expect(result.uid).toBe("uid-a-cancelled");
    });
});

// ---------- tenant isolation ----------

describe("verifyInvoice tenant isolation", () => {
    it("6. does not match a record that exists only for another tenant", () => {
        // inv-a-004 has the same identity as a tenant-b record (uid-b-cross-tenant).
        const tenantARecords = listMyDataRecordsForTenant("tenant-a");
        expect(tenantARecords.some((record) => record.uid === "uid-b-cross-tenant")).toBe(false);

        const result = verifyInvoice(fixtureInvoice("inv-a-004"), tenantARecords);
        expect(result.status).toBe("not_found");
    });

    it("6. verifies the tenant-b invoice only against tenant-b records", () => {
        const result = verifyFixture("inv-b-001", "tenant-b");
        expect(result.status).toBe("verified");
        expect(result.mark).toBe("400000000000101");
    });
});

// ---------- tolerance boundaries ----------

describe("verifyInvoice amount tolerance", () => {
    it("7. accepts a difference of exactly €0.01 despite floating point error", () => {
        // In floating point, 1.01 - 1 is 0.010000000000000009 (slightly above 0.01).
        const result = verifyInvoice(makeInvoice({ netAmount: 1 }), [
            makeRecord({ netAmount: 1.01 })
        ]);
        expect(result.status).toBe("verified");
    });

    it("reports mismatch when a difference is above €0.01", () => {
        const result = verifyInvoice(makeInvoice({ grossAmount: 12.4 }), [
            makeRecord({ grossAmount: 12.42 })
        ]);
        expect(result.status).toBe("mismatch");
        expect(result.differences).toEqual([
            { field: "grossAmount", lumeoValue: 12.4, myDataValue: 12.42 }
        ]);
    });
});

// ---------- design decisions (edge cases not in the fixtures) ----------

describe("verifyInvoice design decisions", () => {
    it("returns not_found for an unknown MARK without falling back to identity matching", () => {
        const result = verifyInvoice(makeInvoice({ myDataMark: "999999999999999" }), [makeRecord()]);
        expect(result.status).toBe("not_found");
        expect(result.explanation).toContain("999999999999999");
    });

    it("returns not_found for an unknown UID without falling back to identity matching", () => {
        const result = verifyInvoice(makeInvoice({ myDataUid: "uid-unknown" }), [makeRecord()]);
        expect(result.status).toBe("not_found");
    });

    it("does not compare amounts for a cancelled record", () => {
        const result = verifyInvoice(makeInvoice({ grossAmount: 999 }), [
            makeRecord({ cancellationMark: "800000000000001" })
        ]);
        expect(result.status).toBe("cancelled");
        expect(result.differences).toBeUndefined();
    });

    it("uses the single active record when the other candidates are cancelled", () => {
        const result = verifyInvoice(makeInvoice(), [
            makeRecord({ mark: "900000000000001", cancellationMark: "800000000000001" }),
            makeRecord({ mark: "900000000000002" })
        ]);
        expect(result.status).toBe("verified");
        expect(result.mark).toBe("900000000000002");
    });

    it("returns cancelled without a single MARK when several candidates are all cancelled", () => {
        const result = verifyInvoice(makeInvoice(), [
            makeRecord({ mark: "900000000000001", cancellationMark: "800000000000001" }),
            makeRecord({ mark: "900000000000002", cancellationMark: "800000000000002" })
        ]);
        expect(result.status).toBe("cancelled");
        expect(result.mark).toBeUndefined();
        expect(result.explanation).toContain("900000000000001");
        expect(result.explanation).toContain("900000000000002");
    });
});