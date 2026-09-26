import { useState } from "react";
import { requestVerification } from "../api";
import type { FieldDifference, Invoice, VerificationResult, VerificationStatus } from "../types";

type VerificationState =
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "done"; result: VerificationResult }
    | { kind: "error"; message: string };

const STATUS_LABELS: Record<VerificationStatus, string> = {
    verified: "Verified",
    cancelled: "Cancelled",
    mismatch: "Mismatch",
    not_found: "Not found",
    ambiguous: "Ambiguous"
};

const FIELD_LABELS: Record<FieldDifference["field"], string> = {
    netAmount: "Net amount",
    vatAmount: "VAT amount",
    grossAmount: "Gross amount"
};

function formatEuro(value: number): string {
    return `€${value.toFixed(2)}`;
}

type Props = {
    invoice: Invoice;
    tenantId: string;
};

export function InvoiceCard({ invoice, tenantId }: Props) {
    const [state, setState] = useState<VerificationState>({ kind: "idle" });

    async function handleVerify() {
        setState({ kind: "loading" });
        try {
            const result = await requestVerification(invoice.id, tenantId);
            setState({ kind: "done", result });
        } catch (cause: unknown) {
            setState({
                kind: "error",
                message: cause instanceof Error ? cause.message : "Unexpected error"
            });
        }
    }

    const isLoading = state.kind === "loading";

    return (
        <article className="invoice-card">
            <div className="invoice-summary">
                <dl className="invoice-fields">
                    <div>
                        <dt>Invoice number</dt>
                        <dd>{invoice.series}-{invoice.sequentialNumber}</dd>
                    </div>
                    <div>
                        <dt>Issuer VAT</dt>
                        <dd>{invoice.issuerVat}</dd>
                    </div>
                    <div>
                        <dt>Issue date</dt>
                        <dd>{invoice.issueDate}</dd>
                    </div>
                    <div>
                        <dt>Gross amount</dt>
                        <dd>{formatEuro(invoice.grossAmount)}</dd>
                    </div>
                    <div>
                        <dt>Status</dt>
                        <dd>
                            {state.kind === "done" ? (
                                <span className={`status status-${state.result.status}`}>
                  {STATUS_LABELS[state.result.status]}
                </span>
                            ) : (
                                <span className="status status-unverified">
                  {isLoading ? "Verifying…" : "Not verified"}
                </span>
                            )}
                        </dd>
                    </div>
                </dl>

                <button type="button" onClick={handleVerify} disabled={isLoading}>
                    {isLoading
                        ? "Verifying…"
                        : state.kind === "idle"
                            ? "Verify with myDATA"
                            : "Verify again"}
                </button>
            </div>

            {state.kind === "error" && (
                <p className="error" role="alert">
                    {state.message}
                </p>
            )}

            {state.kind === "done" && <VerificationDetails result={state.result} />}
        </article>
    );
}

function VerificationDetails({ result }: { result: VerificationResult }) {
    return (
        <div className="verification-details" aria-live="polite">
            <p>{result.explanation}</p>

            {result.mark && (
                <p>
                    <strong>AADE MARK:</strong> <code>{result.mark}</code>
                </p>
            )}

            {result.status === "mismatch" && result.differences && result.differences.length > 0 && (
                <table className="differences">
                    <thead>
                    <tr>
                        <th>Field</th>
                        <th>Lumeo</th>
                        <th>myDATA</th>
                    </tr>
                    </thead>
                    <tbody>
                    {result.differences.map((difference) => (
                        <tr key={difference.field}>
                            <td>{FIELD_LABELS[difference.field]}</td>
                            <td>{formatEuro(difference.lumeoValue)}</td>
                            <td>{formatEuro(difference.myDataValue)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}