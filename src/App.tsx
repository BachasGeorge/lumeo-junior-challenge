import { useEffect, useState } from "react";
import { fetchInvoices } from "./api";
import { InvoiceCard } from "./components/InvoiceCard";
import type { Invoice } from "./types";

// Simulated authentication: in production the tenant would come from the login session.
const DEMO_TENANTS = ["tenant-a", "tenant-b"];

export function App() {
    const [tenantId, setTenantId] = useState(DEMO_TENANTS[0]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(undefined);
        setInvoices([]);

        fetchInvoices(tenantId)
            .then((rows) => {
                if (!cancelled) setInvoices(rows);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : "Unexpected error");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        // Ignore a slow response from a previously selected tenant.
        return () => {
            cancelled = true;
        };
    }, [tenantId]);

    return (
        <main className="page">
            <header>
                <p className="eyebrow">Lumeo · Junior Engineering Challenge</p>
                <h1>Invoice verification</h1>
                <p>Verify each invoice against the tenant's myDATA records.</p>
                <label className="tenant-picker">
                    Tenant (demo){" "}
                    <select value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
                        {DEMO_TENANTS.map((tenant) => (
                            <option key={tenant} value={tenant}>
                                {tenant}
                            </option>
                        ))}
                    </select>
                </label>
            </header>

            {error && (
                <p className="error" role="alert">
                    {error}
                </p>
            )}
            {loading && <p className="muted">Loading invoices…</p>}
            {!loading && !error && invoices.length === 0 && <p className="muted">No invoices found.</p>}

            <section className="invoice-list" aria-label="Invoices">
                {invoices.map((invoice) => (
                    <InvoiceCard key={`${tenantId}:${invoice.id}`} invoice={invoice} tenantId={tenantId} />
                ))}
            </section>
        </main>
    );
}