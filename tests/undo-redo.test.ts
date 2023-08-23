import { beforeEach, describe, expect, test } from "vitest";
import { change, init, Text } from "@automerge/automerge";
import { AutomergeRepoStore, AutomergeStore } from "../src";
import { Repo } from "@automerge/automerge-repo";

export function reorderArray(
  items: any[],
  indexes: number[],
  insertIndex: number
) {
  const params = [insertIndex, 0]
    .concat(
      indexes.sort(function (a, b) {
        return a - b;
      })
    )
    .map(function (i, p) {
      return p > 1 ? items.splice(i - p + 2, 1).pop() : i;
    });

  items.splice.apply(items, params);
}

describe("automerge document manager tests", () => {
  beforeEach(() => {});

  test("adding text", () => {
    type DocStructure = {
      hello: Text;
    };

    let doc = init<DocStructure>();

    const manager = new AutomergeStore<DocStructure>(
      "docId",
      change<DocStructure>(doc, (d) => {
        d.hello = new Text();
        d.hello.insertAt(0, ..."hello".split(""));
      })
    );

    manager.change((doc) => {
      doc.hello.insertAt(5, ..." world".split(""));
    });

    manager.undo();

    expect(String(manager.doc.hello)).toEqual("hello");

    manager.redo();

    expect(String(manager.doc.hello)).toEqual("hello world");
  });

  test("deleting text", () => {
    type DocStructure = {
      hello: Text;
    };

    let doc = init<DocStructure>();

    const manager = new AutomergeStore<DocStructure>(
      "docId",
      change<DocStructure>(doc, (d) => {
        d.hello = new Text();
        d.hello.insertAt(0, ..."hello".split(""));
      })
    );

    manager.change((doc) => {
      doc.hello.deleteAt(1, 2);
    });

    expect(String(manager.doc.hello)).toEqual("hlo");

    manager.undo();

    expect(String(manager.doc.hello)).toEqual("hello");

    manager.redo();

    expect(String(manager.doc.hello)).toEqual("hlo");
  });

  test("adding to an array", () => {
    type DocStructure = {
      hello: string[];
    };

    let doc = init<DocStructure>();

    const manager = new AutomergeStore<DocStructure>(
      "docId",
      change<DocStructure>(doc, (d) => {
        Object.assign(d, { hello: ["hello"] });
      })
    );

    manager.change((doc) => {
      doc.hello.push("world");
    });

    expect(manager.doc.hello).toEqual(["hello", "world"]);

    manager.undo();

    expect(manager.doc.hello).toEqual(["hello"]);

    manager.redo();

    expect(manager.doc.hello).toEqual(["hello", "world"]);
  });

  test("deleting an array item", () => {
    type DocStructure = {
      hello: string[];
    };

    let doc = init<DocStructure>();

    const manager = new AutomergeStore<DocStructure>(
      "docId",
      change<DocStructure>(doc, (d) => {
        Object.assign(d, { hello: ["hello", "world"] });
      })
    );

    manager.change((doc) => {
      doc.hello.splice(1, 1);
    });

    expect(manager.doc.hello).toEqual(["hello"]);

    manager.undo();

    expect(manager.doc.hello).toEqual(["hello", "world"]);

    manager.redo();

    expect(manager.doc.hello).toEqual(["hello"]);
  });

  test("reordering an array", () => {
    type DocStructure = {
      hello: string[];
    };

    let doc = init<DocStructure>();

    const manager = new AutomergeStore<DocStructure>(
      "docId",
      change<DocStructure>(doc, (d) => {
        Object.assign(d, { hello: ["hello", "there", "world"] });
      })
    );

    manager.change((doc) => {
      reorderArray(doc.hello, [1], 2);
    });

    expect(manager.doc.hello).toEqual(["hello", "world", "there"]);

    manager.undo();

    expect(manager.doc.hello).toEqual(["hello", "there", "world"]);

    manager.redo();

    expect(manager.doc.hello).toEqual(["hello", "world", "there"]);
  });

  test("updating an object property", () => {
    type DocStructure = {
      hello: {
        world: string;
        data?: string;
      };
    };

    let doc = init<DocStructure>();

    const manager = new AutomergeStore<DocStructure>(
      "docId",
      change<DocStructure>(doc, (d) => {
        d.hello = {
          world: "hello",
        };
      })
    );

    manager.change((doc) => {
      doc.hello.world = "world";
    });

    expect(manager.doc.hello.world).toEqual("world");

    manager.undo();

    expect(manager.doc.hello.world).toEqual("hello");

    manager.redo();

    expect(manager.doc.hello.world).toEqual("world");
  });

  test("deleting an object property", () => {
    type DocStructure = {
      hello: {
        world: string;
        data?: string;
      };
    };

    let doc = init<DocStructure>();

    const manager = new AutomergeStore<DocStructure>(
      "docId",
      change<DocStructure>(doc, (d) => {
        d.hello = {
          world: "hello",
          data: "data",
        };
      })
    );

    manager.change((doc) => {
      delete doc.hello.data;
    });

    expect(manager.doc.hello).toEqual({ world: "hello" });

    manager.undo();

    expect(manager.doc.hello).toEqual({
      world: "hello",
      data: "data",
    });

    manager.redo();

    expect(manager.doc.hello).toEqual({ world: "hello" });
  });

  test("add entity", () => {
    type DocStructure = {
      people: {
        ids: string[];
        entities: {
          [id: string]: {
            id: string;
            name: string;
          };
        };
      };
    };

    let doc = init<DocStructure>();

    const manager = new AutomergeStore<DocStructure>(
      "docId",
      change<DocStructure>(doc, (d) => {
        Object.assign(d, {
          people: {
            ids: [],
            entities: {},
          },
        });
      })
    );

    manager.change((doc) => {
      const id = "id-1";
      doc.people.ids.push(id);
      doc.people.entities[id] = {
        id,
        name: "Alex",
      };
    });

    expect(manager.doc.people).toEqual({
      ids: ["id-1"],
      entities: {
        "id-1": {
          id: "id-1",
          name: "Alex",
        },
      },
    });

    manager.undo();

    expect(manager.doc.people).toEqual({
      entities: {},
      ids: [],
    });

    manager.redo();

    expect(manager.doc.people).toEqual({
      ids: ["id-1"],
      entities: {
        "id-1": {
          id: "id-1",
          name: "Alex",
        },
      },
    });
  });

  test("it works with a doc handle too", async () => {
    type DocStructure = {
      hello: string[];
    };

    const repo = new Repo({
      network: [],
    });

    const handle = repo.create<DocStructure>();

    handle.change((doc) => {
      Object.assign(doc, { hello: ["hello"] });
    });

    return new Promise(async (done: Function) => {
      const manager = new AutomergeRepoStore(handle);

      await manager.ready();

      let calls = 0;

      const expectations = [
        (doc: DocStructure) => {
          expect({ ...doc }.hello).toEqual(["hello"]);
        },
        (doc: DocStructure) => {
          expect({ ...doc }.hello).toEqual(["hello", "world"]);
          expect(manager.canUndo()).toEqual(true);
          expect(manager.canRedo()).toEqual(false);
          manager.undo();
        },
        (doc: DocStructure) => {
          expect({ ...doc }.hello).toEqual(["hello"]);
          expect(manager.canUndo()).toEqual(false);
          expect(manager.canRedo()).toEqual(true);
          manager.redo();
        },
        (doc: DocStructure) => {
          expect({ ...doc }.hello).toEqual(["hello", "world"]);
          expect(manager.canUndo()).toEqual(true);
          expect(manager.canRedo()).toEqual(false);
          manager.undo();
        },
        (doc: DocStructure) => {
          expect({ ...doc }.hello).toEqual(["hello"]);
          expect(manager.canUndo()).toEqual(false);
          expect(manager.canRedo()).toEqual(true);
          manager.change((doc) => {
            doc.hello.push("world!");
          });
        },
        (doc: DocStructure) => {
          expect({ ...doc }.hello).toEqual(["hello", "world!"]);
          expect(manager.canUndo()).toEqual(true);
          expect(manager.canRedo()).toEqual(false);
          done();
        },
      ];

      manager.subscribe((doc) => {
        expectations[calls](doc);
        calls++;
      });

      manager.change((doc) => {
        doc.hello.push("world");
      });
    });
  });

  test("undo with a transaction", () => {
    type DocStructure = {
      hello: {
        world: string;
        data?: string;
      };
    };

    let doc = init<DocStructure>();

    const manager = new AutomergeStore<DocStructure>(
      "docId",
      change<DocStructure>(doc, (d) => {
        d.hello = {
          world: "hello",
        };
      })
    );

    manager.transaction(() => {
      manager.change((doc) => {
        doc.hello.world = "world";
      });

      manager.change((doc) => {
        doc.hello.world = "world!";
      });
    });

    expect(manager.doc.hello.world).toEqual("world!");

    manager.undo();

    expect(manager.doc.hello.world).toEqual("hello");

    manager.redo();

    expect(manager.doc.hello.world).toEqual("world!");
  });
});
