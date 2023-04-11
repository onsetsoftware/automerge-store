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
};

const defaultOptions = {
  withDevTools: false,
};

type WindowWithDevTools = Window & {
  __REDUX_DEVTOOLS_EXTENSION__: {
    connect: (options?: { name: string }) => ConnectResponse;
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
      _doc.then((doc) => {
        this._doc = doc;
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
        name: this._id,
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
    const equalArrays = (a: unknown[], b: unknown[]) =>
      a.length === b.length &&
      a.every((element, index) => element === b[index]);

    const hasChanged = !equalArrays(getHeads(this._doc), getHeads(doc));
    this._doc = doc;

    if (hasChanged) {
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
  }

  protected patchCallback(options: ChangeOptions<T>): PatchCallback<T> {
    return (patches, old, updated) => {
      this.undoStack.push({
        undo: [...patches].reverse().map((patch) => unpatch(old as any, patch)),
        redo: patches,
      });

      if (options.patchCallback) {
        options.patchCallback(patches, old, updated);
      }
    };
  }

  change(callback: ChangeFn<T>, options: ChangeOptions<T> = {}): Doc<T> {
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
    this.doc = change<T>(this._doc, options, callback);

    return this._doc;
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

  subscribe(callback: (doc: T) => void, fireImmediately: boolean = true) {
    if (!this.subscribers.has(callback)) {
      if (fireImmediately) {
        callback(this._doc);
      }
      this.subscribers.add(callback);
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }
}
