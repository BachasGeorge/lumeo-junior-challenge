# Junior Software Engineer Technical Challenge

## Invoice verification against myDATA records

### Background

Lumeo is a multi-tenant invoice-processing application. Each invoice belongs to one tenant/company. Invoice fields have already been extracted from uploaded documents, and a background integration retrieves records from AADE's myDATA platform.

Your task is to implement the service and interface that compare a Lumeo invoice with the available myDATA records. This repository uses synthetic local JSON fixtures; it does not connect to AADE or the production Lumeo application.

## Time expectation

Please spend approximately **5-7 hours** on the challenge. If you do not complete every requirement, submit what you have and explain what remains, what you would implement next, and any assumptions or trade-offs you made.

We are interested in your engineering approach, reasoning, and ability to validate your work—not only in the number of features completed.

## AI and LLM usage

The use of ChatGPT, Codex, Claude, GitHub Copilot, or similar tools is **allowed and expected**. You remain responsible for understanding and verifying all submitted code.

Copy `AI_USAGE.template.md` to `AI_USAGE.md` and complete it. You do not need to provide private conversations or a complete prompt history. During the follow-up interview, you should be able to explain and modify any part of your submission.

## Your task

Complete the application so that it verifies a Lumeo invoice against tenant-scoped myDATA records.

### Verification statuses

Return one of the following:

- `verified`: one matching active record exists and its amounts match.
- `cancelled`: the matching record contains a cancellation MARK.
- `mismatch`: identity matches, but one or more amounts differ.
- `not_found`: no matching record exists.
- `ambiguous`: more than one possible record matches.

### Matching order

1. Exact myDATA MARK when the invoice contains `myDataMark`.
2. Exact myDATA UID when the invoice contains `myDataUid`.
3. Otherwise, exact identity match using:
   - Issuer VAT number
   - Receiver VAT number
   - Issue date
   - Invoice type
   - Series
   - Sequential number

Compare net, VAT, and gross amounts with a tolerance of **€0.01**.

Matching and financial decisions must be deterministic. Do not use an LLM to decide whether financial records match.

## Backend requirements

Complete:

```text
POST /api/invoices/:invoiceId/verify
```

The endpoint must:

- Load the requested invoice.
- Search only records belonging to the authenticated tenant.
- Apply the verification rules.
- Return the status and a useful explanation.
- Return field-level differences for `mismatch`.
- Handle missing tenant context and unavailable invoices cleanly.

Authentication is simulated using the `x-tenant-id` header. Tenant identity must come from this header, not from request-body input.

Example response:

```json
{
  "invoiceId": "inv-a-002",
  "status": "mismatch",
  "mark": "400000000000002",
  "differences": [
    {
      "field": "grossAmount",
      "lumeoValue": 248,
      "myDataValue": 249.24
    }
  ],
  "explanation": "The invoice identity matches, but one or more amounts differ."
}
```

## Frontend requirements

Extend the starter page to display:

- Invoice number
- Issuer VAT number
- Issue date
- Gross amount
- Current verification status
- A **Verify with myDATA** button
- AADE MARK when a match is found
- Field differences for `mismatch`
- Clear loading and error states

The interface should be clear and usable. Elaborate visual design is not required.

## Required automated tests

Add tests for at least:

1. A successfully verified invoice.
2. An invoice that is not found.
3. Matching identity with different totals.
4. A cancelled invoice.
5. Multiple matches resulting in `ambiguous`.
6. Cross-tenant invoice or record access being denied.
7. Amount differences within the €0.01 tolerance.
8. Invalid or missing input.

At least one test must demonstrate that data belonging to one tenant cannot be accessed or matched by another tenant.

## Fixture data

The `fixtures` directory contains synthetic data for two tenants and all required scenarios. All VAT numbers and financial records are fictional. Do not replace them with real customer information.

## Optional improvements

Attempt these only after completing the core requirements:

- Persist verification results.
- Filter invoices by verification status.
- Add verification history.
- Add structured logging without sensitive data.
- Add a retry-safe verification job.
- Use an LLM to produce a user-friendly mismatch explanation while keeping the underlying decision deterministic.
- Package the application with Docker.

## Deliverables

Submit a Git repository containing:

- Completed source code.
- Automated tests.
- Completed `README.md`.
- Completed `AI_USAGE.md`.
- Clear setup instructions.

Do not commit credentials, secrets, customer data, `node_modules`, or generated build output.

## Follow-up discussion

During a short technical interview, you will be asked to:

- Walk through the architecture.
- Explain the matching algorithm.
- Explain how tenant isolation is enforced.
- Describe how you validated AI-generated code.
- Modify or extend a small part of the implementation.

## Evaluation criteria

| Area | Weight |
|---|---:|
| Correct matching and status handling | 30% |
| Tenant isolation and security awareness | 20% |
| Automated tests and edge cases | 20% |
| Code structure and TypeScript usage | 15% |
| Responsible and transparent AI usage | 10% |
| Documentation and local setup | 5% |

Simple, well-tested, understandable code is preferred over unnecessary complexity.
