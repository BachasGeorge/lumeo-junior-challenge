import { useEffect, useState } from "react";
import type { Invoice } from "./types";

const DEMO_TENANT = "tenant-a";

export function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch("/api/invoices", { headers: { "x-tenant-id": DEMO_TENANT } })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load invoices");
        return response.json() as Promise<Invoice[]>;
      })
      .then(setInvoices)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Unexpected error")
      );
  }, []);

  return (
    <main className="page">
      <header>
        <p className="eyebrow">Lumeo · Junior Engineering Challenge</p>
        <h1>Invoice verification</h1>
        <p>
          Complete the verification API and turn this starter list into a usable
          myDATA verification interface.
        </p>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="invoice-list" aria-label="Invoices">
        {invoices.map((invoice) => (
          <article className="invoice-card" key={invoice.id}>
            <div>
              <strong>{invoice.series}-{invoice.sequentialNumber}</strong>
              <p>{invoice.issuerVat} · {invoice.issueDate}</p>
            </div>
            <strong>€{invoice.grossAmount.toFixed(2)}</strong>
          </article>
        ))}
      </section>
    </main>
  );
}
