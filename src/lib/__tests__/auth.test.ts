import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ set: mockSet, get: mockGet, delete: mockDelete })
  ),
}));

vi.mock("jose", async () => {
  const actual = await vi.importActual<typeof import("jose")>("jose");
  return {
    ...actual,
    jwtVerify: vi.fn(),
  };
});

import { jwtVerify } from "jose";
import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";

const COOKIE_NAME = "auth-token";

const samplePayload = {
  userId: "user-123",
  email: "test@example.com",
  expiresAt: new Date("2099-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// createSession

test("createSession sets an httpOnly cookie", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  const [name, , options] = mockSet.mock.calls[0];
  expect(name).toBe(COOKIE_NAME);
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets a token string as cookie value", async () => {
  await createSession("user-123", "test@example.com");

  const [, token] = mockSet.mock.calls[0];
  expect(typeof token).toBe("string");
  expect(token.length).toBeGreaterThan(0);
});

test("createSession cookie expires in roughly 7 days", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const [, , options] = mockSet.mock.calls[0];
  const expiresMs = options.expires.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(expiresMs).toBeLessThanOrEqual(after + sevenDays + 1000);
});

// getSession

test("getSession returns null when no cookie is present", async () => {
  mockGet.mockReturnValue(undefined);

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession returns payload when token is valid", async () => {
  mockGet.mockReturnValue({ value: "valid-token" });
  (jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({
    payload: samplePayload,
  });

  const result = await getSession();

  expect(result).toEqual(samplePayload);
  expect(jwtVerify).toHaveBeenCalledWith("valid-token", expect.any(Uint8Array));
});

test("getSession returns null when token verification fails", async () => {
  mockGet.mockReturnValue({ value: "bad-token" });
  (jwtVerify as ReturnType<typeof vi.fn>).mockRejectedValue(
    new Error("invalid signature")
  );

  const result = await getSession();

  expect(result).toBeNull();
});

// deleteSession

test("deleteSession deletes the auth cookie", async () => {
  await deleteSession();

  expect(mockDelete).toHaveBeenCalledOnce();
  expect(mockDelete).toHaveBeenCalledWith(COOKIE_NAME);
});

// verifySession

test("verifySession returns null when request has no auth cookie", async () => {
  const request = new Request("http://localhost/");
  const nextRequest = {
    cookies: { get: () => undefined },
  } as any;

  const result = await verifySession(nextRequest);

  expect(result).toBeNull();
});

test("verifySession returns payload when token is valid", async () => {
  (jwtVerify as ReturnType<typeof vi.fn>).mockResolvedValue({
    payload: samplePayload,
  });

  const nextRequest = {
    cookies: { get: () => ({ value: "valid-token" }) },
  } as any;

  const result = await verifySession(nextRequest);

  expect(result).toEqual(samplePayload);
});

test("verifySession returns null when token verification fails", async () => {
  (jwtVerify as ReturnType<typeof vi.fn>).mockRejectedValue(
    new Error("expired")
  );

  const nextRequest = {
    cookies: { get: () => ({ value: "expired-token" }) },
  } as any;

  const result = await verifySession(nextRequest);

  expect(result).toBeNull();
});
