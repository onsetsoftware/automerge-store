# Automerge Store

A simple wrapper around [Automerge](https://automerge.org/) documents, with Redux Dev Tools integration and undo/redo support. It works with both vanilla Automerge docs and `DocHandle`s from [Automerge Repo](https://github.com/pvh/automerge-repo).

## Installation

```bash
npm install @onsetsoftware/automerge-store
```

## Usage

### Automerge Documents

```typescript
import { AutomergeStore } from '@onsetsoftware/automerge-store';
import { from } from "@automerge/automerge";

type DocState = {
  count: number;
};

const doc = from({
  count: 0,
});

const docId = 'documentId';

const store = new AutomergeStore(docId, doc);
```

### Automerge Repo Handles

```typescript
import { AutomergeRepoStore } from '@onsetsoftware/automerge-store';
import { DocHandle, DocumentId, Repo } from "automerge-repo";
import { LocalForageStorageAdapter } from "automerge-repo-storage-localforage";
import * as localforage from "localforage";

type DocState = {
  count: number;
};

const repo = new Repo({
  network: [],
  storage: new LocalForageStorageAdapter(),
});

const initialState: DocState = {
  count: 0,
};

// load a document from the repo, or create a new one
localforage.getItem("rootDocId").then(async (docId) => {
  let handle: DocHandle<DocState>;

  if (!docId) {
    // the doc doesn't exist, so create it, save the ID and then initialise it
    handle = repo.create<DocState>();
    localforage.setItem("rootDocId", handle.documentId);
    handle.change((doc) => {
      Object.assign(doc, initialState);
    });
  } else {
    handle = repo.find(docId as DocumentId);
  }

  // wait for the handle to load
  await handle.value();

  const store = new AutomergeRepoStore(handle);
});
```

## Subscribing

```typescript

const unsubscribe = store.subscribe((doc) => {
  // update your UI/update another state store
  console.log(doc);
});

// unsubscribe
unsubscribe();
```

## Updating the document

```typescript
store.change((doc) => {
  doc.count += 1;
});
```

## Undo/Redo
Undo/Redo is supported by the `undo` and `redo` methods:

```typescript
store.undo();
store.redo();
```

You can also check if there are any undo/redo actions available:

```typescript
store.canUndo();
store.canRedo();
```

## Redux Dev Tools

Opt in to Redux Dev Tools support by passing the `devTools` option to the constructor:

```typescript
const store = new AutomergeStore(docId, doc, {
  withDevTools: true,
});
```

_For DevTools to work, the Redux Dev Tools browser extension needs to be installed and enabled. Time travel is fully functional, but persisting the state across page reloads is not yet supported._
