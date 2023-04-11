import { AutomergeStore } from "../automerge-store";

export function get_store_value<T>(store: AutomergeStore<T>): T {
  let value;
  store.subscribe((_) => (value = _))();
  return value as T;
}
