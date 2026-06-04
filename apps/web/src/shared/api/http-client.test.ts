import { afterEach, describe, expect, it, vi } from "vitest";

import { getApiBaseUrl } from "./http-client.js";

describe("getApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses same-origin API requests by default", () => {
    vi.stubEnv("VITE_API_BASE_URL", "");

    expect(getApiBaseUrl()).toBe("");
  });

  it("uses explicit API base URL when configured", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8080/");

    expect(getApiBaseUrl()).toBe("http://localhost:8080");
  });
});
