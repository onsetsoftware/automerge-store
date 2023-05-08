import { AutomergeStore, AutomergeStoreOptions } from "./automerge-store";
import {
  DocHandle,
  DocHandleChangePayload,
  DocHandlePatchPayload,
} from "automerge-repo";
import type {
  ChangeFn,
  ChangeOptions,
  Doc,
  PatchCallback,
} from "@automerge/automerge";
import type { PatchInfo } from "@automerge/automerge-wasm";

export class AutomergeRepoStore<T> extends AutomergeStore<T> {
  private patchCallbacks: Set<PatchCallback<T>> = new Set();
  private subscriberCount = 0;

  constructor(
    private handle: DocHandle<T>,
    options: AutomergeStoreOptions = {},
  ) {
    super(handle.documentId, handle.value(), options);

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
          "patch",
          ({ patches, handle, ...patchInfo }: DocHandlePatchPayload<T>) => {
            patchCallback(patches, patchInfo as PatchInfo<T>);
          },
        );
      } else {
        this.patchCallbacks.add(patchCallback);
      }
    }

    this.handle.change(callback, rest);

    return this._doc;
  }

  protected changeListener = ({ doc }: DocHandleChangePayload<T>) => {
    this.doc = doc;
  };

  protected patchListener = ({
    patches,
    handle,
    ...patchInfo
  }: DocHandlePatchPayload<T>) => {
    this.patchCallbacks.forEach((cb) => {
      cb(patches, patchInfo as PatchInfo<T>);
      this.patchCallbacks.delete(cb);
    });
  };

  protected setupSubscriptions() {
    this.handle.on("change", this.changeListener);
    this.handle.on("patch", this.patchListener);
  }

  protected teardownSubscriptions() {
    this.handle.off("change", this.changeListener);
    this.handle.off("patch", this.patchListener);
  }

  public subscribe(callback: (doc: T) => void): () => void {
    this.doc = this.handle.doc;

    return super.subscribe(callback);
  }
}
