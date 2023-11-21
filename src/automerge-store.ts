import {
  PatchCallback,
  change,
  decodeChange,
  getHeads,
  getLastLocalChange,
  type ChangeFn,
  type ChangeOptions,
  type Doc,
  type Patch,
  PatchInfo,
} from "@automerge/automerge";
import type { ConnectResponse } from "./dev-tools";

import {
  patch as applyPatch,
  unpatchAll,
} from "@onsetsoftware/automerge-patcher";
import { equalArrays } from "./utilities/equal-arrays";
import { get } from "./utilities/get";

import { requestIdleCallback } from "./utilities/request-idle-callback";

export type AutomergeStoreOptions = {
  withDevTools?: boolean;
  name?: string;
  withUndoRedo?: boolean;
};

const defaultOptions = {
  withDevTools: false,
  withUndoRedo: true,
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

type UndoRedoAction = Patch[] | (() => void);

const isPatches = (arg: UndoRedoAction): arg is Patch[] => {
  return Array.isArray(arg);
};

export type SubscribeCallback<T> = (doc: T, patchData: PatchData<T>) => void;

export type PatchData<T> = {
  patches: Patch[];
  patchInfo: PatchInfo<T>;
};

export type UndoRedo = {
  title?: string;
  undo: UndoRedoAction;
  redo: UndoRedoAction;
};

export class AutomergeStore<T extends Doc<T>> {
  private subscribers: Set<SubscribeCallback<T>> = new Set();
  private onReadySubscribers: Set<() => void> = new Set();
  protected options: AutomergeStoreOptions;

  // dev tools parameters
  private devTools: ConnectResponse | undefined;
  protected changeCount = 0;
  protected liveChangeId = 0;

  protected _ready: boolean = false;

  protected undoStack: UndoRedo[] = [];
  protected redoStack: UndoRedo[] = [];

  protected _doc!: Doc<T>;
  protected _patchData: PatchData<T> | undefined;

  protected performingUndoRedo = false;

  constructor(
    protected _id: string,
    _doc: Doc<T> | Promise<Doc<T> | undefined>,
    options: AutomergeStoreOptions = {},
  ) {
    this.options = { ...defaultOptions, ...options };

    if (_doc instanceof Promise) {
      _doc.then(async (doc) => {
        if (doc) {
          this._doc = doc;
          await new Promise((resolve) => setTimeout(resolve));
          this.setReady();
        }
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
          this.updateSubscribers(JSON.parse(message.state), {
            patches: [],
            patchInfo: {
              before: this._doc,
              after: this._doc,
              source: "change",
            },
          });
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

  private endTransaction(message?: string) {
    this.queueing = false;
    this.change(
      (doc) => {
        this.queuedChanges.forEach((change) => change(doc));
      },
      { message },
    );
    this.queuedChanges = [];
  }

  transaction(callback: () => string | void, message?: string) {
    this.startTransaction();
    const m = callback();
    this.endTransaction(m ?? message);
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
    return get(this);
  }

  pushUndoRedo(undoRedo: UndoRedo) {
    this.undoStack.push(undoRedo);
  }

  protected set doc(doc: Doc<T>) {
    if (!equalArrays(getHeads(doc), getHeads(this._doc))) {
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
        this.updateSubscribers(doc, this._patchData!);
      }
    }

    this._doc = doc;
  }

  protected patchCallback(options: ChangeOptions<T>): PatchCallback<T> {
    return (patches, info) => {
      this._patchData = { patches, patchInfo: info };
      if (this.options.withUndoRedo) {
        const lastChange = getLastLocalChange(info.after);

        const title = lastChange ? decodeChange(lastChange).message : undefined;

        requestIdleCallback(
          () => {
            this.undoStack.push({
              title,
              undo: unpatchAll(info.before, patches),
              redo: patches,
            });
          },
          { timeout: 50 },
        );
      }

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
    this.doc = change<T>(this._doc, options, callback);

    this.performingUndoRedo = false;
    return this.doc;
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

    this.performingUndoRedo = true;

    const next = this.undoStack.pop();

    if (next) {
      this.redoStack.push(next);

      const undo = next.undo;

      if (isPatches(undo)) {
        this.makeChange(
          (doc) => {
            for (const patch of undo) {
              applyPatch(doc, patch);
            }
          },
          { message: next.title ? "Undo " + next.title : undefined },
        );
      } else {
        undo();
      }
    }
  }

  redo() {
    if (!this.canRedo()) {
      return;
    }

    this.performingUndoRedo = true;

    const next = this.redoStack.pop();
    if (next) {
      this.undoStack.push(next);

      const redo = next.redo;

      if (isPatches(redo)) {
        this.makeChange(
          (doc) => {
            for (const patch of redo) {
              applyPatch(doc, patch);
            }
          },
          { message: next.title ? "Redo " + next.title : undefined },
        );
      } else {
        redo();
      }
    }
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

  private updateSubscribers(doc: T, patchData: PatchData<T>) {
    this.subscribers.forEach((subscriber) => {
      subscriber(doc, patchData);
    });
  }

  protected setupSubscriptions() {}

  protected teardownSubscriptions() {}

  subscribe(callback: SubscribeCallback<T>) {
    if (this.subscribers.size === 0) {
      this.setupSubscriptions();
    }

    if (!this.subscribers.has(callback)) {
      callback(
        this._doc,
        this._patchData || {
          patches: [],
          patchInfo: { before: this._doc, after: this._doc, source: "change" },
        },
      );
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
