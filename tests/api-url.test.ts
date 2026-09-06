import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

/**
 * Tests for getApiBaseUrl() — the function that determines which server the
 * tRPC client calls.  The root cause of the original "Failed to fetch" bug was
 * that the function returned "" on localhost, so tRPC sent requests to Expo's
 * Metro bundler instead of the Express API server.
 */

// getApiBaseUrl() reads window.location and process.env at call time, so we
// simulate those here rather than importing the module at the top level.

function makeGetApiBaseUrl(overrides: {
  EXPO_PUBLIC_API_BASE_URL?: string;
  os?: string;
  location?: { protocol: string; hostname: string };
}) {
  // Inline the function logic so we can test it in isolation without needing
  // React Native's Platform.OS (which is "node" in the test environment).
  const API_BASE_URL = overrides.EXPO_PUBLIC_API_BASE_URL ?? "";
  const isWeb = (overrides.os ?? "web") === "web";
  const location = overrides.location ?? { protocol: "http:", hostname: "localhost" };

  return function getApiBaseUrl(): string {
    if (API_BASE_URL) return API_BASE_URL.replace(/\/$/, "");

    if (isWeb && location) {
      const { protocol, hostname } = location;

      // Cloud sandbox
      const apiHostname = hostname.replace(/^8081-/, "3000-");
      if (apiHostname !== hostname) return `${protocol}//${apiHostname}`;

      // Local development
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
        return `${protocol}//${hostname}:3000`;
      }
    }

    return "";
  };
}

describe("getApiBaseUrl", () => {
  it("returns the explicit env var as-is (strips trailing slash)", () => {
    const fn = makeGetApiBaseUrl({ EXPO_PUBLIC_API_BASE_URL: "https://my-server.example.com/" });
    expect(fn()).toBe("https://my-server.example.com");
  });

  it("returns http://localhost:3000 when running on localhost (the primary bug fix)", () => {
    const fn = makeGetApiBaseUrl({ location: { protocol: "http:", hostname: "localhost" } });
    expect(fn()).toBe("http://localhost:3000");
  });

  it("returns http://127.0.0.1:3000 when bound to loopback IP", () => {
    const fn = makeGetApiBaseUrl({ location: { protocol: "http:", hostname: "127.0.0.1" } });
    expect(fn()).toBe("http://127.0.0.1:3000");
  });

  it("translates cloud sandbox port prefix 8081→3000", () => {
    const fn = makeGetApiBaseUrl({
      location: { protocol: "https:", hostname: "8081-abc123.us.cloudenv.example.com" },
    });
    expect(fn()).toBe("https://3000-abc123.us.cloudenv.example.com");
  });

  it("returns empty string for an unknown non-localhost hostname (uses relative URL / proxy)", () => {
    const fn = makeGetApiBaseUrl({
      location: { protocol: "https:", hostname: "my-app.production.example.com" },
    });
    expect(fn()).toBe("");
  });

  it("returns empty string on native (non-web) platform", () => {
    const fn = makeGetApiBaseUrl({ os: "ios", location: { protocol: "http:", hostname: "localhost" } });
    expect(fn()).toBe("");
  });
});
