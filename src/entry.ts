// Entry point for the silverbullet-calamus plug.
// Assembled into an ESM bundle by esbuild, loaded as a module worker by SilverBullet.

import { manifest } from "./manifest";
import { widget } from "./widget";
import { editor } from "./editor";
import { setupMessageListener } from "./worker-runtime";

const functionMapping: Record<string, Function> = {
  noteWidget: widget,
  noteEditor: editor,
};

// Register with SilverBullet's worker message protocol
setupMessageListener(functionMapping, manifest, self.postMessage.bind(self));

export const plug = {
  manifest,
  functionMapping,
};
