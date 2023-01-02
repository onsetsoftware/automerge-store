import {
  change,
  type ChangeFn,
  type ChangeOptions,
  type Doc,
  getHeads,
} from "@automerge/automerge";
import { ConnectResponse } from "./dev-tools";

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
  arg: Window | WindowWithDevTools
): arg is WindowWithDevTools => {
  return "__REDUX_DEVTOOLS_EXTENSION__" in arg;
};

export class AutomergeStore<T> {
  private subscribers: Set<(doc: Doc<T>) => void> = new Set();
  private options: AutomergeStoreOptions;
  private readonly devTools: ConnectResponse | undefined;
  protected changeCount = 0;
  protected liveChangeId = 0;

  constructor(
    protected _id: string,
    protected _doc: Doc<T>,
    options: AutomergeStoreOptions = {}
  ) {
    this.options = { ...defaultOptions, ...options };

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

  get id() {
    return this._id;
  }

  get doc() {
    return this._doc;
  }

  set doc(doc: Doc<T>) {
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
        this.devTools.send({ type: getHeads(doc).join(",") }, doc);
      }

      if (this.changeCount === this.liveChangeId) {
        this.updateSubscribers(doc);
      }
    }
  }

  private updateSubscribers(doc: Doc<T>) {
    this.subscribers.forEach((subscriber) => {
      subscriber({ ...doc });
    });
  }

  swap(doc: Doc<T>) {
    this._doc = doc;
  }

  change(callback: ChangeFn<T>, options?: ChangeOptions<T>): Doc<T> {
    this.doc = change<T>(this._doc, options || {}, callback);

    return this._doc;
  }

  subscribe(callback: (doc: Doc<T>) => void) {
    if (!this.subscribers.has(callback)) {
      callback(this._doc);
      this.subscribers.add(callback);
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }
}
