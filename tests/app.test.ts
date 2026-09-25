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
