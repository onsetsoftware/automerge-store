import { beforeEach, describe, expect, test } from "vitest";
import { AutomergeStore } from "../src";
import { Doc, from, splice } from "@automerge/automerge";

type Structure = {
  count: number;
  string: string;
  object: {
    nested: string;
  };
};

let doc: Doc<Structure>;

const initialState: Structure = {
  count: 0,
  string: "hello",
  object: { nested: "hello" },
};

describe("document tests", () => {
  beforeEach(() => {
    doc = from(initialState);
  });

  test("A v2 document can be passed to a store", () => {
    const store = new AutomergeStore<Structure>("test", doc);

    expect(store.doc).toEqual(initialState);
  });

  test("A v2 document can be updated and changed", () => {
    const store = new AutomergeStore<Structure>("test", doc);

    store.change((d) => {
      splice(d, ["string"], 5, 0, " world");
      splice(d, ["string"], 1, 3);
    });

    expect(store.doc.string).toEqual("ho world");
  });
});
