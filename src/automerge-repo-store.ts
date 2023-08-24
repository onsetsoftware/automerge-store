import { AutomergeStore, AutomergeStoreOptions } from "./automerge-store";
import { DocHandle, DocHandleChangePayload } from "@automerge/automerge-repo";
import type {
  ChangeFn,
  ChangeOptions,
  Doc,
  PatchCallback,
} from "@automerge/automerge";
import { unpatchAll } from "@onsetsoftware/automerge-patcher";

export class AutomergeRepoStore<T> extends AutomergeStore<T> {
  private patchCallbacks: Set<PatchCallback<T>> = new Set();
  private subscriberCount = 0;

  constructor(
    private handle: DocHandle<T>,
    options: AutomergeStoreOptions = {}
  ) {
    super(handle.documentId, handle.doc(), options);

    this._ready = false;
  }

  protected makeChange(
    callback: ChangeFn<T>,
    options: ChangeOptions<T> = {}
  ): Doc<T> {
    const { patchCallback, ...rest } = options;

    if (patchCallback) {
      // ! we do this for now to make sure that undo/redo patches are created before subscriptions are updated
      if (this.subscriberCount === 0) {
        this.handle.once(
          "change",
          ({ patches, patchInfo }: DocHandleChangePayload<T>) => {
            patchCallback(patches, patchInfo);
          }
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
    if (!this.performingUndoRedo) {
      this.undoStack.push({
        undo: unpatchAll(patchInfo.before, patches),
        redo: patches,
      });
      this.redoStack = [];
    } else {
      this.performingUndoRedo = false;
    }

    this.patchCallbacks.forEach((callback) => {
      callback(patches, patchInfo);
    });

    this.patchCallbacks.clear();

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

  public subscribe(callback: (doc: T) => void): () => void {
    const doc = this.handle.docSync();
    if (doc) {
      this.doc = doc;
    }

    return super.subscribe(callback);
  }
}
