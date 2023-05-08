import { DocHandle, Repo } from "automerge-repo";
import { beforeEach, describe, expect, test } from "vitest";
import { AutomergeRepoStore } from "../src";
import { DummyStorageAdapter } from "./helpers/dummy-storage-adapter";

type Structure = {
  count: number;
  string: string;
};

let repo: Repo;
let handle: DocHandle<Structure>;
let store: AutomergeRepoStore<Structure>;
let storage: DummyStorageAdapter;

describe("Repo tests", () => {
  beforeEach(async () => {
    storage = new DummyStorageAdapter();

    repo = new Repo({
      network: [],
      storage,
    });

    handle = repo.create<Structure>();

    await handle.change((doc) => {
      Object.assign(doc, { count: 0, string: "hello" });
    });

    store = new AutomergeRepoStore(handle);
    await store.ready();
  });

  test("A document handle can be passed to a store", () => {
    expect(store.doc).toEqual({ count: 0, string: "hello" });

    return new Promise((done: Function) => {
      store.subscribe((doc) => {
        expect({ ...doc }).toEqual({ count: 0, string: "hello" });
        done();
      });
    });
  });

  test("a document can be changed and is updated in the store", () => {
    expect(store.doc).toEqual({ count: 0, string: "hello" });

    return new Promise((done: Function) => {
      let calls = 0;
      store.subscribe((doc) => {
        if (calls === 0) {
          expect({ ...doc }).toEqual({ count: 0, string: "hello" });
          calls++;
          return;
        } else if (calls === 1) {
          expect({ ...doc }).toEqual({ count: 1, string: "hello" });

          store.change((doc) => {
            doc.count = 2;
          });
          calls++;
          return;
        }
        expect({ ...doc }).toEqual({ count: 2, string: "hello" });
        done();
      });

      store.change((doc) => {
        doc.count = 1;
      });
    });
  });

  test("a patch callback can be passed to the change function", () =>
    new Promise((done: Function) => {
      store.change(
        (doc) => {
          doc.count = 1;
          doc.string = "world";
        },
        {
          patchCallback: (_) => {
            done();
          },
        },
      );
    }));

  test("a patch callback fires when subscribed", () => {
    const unsub = store.subscribe((doc) => {
      expect(doc).toEqual({ count: 0, string: "hello" });
    });

    return new Promise((done: Function) => {
      store.change(
        (doc) => {
          doc.count = 1;
          doc.string = "world";
        },
        {
          patchCallback: (_) => {
            unsub();
            done();
          },
        },
      );
    });
  });

  test("a store is marked as ready", () =>
    new Promise(async (done: Function) => {
      const handle = repo.create<Structure>();
      const found = repo.find(handle.documentId);
      const store = new AutomergeRepoStore(found);

      store.onReady(async () => {
        expect(await found.value()).toBeDefined();

        done();
      });
    }));

  test("store ready promise resolves", () =>
    new Promise(async (done: Function) => {
      const handle = repo.create<Structure>();
      handle.change((doc) => {
        Object.assign(doc, { count: 0, string: "hello" });
      });

      const repo2 = new Repo({
        network: [],
        storage,
      });

      handle.value().then((doc) => {
        const found = repo2.find(handle.documentId);

        const store = new AutomergeRepoStore(found);

        store.ready().then(() => {
          expect(store.doc).toEqual({ count: 0, string: "hello" });
          store.subscribe((doc) => {
            expect(doc).toEqual({ count: 0, string: "hello" });
            done();
          });
        });
      });
    }));

  test("handle value resolves before store ready", async () => {
    const repo = new Repo({
      network: [],
      storage,
    });

    const found = repo.find(handle.documentId);
    const store = new AutomergeRepoStore(found);

    const first = await Promise.race([
      new Promise<"handle">((done) => found.value().then(() => done("handle"))),
      new Promise<"store">((done) => store.ready().then(() => done("store"))),
    ]);
    expect(first).toEqual("handle");

    expect(store.doc).toEqual({ count: 0, string: "hello" });
  });

  test("delayed initial subscribe yeilds the correct value", async () => {
    store.change((doc) => {
      Object.assign(doc, { count: 1, string: "hello world" });
    });

    expect(store.doc).toEqual({ count: 1, string: "hello world" });
  });

  test("changes from outside the store update the internal doc", async () => {
    handle.change((doc) => {
      Object.assign(doc, { count: 1, string: "hello world" });
    });

    expect(store.doc).toEqual({ count: 1, string: "hello world" });
  });
});
