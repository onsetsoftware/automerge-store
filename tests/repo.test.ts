import { DocHandle, Repo } from "automerge-repo";
import { beforeEach, describe, expect, test } from "vitest";
import { AutomergeRepoStore } from "../src";

type Structure = {
  count: number;
  string: string;
};

let repo: Repo;
let handle: DocHandle<Structure>;
let store: AutomergeRepoStore<Structure>;

describe("Repo tests", () => {
  beforeEach(async () => {
    repo = new Repo({
      network: [],
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
      let firstCall = true;
      store.subscribe((doc) => {
        if (firstCall) {
          expect({ ...doc }).toEqual({ count: 1, string: "hello" });
          firstCall = false;

          store.change((doc) => {
            doc.count = 2;
          });
          return;
        }
        expect({ ...doc }).toEqual({ count: 2, string: "hello" });
        done();
      }, false);

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
    new Promise((done: Function) => {
      const handle = repo.create<Structure>();
      const found = repo.find(handle.documentId);
      const store = new AutomergeRepoStore(found);

      store.ready().then(() => {
        done();
      });
    }));

  test("handle value resolves before store ready", async () => {
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
