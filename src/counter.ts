import { state } from "./main";
import { AutomergeStore } from "./automerge-store";

export function setupCounter(element: HTMLButtonElement, store: AutomergeStore<state>) {
  store.subscribe((doc) => {
    element.innerHTML = `count is ${doc.count}`
  });
  
  element.addEventListener('click', () => store.change((doc) => {doc.count += 1}));
  
}
