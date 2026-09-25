import { readFileSync } from "node:fs";
import type { Invoice, MyDataRecord } from "../src/types.js";

const invoices = JSON.parse(
  readFileSync(new URL("../fixtures/invoices.json", import.meta.url), "utf8")
) as Invoice[];

const myDataRecords = JSON.parse(
  readFileSync(new URL("../fixtures/mydata-records.json", import.meta.url), "utf8")
) as MyDataRecord[];

export function listInvoicesForTenant(tenantId: string): Invoice[] {
  return invoices.filter((invoice) => invoice.tenantId === tenantId);
}

export function findInvoiceForTenant(
  invoiceId: string,
  tenantId: string
): Invoice | undefined {
  return invoices.find(
    (invoice) => invoice.id === invoiceId && invoice.tenantId === tenantId
  );
}

export function listMyDataRecordsForTenant(tenantId: string): MyDataRecord[] {
  return myDataRecords.filter((record) => record.tenantId === tenantId);
}
