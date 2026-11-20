import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createStore, type Store } from "./store.ts";

export function loadFileStore(filePath: string): Store {
  const store = existsSync(filePath) ? JSON.parse(readFileSync(filePath, "utf8")) as Store : createStore();
  store.documents ??= [];
  store.memories ??= [];
  store.runs ??= [];
  store.toolCalls ??= [];
  store.exports ??= [];
  store.persist = () => {
    const { persist, ...data } = store;
    mkdirSync(dirname(filePath), { recursive: true });
    const temporary = `${filePath}.tmp`;
    writeFileSync(temporary, JSON.stringify(data));
    renameSync(temporary, filePath);
  };
  store.persist();
  return store;
}
