import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import {
  findInvoiceForTenant,
  listInvoicesForTenant,
  listMyDataRecordsForTenant
} from "./repository.js";
import { verifyInvoice } from "./verification.js";

export const app = express();
app.use(cors());
app.use(express.json());

/**
 * Allowed format for tenant and invoice ids: letters, digits, '-' and '_', 1-64 chars.
 * Rejecting anything else early keeps unexpected input away from lookups and logs.
 */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function isValidId(value: string): boolean {
  return ID_PATTERN.test(value);
}

/**
 * The tenant comes ONLY from the x-tenant-id header (simulated authentication),
 * never from the request body or URL.
 */
function tenantIdFrom(request: Request): string | undefined {
  const value = request.header("x-tenant-id");
  return value?.trim() || undefined;
}

/**
 * Validates the tenant header. Sends an error response and returns undefined
 * if it is missing (401) or malformed (400).
 */
function requireTenant(request: Request, response: Response): string | undefined {
  const tenantId = tenantIdFrom(request);
  if (!tenantId) {
    response.status(401).json({ error: "Missing tenant context" });
    return undefined;
  }
  if (!isValidId(tenantId)) {
    response.status(400).json({ error: "Invalid tenant id" });
    return undefined;
  }
  return tenantId;
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/invoices", (request, response) => {
  const tenantId = requireTenant(request, response);
  if (!tenantId) return;
  return response.json(listInvoicesForTenant(tenantId));
});

app.post("/api/invoices/:invoiceId/verify", (request, response, next) => {
  try {
    const tenantId = requireTenant(request, response);
    if (!tenantId) return;

    const { invoiceId } = request.params;
    if (!isValidId(invoiceId)) {
      return response.status(400).json({ error: "Invalid invoice id" });
    }

    const invoice = findInvoiceForTenant(invoiceId, tenantId);
    if (!invoice) return response.status(404).json({ error: "Invoice not found" });

    const result = verifyInvoice(invoice, listMyDataRecordsForTenant(tenantId));
    return response.json(result);
  } catch (error) {
    return next(error);
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  // express.json() raises this when the request body is not valid JSON.
  if (isMalformedJsonError(error)) {
    return response.status(400).json({ error: "Malformed JSON body" });
  }
  // Generic message: never leak stack traces or internal details.
  return response.status(500).json({ error: "Unexpected server error" });
});

function isMalformedJsonError(error: unknown): boolean {
  return (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      error.type === "entity.parse.failed"
  );
}