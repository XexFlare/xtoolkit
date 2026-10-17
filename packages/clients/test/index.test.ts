import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "../src";

describe("@xtoolkit/clients", () => {
  it("exports its package name", () => {
    expect(PACKAGE_NAME).toBe("@xtoolkit/clients");
  });
});
