import { beforeEach, describe, expect, test } from "vitest";
import { AutomergeRepoStore, AutomergeStore } from "../src";
import { from } from "@automerge/automerge";
import { DocHandle, Repo } from "automerge-repo";

type Structure = {
  count: number;
  string: string;
};

let repo: Repo;
let handle: DocHandle<Structure>;
describe("Repo tests", () => {
  beforeEach(async () => {
    repo = new Repo({
      network: [],
    });

    handle = repo.create<Structure>();

    handle.change((doc) => {
      Object.assign(doc, { count: 0, string: "hello" });
    });
  });

  test("A document handle can be passed to a store", () =>
    new Promise((done: Function) => {
      const store = new AutomergeRepoStore(handle);
      store.subscribe((doc) => {
        expect({ ...doc }).toEqual({ count: 0, string: "hello" });
        done();
      }, false);
    }));

  test("a document can be changed and is updated in the store", () =>
    new Promise((done: Function) => {
      const store = new AutomergeRepoStore(handle);

      store.subscribe((doc) => {
        expect({ ...doc }).toEqual({ count: 1, string: "hello" });
        done();
      }, false);

      store.change((doc) => {
        doc.count = 1;
      });
    }));

  test("a patch callback can be passed to the change function", () =>
    new Promise((done: Function) => {
      const store = new AutomergeRepoStore(handle);

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
