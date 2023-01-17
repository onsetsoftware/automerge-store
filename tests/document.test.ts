import { beforeEach, describe, expect, test } from "vitest";
import { AutomergeStore } from "../src";
import { from } from "@automerge/automerge";

type Structure = {
  count: number;
  string: string;
};

describe("Document tests", () => {
  beforeEach(() => {});

  test("A document can be passed to a store", () => {
    const store = new AutomergeStore<Structure>(
      "test",
      from({ count: 0, string: "hello" })
    );

    expect(store.doc).toEqual({ count: 0, string: "hello" });
  });

  test("a document can be changed and is updated in the store", () => {
    const store = new AutomergeStore<Structure>(
      "test",
      from({ count: 0, string: "hello" })
    );

    store.change((doc) => {
      doc.count = 1;
    });

    expect(store.doc).toEqual({ count: 1, string: "hello" });
  });

  test("a patch callback can be passed to the change function", () =>
    new Promise((done: Function) => {
      const store = new AutomergeStore<Structure>(
        "test",
        from({ count: 0, string: "hello" })
      );

      store.change(
        (doc) => {
          doc.count = 1;
          doc.string = "world";
        },
        {
          patchCallback: (_) => {
            done();
          },
        }
      );
    }));
});
