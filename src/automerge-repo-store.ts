import { AutomergeStore, AutomergeStoreOptions } from "./automerge-store";
import { DocHandle } from "automerge-repo";
import type { ChangeFn, ChangeOptions, Doc } from "@automerge/automerge";

export class AutomergeRepoStore<T> extends AutomergeStore<T> {
  constructor(
    private handle: DocHandle<T>,
    options: AutomergeStoreOptions = {},
  ) {
    super(handle.documentId, handle.value(), options);

    this._ready = false;

    const listener = async ({ handle }: { handle: DocHandle<T> }) => {
      this.doc = await handle.value();
    };

    handle.on("change", listener);
  }

  protected makeChange(
    callback: ChangeFn<T>,
    options: ChangeOptions<T> = {},
  ): Doc<T> {
    this.handle.change(callback, options);

    return this._doc;
  }
}
