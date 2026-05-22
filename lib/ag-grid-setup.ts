import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

let registered = false;

/** Register AG Grid modules once for the whole app. */
export function ensureAgGridModules() {
  if (registered) return;
  ModuleRegistry.registerModules([AllCommunityModule]);
  registered = true;
}

ensureAgGridModules();
