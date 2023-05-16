import { decodeChange, from, getLastLocalChange } from "@automerge/automerge";
import { beforeEach, describe, expect, test } from "vitest";
import { AutomergeStore } from "../src";

type Structure = {
  count: number;
  string: string;
};

describe("Document tests", () => {
  let store: AutomergeStore<Structure>;

  beforeEach(() => {
    store = new AutomergeStore<Structure>(
      "test",
      from({ count: 0, string: "hello" }),
    );
  });

  test("A document can be passed to a store", () => {
    expect(store.doc).toEqual({ count: 0, string: "hello" });
  });

  test("a document can be changed and is updated in the store", () => {
    store.change((doc) => {
      doc.count = 1;
    });

    expect(store.doc).toEqual({ count: 1, string: "hello" });
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

  test("transactions can be used to batch changes", () => {
    return new Promise((done: Function) => {
      let calls = 0;
      store.subscribe((doc) => {
        if (calls === 0) {
          expect({ ...doc }).toEqual({ count: 0, string: "hello" });
          calls++;
          return;
        }
        expect(decodeChange(getLastLocalChange(doc)!).message).toEqual(
          "all the changes",
        );
        expect({ ...doc }).toEqual({ count: 1, string: "world" });
        done();
      });

      store.transaction(() => {
        store.change((doc) => {
          doc.count = 1;
        });

        store.change((doc) => {
          doc.string = "world";
        });
      }, "all the changes");
    });
  });

  test("transactions are isolated", () => {
    return new Promise((done: Function) => {
      let calls = 0;
      store.subscribe((doc) => {
        if (calls === 0) {
          expect({ ...doc }).toEqual({ count: 0, string: "hello" });
          calls++;
          return;
        } else if (calls === 1) {
          expect({ ...doc }).toEqual({ count: 1, string: "hello" });
          calls++;
          return;
        }
        expect({ ...doc }).toEqual({ count: 2, string: "hello" });
        done();
      });

      store.transaction(() => {
        store.change((doc) => {
          doc.count++;
        });
      });

      store.transaction(() => {
        store.change((doc) => {
          doc.count++;
        });
      });
    });
  });

  test("a document is marked as ready", () =>
    new Promise((done: Function) => {
      store.onReady(() => {
        done();
      });
    }));

  test("store ready promise resolves", () =>
    new Promise((done: Function) => {
      store.ready().then(() => {
        done();
      });
    }));
});
