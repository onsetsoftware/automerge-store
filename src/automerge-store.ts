import {
  change,
  type ChangeFn,
  type ChangeOptions,
  decodeChange,
  type Doc,
  Extend,
  getHeads,
  getLastLocalChange,
  type Patch,
  PatchCallback,
} from "@automerge/automerge";
import type { ConnectResponse } from "./dev-tools";

import { patch as applyPatch, unpatch } from "@onsetsoftware/automerge-patcher";
import { get_store_value } from "./utilities/get";

export type AutomergeStoreOptions = {
  withDevTools?: boolean;
  name?: string;
};

const defaultOptions = {
  withDevTools: false,
};

type WindowWithDevTools = Window & {
  __REDUX_DEVTOOLS_EXTENSION__: {
    connect: (options?: {
      name: string;
      instanceId: string;
    }) => ConnectResponse;
  };
};

const reduxDevtoolsExtensionExists = (
  arg: Window | WindowWithDevTools,
): arg is WindowWithDevTools => {
  return "__REDUX_DEVTOOLS_EXTENSION__" in arg;
};

type UndoRedoPatches = {
  undo: Patch[];
  redo: Patch[];
};

export class AutomergeStore<T> {
  private subscribers: Set<(doc: Doc<T>) => void> = new Set();
  private onReadySubscribers: Set<() => void> = new Set();
  private options: AutomergeStoreOptions;

  // dev tools parameters
  private devTools: ConnectResponse | undefined;
  protected changeCount = 0;
  protected liveChangeId = 0;

  protected _ready: boolean = false;

  protected undoStack: UndoRedoPatches[] = [];
  protected redoStack: UndoRedoPatches[] = [];

  protected _doc!: Doc<T>;

  constructor(
    protected _id: string,
    _doc: Doc<T> | Promise<Doc<T>>,
    options: AutomergeStoreOptions = {},
  ) {
    this.options = { ...defaultOptions, ...options };

    if (_doc instanceof Promise) {
      _doc.then(async (doc) => {
        this._doc = doc;
        await new Promise((resolve) => setTimeout(resolve));
        this.setReady();
      });
    } else {
      this._doc = _doc;
      this.setReady();
    }

    this.ready().then(() => {
      this.setupDevTools();
    });
  }

  private setupDevTools() {
    if (this.options.withDevTools && reduxDevtoolsExtensionExists(window)) {
      this.devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
        instanceId: this._id,
        name: this.options.name || this._id,
      });

      this.devTools.init(this._doc);

      this.devTools.subscribe((message) => {
        if (
          message.type === "DISPATCH" &&
          "state" in message &&
          "actionId" in message.payload &&
          message.state
        ) {
          this.updateSubscribers(JSON.parse(message.state));
          this.liveChangeId = message.payload.actionId;
        }
      });
    }
  }

  get isReady() {
    return this._ready;
  }

  private queueing = false;
  private queuedChanges: ChangeFn<T>[] = [];

  private startTransaction() {
    this.queueing = true;
  }

  private endTransaction() {
    this.queueing = false;
    this.change((doc) => {
      this.queuedChanges.forEach((change) => change(doc));
    });
    // run all the changes in one go
  }

  transaction(callback: () => void) {
    this.startTransaction();
    callback();
    this.endTransaction();
  }

  ready() {
    return new Promise<void>((resolve) => {
      if (this._ready) {
        resolve();
      } else {
        this.onReadySubscribers.add(resolve);
      }
    });
  }

  get id() {
    return this._id;
  }

  get doc() {
    return get_store_value(this);
  }

  protected set doc(doc: Doc<T>) {
    this._doc = doc;

    if (this.devTools) {
      if (this.liveChangeId === this.changeCount) {
        this.liveChangeId++;
      }
      this.changeCount++;
      const lastChange = getLastLocalChange(doc);

      this.devTools.send(
        {
          type:
            (lastChange ? decodeChange(lastChange).message : "@LOAD") ||
            getHeads(doc).join(","),
        },
        doc,
      );
    }

    if (this.changeCount === this.liveChangeId) {
      this.updateSubscribers(doc);
    }
  }

  protected patchCallback(options: ChangeOptions<T>): PatchCallback<T> {
    return (patches, info) => {
      this.undoStack.push({
        undo: [...patches]
          .reverse()
          .map((patch) => unpatch(info.before as any, patch)),
        redo: patches,
      });

      if (options.patchCallback) {
        options.patchCallback(patches, info);
      }
    };
  }

  change(callback: ChangeFn<T>, options: ChangeOptions<T> = {}): Doc<T> {
    if (this.queueing) {
      this.queuedChanges.push(callback);
      return this.doc;
    }

    this.redoStack = [];

    return this.makeChange(callback, {
      ...options,
      patchCallback: this.patchCallback(options),
    });
  }

  protected makeChange(
    callback: ChangeFn<T>,
    options: ChangeOptions<T> = {},
  ): Doc<T> {
    const doc = change<T>(this._doc, options, callback);

    const equalArrays = (a: unknown[], b: unknown[]) =>
      a.length === b.length &&
      a.every((element, index) => element === b[index]);

    const existingHeads = getHeads(this._doc);
    const newHeads = getHeads(doc);

    if (!equalArrays(existingHeads, newHeads)) {
      this.doc = doc;
    }

    return doc;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) {
      return;
    }

    const next = this.undoStack.pop()!;

    this.redoStack.push(next);

    this.makeChange((doc: Extend<T>) => {
      for (const patch of next.undo) {
        applyPatch(doc as any, patch);
      }
    });
  }

  redo() {
    if (!this.canRedo()) {
      return;
    }

    const next = this.redoStack.pop()!;

    this.undoStack.push(next);

    this.makeChange((doc) => {
      for (const patch of next.redo) {
        applyPatch(doc as any, patch);
      }
    });
  }

  protected setReady() {
    this._ready = true;

    this.onReadySubscribers.forEach((subscriber) => {
      subscriber();
    });

    this.onReadySubscribers.clear();
  }

  onReady(callback: () => void) {
    if (this._ready) {
      callback();
    } else {
      this.onReadySubscribers.add(callback);
    }
  }

  private updateSubscribers(doc: T) {
    this.subscribers.forEach((subscriber) => {
      subscriber(doc);
    });
  }

  protected setupSubscriptions() {}

  protected teardownSubscriptions() {}

  subscribe(callback: (doc: T) => void) {
    if (this.subscribers.size === 0) {
      this.setupSubscriptions();
    }

    if (!this.subscribers.has(callback)) {
      callback(this._doc);
      this.subscribers.add(callback);
    }

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.teardownSubscriptions();
      }
    };
  }
}
