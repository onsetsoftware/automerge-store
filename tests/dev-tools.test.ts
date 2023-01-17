import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { devToolsMock } from "./helpers/dev-tools.mock";
import { AutomergeStore } from "../src";

describe("Dev tools integration", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      __REDUX_DEVTOOLS_EXTENSION__: devToolsMock,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("store connects to dev tools", () => {
    new AutomergeStore("test", { count: 0 }, { withDevTools: true });

    expect(devToolsMock.connect).toBeCalledWith({ name: "test" });
  });

  test("store does not connect to dev tools when not required", () => {
    new AutomergeStore("test", { count: 0 }, { withDevTools: false });

    expect(devToolsMock.connect).not.toBeCalledWith({ name: "test" });
  });
});
