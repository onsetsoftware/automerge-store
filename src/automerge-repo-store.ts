import { AutomergeStore, AutomergeStoreOptions } from "./automerge-store";
import { DocHandle, DocHandlePatchPayload } from "automerge-repo";
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

  public subscribe(
    callback: (doc: T) => void,
    fireImmediately: boolean = true,
  ) {
    if (fireImmediately) {
      this.handle.value().then((doc) => {
        this._doc = doc;
        callback(doc);
      });
    }

    const listener = async ({
      patches,
      handle,
      ...patchInfo
    }: DocHandlePatchPayload<T>) => {
      this._doc = patchInfo.after;

      this.patchCallbacks.forEach((cb) => {
        cb(patches, patchInfo as PatchInfo<T>);
        this.patchCallbacks.delete(cb);
      });

      callback(patchInfo.after);
    };

    this.handle.on("patch", listener);
    this.subscriberCount++;

    return () => {
      this.handle.off("patch", listener);
      this.subscriberCount--;
    };
  }
}
