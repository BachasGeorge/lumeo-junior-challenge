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
- Your matching approach.
- Security and tenant-isolation decisions.
- Assumptions and known limitations.
- What you would change for a production implementation.

## Important boundaries

- This project does not use real AADE endpoints.
- All fixture data is synthetic.
- Financial matching must remain deterministic.
- Do not add credentials or customer data.
