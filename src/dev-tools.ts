import { Action } from "redux";
import { LiftedState } from "@redux-devtools/instrument";
import {
  CustomAction,
  DispatchAction as AppDispatchAction,
} from "@redux-devtools/app";

export const source = "@devtools-extension";

interface StartAction {
  readonly type: "START";
  readonly state: undefined;
  readonly id: undefined;
  readonly source: typeof source;
}

interface StopAction {
  readonly type: "STOP";
  readonly state: undefined;
  readonly id: undefined;
  readonly source: typeof source;
  readonly failed?: boolean;
}

interface DispatchAction {
  readonly type: "DISPATCH";
  readonly payload: AppDispatchAction;
  readonly state: string | undefined;
  readonly id: string;
  readonly source: typeof source;
}

interface ImportAction {
  readonly type: "IMPORT";
  readonly payload: undefined;
  readonly state: string | undefined;
  readonly id: string;
  readonly source: typeof source;
}

interface ActionAction {
  readonly type: "ACTION";
  readonly payload: string | CustomAction;
  readonly state: string | undefined;
  readonly id: string;
  readonly source: typeof source;
}

interface ExportAction {
  readonly type: "EXPORT";
  readonly payload: undefined;
  readonly state: string | undefined;
  readonly id: string;
  readonly source: typeof source;
}

interface UpdateAction {
  readonly type: "UPDATE";
  readonly state: string | undefined;
  readonly id: string;
  readonly source: typeof source;
}

interface ImportStatePayload<S, A extends Action<string>> {
  readonly type: "IMPORT_STATE";
  readonly nextLiftedState: LiftedState<S, A, unknown> | readonly A[];
  readonly preloadedState?: S;
}

interface ImportStateDispatchAction<S, A extends Action<string>> {
  readonly type: "DISPATCH";
  readonly payload: ImportStatePayload<S, A>;
}

export type ListenerMessage<S, A extends Action<string>> =
  | StartAction
  | StopAction
  | DispatchAction
  | ImportAction
  | ActionAction
  | ExportAction
  | UpdateAction
  | ImportStateDispatchAction<S, A>;

export interface ConnectResponse {
  init: <S>(state: S) => void;
  subscribe: <S, A extends Action<string>>(
    listener: (message: ListenerMessage<S, A>) => void,
  ) => (() => void) | undefined;
  unsubscribe: () => void;
  send: <S, A extends Action<unknown>>(action: A, state: S) => void;
  error: (payload: string) => void;
}
