import path from "node:path";
import { loadFileStore } from "./fileStore.ts";
import type { Store } from "./store.ts";

const filePath = path.join(process.cwd(), "data", "runtime-state.json");
let store: Store | undefined;

export function getServerStore() {
  store ??= loadFileStore(filePath);
  return store;
}
