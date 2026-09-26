import type {
  FieldDifference,
  Invoice,
  MyDataRecord,
  VerificationResult
} from "../src/types.js";

/**
 * Which identifier was used to search for candidate records.
 */
type MatchStrategy = "mark" | "uid" | "identity";

type CandidateSearch = {
  strategy: MatchStrategy;
  candidates: MyDataRecord[];
};

/**
 * The fields that determine the identity of an invoice.
 * If MatchStrategy = "identity" these have to match to have a candidate.
 */
const IDENTITY_FIELDS = [
  "issuerVat",
  "receiverVat",
  "issueDate",
  "invoiceType",
  "series",
  "sequentialNumber"
] as const;

/**
 * Amounts compared between Lumeo and myDATA.
 * Differences up to €0.01 are accepted. EPSILON absorbs floating point noise
 * (e.g. 1.01 - 1 = 0.010000000000000009 = 0.010000000000000009).
 */
const AMOUNT_FIELDS = ["netAmount", "vatAmount", "grossAmount"] as const;
const TOLERANCE = 0.01;
const EPSILON = 1e-9;

function hasSameIdentity(invoice: Invoice, record: MyDataRecord): boolean {
  return IDENTITY_FIELDS.every((field) => invoice[field] === record[field]);
}

function isCancelled(record: MyDataRecord): boolean {
  return Boolean(record.cancellationMark);
}

/**
 * Get the matching records with check priority MARK -> UID -> identity.
 * If the invoice has MARK (or UID), we only look for that without checking
 * the rest of the fields.
 */
function findCandidates(invoice: Invoice, records: MyDataRecord[]): CandidateSearch {
  if (invoice.myDataMark) {
    return {
      strategy: "mark",
      candidates: records.filter((record) => record.mark === invoice.myDataMark)
    };
  }

  if (invoice.myDataUid) {
    return {
      strategy: "uid",
      candidates: records.filter((record) => record.uid === invoice.myDataUid)
    };
  }

  return {
    strategy: "identity",
    candidates: records.filter((record) => hasSameIdentity(invoice, record))
  };
}

function describeSearch(invoice: Invoice, strategy: MatchStrategy): string {
  switch (strategy) {
    case "mark":
      return `MARK ${invoice.myDataMark}`;
    case "uid":
      return `UID ${invoice.myDataUid}`;
    case "identity":
      return "issuer VAT, receiver VAT, issue date, type, series and number";
  }
}

/**
 * Returns one entry per amount field whose difference exceeds the tolerance.
 * An empty list means all amounts match.
 */
function compareAmounts(invoice: Invoice, record: MyDataRecord): FieldDifference[] {
  const differences: FieldDifference[] = [];
  for (const field of AMOUNT_FIELDS) {
    if (Math.abs(invoice[field] - record[field]) > TOLERANCE + EPSILON) {
      differences.push({
        field,
        lumeoValue: invoice[field],
        myDataValue: record[field]
      });
    }
  }
  return differences;
}

/**
 * Deterministic verification. Do not use an LLM to decide whether financial records match.
 *
 * Decision order:
 * 1. No candidates                          -> not_found
 * 2. Exactly one active candidate           -> compare amounts -> verified / mismatch
 *    (cancelled candidates are ignored when one active record remains)
 * 3. More than one active candidate         -> ambiguous
 * 4. No active candidates, one cancelled    -> cancelled (amounts are not compared)
 * 5. No active candidates, several cancelled -> cancelled
 */
export function verifyInvoice(
    invoice: Invoice,
    records: MyDataRecord[]
): VerificationResult {
  const { strategy, candidates } = findCandidates(invoice, records);
  const searchedBy = describeSearch(invoice, strategy);

  if (candidates.length === 0) {
    return {
      invoiceId: invoice.id,
      status: "not_found",
      explanation: `No myDATA record found matching ${searchedBy}.`
    };
  }

  const active = candidates.filter((record) => !isCancelled(record));

  if (active.length === 1) {
    const record = active[0];
    const differences = compareAmounts(invoice, record);

    if (differences.length > 0) {
      return {
        invoiceId: invoice.id,
        status: "mismatch",
        mark: record.mark,
        uid: record.uid,
        differences,
        explanation: "The invoice identity matches, but one or more amounts differ."
      };
    }

    return {
      invoiceId: invoice.id,
      status: "verified",
      mark: record.mark,
      uid: record.uid,
      explanation: `One active myDATA record matches ${searchedBy} and all amounts agree within €0.01.`
    };
  }

  if (active.length > 1) {
    return {
      invoiceId: invoice.id,
      status: "ambiguous",
      explanation: `${active.length} active myDATA records match ${searchedBy} (MARKs: ${active
          .map((record) => record.mark)
          .join(", ")}). Manual review is required.`
    };
  }

  // No active candidates: every candidate is cancelled.
  if (candidates.length === 1) {
    const record = candidates[0];
    return {
      invoiceId: invoice.id,
      status: "cancelled",
      mark: record.mark,
      uid: record.uid,
      explanation: `The matching myDATA record was cancelled (cancellation MARK ${record.cancellationMark}).`
    };
  }

  return {
    invoiceId: invoice.id,
    status: "cancelled",
    explanation: `${candidates.length} myDATA records match ${searchedBy} and all of them are cancelled (MARKs: ${candidates
        .map((record) => record.mark)
        .join(", ")}).`
  };
}