import { AutomergeStore, AutomergeStoreOptions } from "./automerge-store";
import { DocHandle } from "automerge-repo";
import { ChangeFn, ChangeOptions, Doc } from "@automerge/automerge";

export class AutomergeRepoStore<T> extends AutomergeStore<T> {
  constructor(
    private handle: DocHandle<T>,
    options: AutomergeStoreOptions = {}
  ) {
    super(handle.documentId, handle.doc, options);

    this.ready = false;

    const listener = async ({ handle }: { handle: DocHandle<T> }) => {
      this.doc = await handle.syncValue();
      this.setReady();
    };

    handle.on("change", listener);
  }

  protected makeChange(
    callback: ChangeFn<T>,
    options: ChangeOptions<T> = {}
  ): Doc<T> {
    this.handle.change(callback, options);

    return this.handle.doc;
  }
}
