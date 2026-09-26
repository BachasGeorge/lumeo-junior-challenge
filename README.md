# Lumeo junior engineering challenge

This is a runnable starter repository for the challenge described in [CHALLENGE.md](./CHALLENGE.md).

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer

## Start the project

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The React development server proxies `/api` requests to the API on port `3001`.

The demo page initially uses `tenant-a`. Tenant authentication is simulated with the `x-tenant-id` HTTP header.

## Run checks

```bash
npm test
npm run build
```

The starter smoke tests should pass before you make changes. Add your own verification tests as required by the brief.

## Project structure

```text
fixtures/                  Synthetic Lumeo and myDATA data
server/app.ts              Express API routes
server/repository.ts       Tenant-scoped fixture access
server/verification.ts     Verification implementation TODO
src/App.tsx                React interface starter
src/types.ts               Shared data contracts
tests/                     Starter smoke tests
```

## Your implementation notes

Before submission, replace this section with:

- A short architecture explanation.

	On the API level the program reads the tenant from the `x-tenant-id` header, validates input, loads data through the repository
	and returns JSON with appropriate HTTP status codes. On the repository the JSON fixture loads and exposes tenant-scoped queries
	only. For the verification a function with a deterministic matching and comparison rules finds candidate records and decides the
	verification status.
	
- Your matching approach.

	First we check for an exact match of the invoice's myDATA MARK if the invoice has a MARK. If no record with this myDATA MARK exists
	then "not_found" is returned. Then we look for records that have an exact match of the invoice's myDATA UID if the invoice has a UID.
	If no record with a UID matches our invoice's then "not_found" is returned. If either of those exist and a record matches it we move
	to the next step where we check the record(s) status. If the record(s) is not cancelled then we check the amounts. The invoices that
	don't have a MARK or UID are checked by comparing the fields:
	- Issuer VAT number
	- Receiver VAT number
	- Issue date
	- Invoice type
	- Series
	- Sequential number.
	If one or more field differ a corresponding status is returned. If we find records that have matching fields with our invoice
	then we check the status of the record(s) and then the amounts if the record(s) are not cancelled. If the amounts match in any
	of the previous 3 matching cases then we found the matching record(s). A corresponding status is returned and the verification ends.
	
- Security and tenant-isolation decisions.



- Assumptions and known limitations.

	The matching approach has a major problem where if a record with the myDATA MARK or UID of our invoice exists then we skip
	the field matching and we move to the amounts comparisson. If the amounts are also matching then we get a false "verified".
	The same could also happen if the myDATA MARK or UID exists but it's not a match but the rest of the fields and the
	amounts match a record. In this case we get a false "not_found"
	A suggestion would be to also check the fields in order to be 100% sure than the invoice matches with the correct record.
	
- What you would change for a production implementation.

## Important boundaries

- This project does not use real AADE endpoints.
- All fixture data is synthetic.
- Financial matching must remain deterministic.
- Do not add credentials or customer data.
