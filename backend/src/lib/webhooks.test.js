import { describe, expect, it, vi } from "vitest";
import { signPayload, verifyWebhook, verifyWebhookWithTimestamp } from "./webhooks.js";

// Mock supabase to avoid initialization errors
vi.mock("./supabase.js", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe("verifyWebhook", () => {
  it("accepts signatures generated with the current webhook secret", () => {
    const rawBody = JSON.stringify({ event: "payment.confirmed", amount: "10" });
    const merchant = {
      webhook_secret: "current-secret",
      webhook_secret_old: null,
      webhook_secret_expiry: null,
    };

    const signature = signPayload(rawBody, merchant.webhook_secret);

    expect(verifyWebhook(rawBody, `sha256=${signature}`, merchant)).toBe(true);
  });

  it("accepts signatures generated with old secret before expiry", () => {
    const rawBody = JSON.stringify({ event: "payment.confirmed", amount: "10" });
    const merchant = {
      webhook_secret: "current-secret",
      webhook_secret_old: "old-secret",
      webhook_secret_expiry: new Date(Date.now() + 60_000).toISOString(),
    };

    const signature = signPayload(rawBody, merchant.webhook_secret_old);

    expect(verifyWebhook(rawBody, `sha256=${signature}`, merchant)).toBe(true);
  });

  it("rejects signatures generated with old secret after expiry", () => {
    const rawBody = JSON.stringify({ event: "payment.confirmed", amount: "10" });
    const merchant = {
      webhook_secret: "current-secret",
      webhook_secret_old: "old-secret",
      webhook_secret_expiry: new Date(Date.now() - 60_000).toISOString(),
    };

    const signature = signPayload(rawBody, merchant.webhook_secret_old);

    expect(verifyWebhook(rawBody, `sha256=${signature}`, merchant)).toBe(false);
  });

  it("rejects malformed signature headers", () => {
    const rawBody = JSON.stringify({ event: "payment.confirmed", amount: "10" });
    const merchant = {
      webhook_secret: "current-secret",
      webhook_secret_old: null,
      webhook_secret_expiry: null,
    };

    expect(verifyWebhook(rawBody, "invalid", merchant)).toBe(false);
  });
});

describe("verifyWebhookWithTimestamp", () => {
  it("accepts valid signature with recent timestamp", () => {
    const rawBody = JSON.stringify({ event: "payment.confirmed", amount: "10" });
    const merchant = {
      webhook_secret: "current-secret",
      webhook_secret_old: null,
      webhook_secret_expiry: null,
    };

    const signature = signPayload(rawBody, merchant.webhook_secret);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    expect(verifyWebhookWithTimestamp(rawBody, `sha256=${signature}`, timestamp, merchant)).toBe(true);
  });

  it("rejects valid signature with old timestamp (replay attack)", () => {
    const rawBody = JSON.stringify({ event: "payment.confirmed", amount: "10" });
    const merchant = {
      webhook_secret: "current-secret",
      webhook_secret_old: null,
      webhook_secret_expiry: null,
    };

    const signature = signPayload(rawBody, merchant.webhook_secret);
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago

    expect(verifyWebhookWithTimestamp(rawBody, `sha256=${signature}`, oldTimestamp, merchant)).toBe(false);
  });

  it("rejects valid signature with future timestamp", () => {
    const rawBody = JSON.stringify({ event: "payment.confirmed", amount: "10" });
    const merchant = {
      webhook_secret: "current-secret",
      webhook_secret_old: null,
      webhook_secret_expiry: null,
    };

    const signature = signPayload(rawBody, merchant.webhook_secret);
    const futureTimestamp = (Math.floor(Date.now() / 1000) + 600).toString(); // 10 minutes in future

    expect(verifyWebhookWithTimestamp(rawBody, `sha256=${signature}`, futureTimestamp, merchant)).toBe(false);
  });

  it("rejects invalid signature regardless of timestamp", () => {
    const rawBody = JSON.stringify({ event: "payment.confirmed", amount: "10" });
    const merchant = {
      webhook_secret: "current-secret",
      webhook_secret_old: null,
      webhook_secret_expiry: null,
    };

    const timestamp = Math.floor(Date.now() / 1000).toString();

    expect(verifyWebhookWithTimestamp(rawBody, "sha256=invalid", timestamp, merchant)).toBe(false);
  });
});
