import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { devToolsMock } from "./helpers/dev-tools.mock";
import { AutomergeRepoStore, AutomergeStore } from "../src";
import { Repo } from "automerge-repo";
import { MemoryStorageAdapter } from "automerge-repo-storage-memory";

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

  test("repo store connects to dev tools", () => {
    const repo = new Repo({
      network: [],
    });

    const handle = repo.create();

    new AutomergeRepoStore(handle, { withDevTools: true });

    expect(devToolsMock.connect).toBeCalledWith({ name: handle.documentId });
  });

  test("repo store connects to dev tools with a found handle", () => {
    const memoryStorage = new MemoryStorageAdapter();
    const repo = new Repo({
      storage: memoryStorage,
      network: [],
    });

    const handle = repo.create();

    handle.change((doc: any) => {
      doc.foo = "bar";
    });

    const repo2 = new Repo({
      storage: memoryStorage,
      network: [],
    });

    new AutomergeRepoStore(repo2.find(handle.documentId), {
      withDevTools: true,
    });

    expect(devToolsMock.connect).toBeCalledWith({ name: handle.documentId });
  });

  test("store does not connect to dev tools when not required", () => {
    new AutomergeStore("test", { count: 0 }, { withDevTools: false });

    expect(devToolsMock.connect).not.toBeCalledWith({ name: "test" });
  });
});
