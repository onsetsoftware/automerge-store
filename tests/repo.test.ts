import { beforeEach, describe, expect, test } from "vitest";
import { AutomergeRepoStore } from "../src";
import { DocHandle, Repo } from "automerge-repo";

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
  });

  test("A document handle can be passed to a store", () =>
    new Promise((done: Function) => {
      store.subscribe((doc) => {
        expect({ ...doc }).toEqual({ count: 0, string: "hello" });
        done();
      }, false);
    }));

  test("a document can be changed and is updated in the store", () =>
    new Promise((done: Function) => {
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
test("a store is marked as ready", () =>
  new Promise(async (done: Function) => {
    const handle = repo.create<Structure>();

    const store = new AutomergeRepoStore(handle);

    store.onReady(() => {
      done();
    });
  }));
