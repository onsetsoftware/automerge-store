import "./style.css";
import { setupCounter } from "./counter";
import { from } from "@automerge/automerge";
import { AutomergeStore } from "./automerge-store";
import { DocHandle, DocumentId, Repo } from "automerge-repo";
import { LocalForageStorageAdapter } from "automerge-repo-storage-localforage";
import * as localforage from "localforage";
import { AutomergeRepoStore } from "./automerge-repo-store";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Automerge Store</h1>
    <div class="card">
      <button id="counter" type="button"></button>
      <button id="counter2" type="button"></button>
    </div>
  </div>
`;

export type state = {
  count: number;
};

const doc = from({
  count: 0,
});

const store = new AutomergeStore("root", doc, { withDevTools: true });

const repo = new Repo({
  network: [],
  storage: new LocalForageStorageAdapter(),
});

const initialState: state = {
  count: 0,
};

localforage.getItem("rootDocId").then(async (docId) => {
  let handle: DocHandle<state>;

  if (!docId) {
    handle = repo.create<state>();
    localforage.setItem("rootDocId", handle.documentId);
    handle.change((doc) => {
      Object.assign(doc, initialState);
    });
  } else {
    handle = repo.find(docId as DocumentId);
  }

  await handle.value();

  const store2 = new AutomergeRepoStore(handle, { withDevTools: true });
  setupCounter(document.querySelector<HTMLButtonElement>("#counter")!, store);
  setupCounter(document.querySelector<HTMLButtonElement>("#counter2")!, store2);
});
