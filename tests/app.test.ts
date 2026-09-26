import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../server/app.js";

describe("starter API", () => {
  it("exposes a health endpoint", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("requires tenant context", async () => {
    const response = await request(app).get("/api/invoices");
    expect(response.status).toBe(401);
  });

  it("does not expose another tenant's invoice", async () => {
    const response = await request(app)
        .post("/api/invoices/inv-b-001/verify")
        .set("x-tenant-id", "tenant-a");
    expect(response.status).toBe(404);
  });
});

describe("POST /api/invoices/:invoiceId/verify", () => {
  it("returns the verification result for the tenant's invoice", async () => {
    const response = await request(app)
        .post("/api/invoices/inv-a-002/verify")
        .set("x-tenant-id", "tenant-a");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      invoiceId: "inv-a-002",
      status: "mismatch",
      mark: "400000000000002"
    });
    expect(response.body.differences).toHaveLength(3);
  });

  describe("6. tenant isolation", () => {
    it("lets the owning tenant verify its invoice", async () => {
      const response = await request(app)
          .post("/api/invoices/inv-b-001/verify")
          .set("x-tenant-id", "tenant-b");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("verified");
    });

    it("ignores a tenant id sent in the request body", async () => {
      const response = await request(app)
          .post("/api/invoices/inv-b-001/verify")
          .set("x-tenant-id", "tenant-a")
          .send({ tenantId: "tenant-b" });
      expect(response.status).toBe(404);
    });

    it("does not match another tenant's myDATA record", async () => {
      const response = await request(app)
          .post("/api/invoices/inv-a-004/verify")
          .set("x-tenant-id", "tenant-a");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("not_found");
    });

    it("does not list another tenant's invoices", async () => {
      const response = await request(app).get("/api/invoices").set("x-tenant-id", "tenant-b");
      expect(response.status).toBe(200);
      const ids = (response.body as { id: string }[]).map((invoice) => invoice.id);
      expect(ids).toEqual(["inv-b-001"]);
    });
  });

  describe("8. invalid or missing input", () => {
    it("returns 401 when the tenant header is missing", async () => {
      const response = await request(app).post("/api/invoices/inv-a-001/verify");
      expect(response.status).toBe(401);
    });

    it("returns 401 when the tenant header is blank", async () => {
      const response = await request(app)
          .post("/api/invoices/inv-a-001/verify")
          .set("x-tenant-id", "   ");
      expect(response.status).toBe(401);
    });

    it("returns 400 for a malformed tenant id", async () => {
      const response = await request(app)
          .post("/api/invoices/inv-a-001/verify")
          .set("x-tenant-id", "tenant a!");
      expect(response.status).toBe(400);
    });

    it("returns 400 for a malformed invoice id", async () => {
      const response = await request(app)
          .post("/api/invoices/inv%20bad/verify")
          .set("x-tenant-id", "tenant-a");
      expect(response.status).toBe(400);
    });

    it("returns 400 for an invoice id longer than 64 characters", async () => {
      const response = await request(app)
          .post(`/api/invoices/${"a".repeat(65)}/verify`)
          .set("x-tenant-id", "tenant-a");
      expect(response.status).toBe(400);
    });

    it("returns 404 for a well-formed but unknown invoice id", async () => {
      const response = await request(app)
          .post("/api/invoices/inv-a-999/verify")
          .set("x-tenant-id", "tenant-a");
      expect(response.status).toBe(404);
    });

    it("returns 400 for a malformed JSON body", async () => {
      const response = await request(app)
          .post("/api/invoices/inv-a-001/verify")
          .set("x-tenant-id", "tenant-a")
          .set("Content-Type", "application/json")
          .send("{bad");
      expect(response.status).toBe(400);
    });
  });
});