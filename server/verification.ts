import type {
  Invoice,
  MyDataRecord,
  VerificationResult
} from "../src/types.js";

/**
 * Implement the deterministic matching and comparison rules from CHALLENGE.md.
 * Do not use an LLM to decide whether financial records match.
 */
export function verifyInvoice(
  _invoice: Invoice,
  _records: MyDataRecord[]
): VerificationResult {
  throw new Error("NOT_IMPLEMENTED");
}
