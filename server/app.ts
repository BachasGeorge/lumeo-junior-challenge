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

function tenantIdFrom(request: Request): string | undefined {
  const value = request.header("x-tenant-id");
  return value?.trim() || undefined;
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/invoices", (request, response) => {
  const tenantId = tenantIdFrom(request);
  if (!tenantId) return response.status(401).json({ error: "Missing tenant context" });
  return response.json(listInvoicesForTenant(tenantId));
});

app.post("/api/invoices/:invoiceId/verify", (request, response, next) => {
  try {
    const tenantId = tenantIdFrom(request);
    if (!tenantId) return response.status(401).json({ error: "Missing tenant context" });

    const invoice = findInvoiceForTenant(request.params.invoiceId, tenantId);
    if (!invoice) return response.status(404).json({ error: "Invoice not found" });

    const result = verifyInvoice(invoice, listMyDataRecordsForTenant(tenantId));
    return response.json(result);
  } catch (error) {
    return next(error);
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof Error && error.message === "NOT_IMPLEMENTED") {
    return response.status(501).json({ error: "Verification is not implemented yet" });
  }
  return response.status(500).json({ error: "Unexpected server error" });
});
