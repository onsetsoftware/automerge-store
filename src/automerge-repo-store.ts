import {
  getLastLocalChange,
  type ChangeFn,
  type ChangeOptions,
  type Doc,
  type PatchCallback,
  decodeChange,
} from "@automerge/automerge";
import { DocHandle, DocHandleChangePayload } from "@automerge/automerge-repo";
import { unpatchAll } from "@onsetsoftware/automerge-patcher";
import {
  AutomergeStore,
  AutomergeStoreOptions,
  SubscribeCallback,
} from "./automerge-store";
import { requestIdleCallback } from "./utilities/request-idle-callback";

export class AutomergeRepoStore<T> extends AutomergeStore<T> {
  private patchCallbacks: Set<PatchCallback<T>> = new Set();
  private subscriberCount = 0;

  constructor(
    private handle: DocHandle<T>,
    options: AutomergeStoreOptions = {},
  ) {
    super(handle.documentId, handle.doc(), options);

    this._ready = false;
  }

  protected makeChange(
    callback: ChangeFn<T>,
    options: ChangeOptions<T> = {},
  ): Doc<T> {
    const { patchCallback, ...rest } = options;

    if (patchCallback) {
      // ! we do this for now to make sure that undo/redo patches are created before subscriptions are updated
      if (this.subscriberCount === 0) {
        this.handle.once(
          "change",
          ({ patches, patchInfo }: DocHandleChangePayload<T>) => {
            patchCallback(patches, patchInfo);
          },
        );
      } else {
        this.patchCallbacks.add(patchCallback);
      }
    }

    this.handle.change(callback, rest);

    return this._doc;
  }

  protected changeListener = ({
    doc,
    patches,
    patchInfo,
  }: DocHandleChangePayload<T>) => {
    if (!this.performingUndoRedo && this.options.withUndoRedo) {
      const lastChange = getLastLocalChange(patchInfo.after);

      const title = lastChange ? decodeChange(lastChange).message : undefined;
      requestIdleCallback(
        () => {
          this.undoStack.push({
            title,
            undo: unpatchAll(patchInfo.before, patches),
            redo: patches,
          });
          this.redoStack = [];
        },
        { timeout: 50 },
      );
    } else {
      this.performingUndoRedo = false;
    }

    this.patchCallbacks.forEach((callback) => {
      callback(patches, patchInfo);
    });

    this.patchCallbacks.clear();

    this._patchData = { patches, patchInfo };
    this.doc = doc;
  };

  protected patchCallback(options: ChangeOptions<T>): PatchCallback<T> {
    return (patches, info) => {
      if (options.patchCallback) {
        options.patchCallback(patches, info);
      }
    };
  }

  protected setupSubscriptions() {
    this.handle.on("change", this.changeListener);
  }

  protected teardownSubscriptions() {
    this.handle.off("change", this.changeListener);
  }

  public subscribe(callback: SubscribeCallback<T>): () => void {
    const doc = this.handle.docSync();
    if (doc) {
      this.doc = doc;
    }

    return super.subscribe(callback);
  }
}
