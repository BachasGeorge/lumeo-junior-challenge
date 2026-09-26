import type { Invoice, VerificationResult } from "./types";

/**
 * Thin client for the verification API. The tenant is sent only in the
 * x-tenant-id header, mirroring how the server authenticates requests.
 */

async function readError(response: Response, fallback: string): Promise<string> {
    try {
        const body = (await response.json()) as { error?: string };
        return body.error ?? fallback;
    } catch {
        return fallback;
    }
}

export async function fetchInvoices(tenantId: string): Promise<Invoice[]> {
    const response = await fetch("/api/invoices", {
        headers: { "x-tenant-id": tenantId }
    });
    if (!response.ok) {
        throw new Error(await readError(response, "Unable to load invoices"));
    }
    return (await response.json()) as Invoice[];
}

export async function requestVerification(
    invoiceId: string,
    tenantId: string
): Promise<VerificationResult> {
    const response = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/verify`, {
        method: "POST",
        headers: { "x-tenant-id": tenantId }
    });
    if (!response.ok) {
        throw new Error(await readError(response, `Verification failed (HTTP ${response.status})`));
    }
    return (await response.json()) as VerificationResult;
}