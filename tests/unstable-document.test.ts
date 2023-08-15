import { next } from "@automerge/automerge";
import { beforeEach, describe, expect, test } from "vitest";
import { AutomergeStore } from "../src";

type Structure = {
  count: number;
  string: string;
  object: {
    nested: string;
  };
};

let doc: next.Doc<Structure>;

const initialState: Structure = {
  count: 0,
  string: "hello",
  object: { nested: "hello" },
};

describe("next document tests", () => {
  beforeEach(() => {
    doc = next.from(initialState);
  });

  test("A v2 document can be passed to a store", () => {
    const store = new AutomergeStore<Structure>("test", doc);

    expect(store.doc).toEqual(initialState);
  });

  test("A v2 document can be updated and changed", () => {
    const store = new AutomergeStore<Structure>("test", doc);

    store.change((d) => {
      next.splice(d, ["string"], 5, 0, " world");
      next.splice(d, ["string"], 1, 3);
    });

    expect(store.doc.string).toEqual("ho world");
  });
});
