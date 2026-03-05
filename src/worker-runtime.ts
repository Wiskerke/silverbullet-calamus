// Minimal SilverBullet plug worker runtime.
// Handles the message protocol between the plug worker and SilverBullet host.
// Based on silverbullet/client/plugos/worker_runtime.ts but stripped to essentials.
// Quite some code is no longer relevant as the go server removed the need to support
// no sandbox, deno and cloud workers, etc. So we can basically assume this is always
// running in a worker thread.

type PostMessageFn = (msg: Record<string, unknown>) => void;

let workerPostMessage: PostMessageFn = () => {
  throw new Error("Not initialized");
};

const pendingRequests = new Map<
  number,
  { resolve: (result: unknown) => void; reject: (e: Error) => void }
>();
let syscallReqId = 0;

// Set up global syscall for worker-side use
// Note: We could have skipped this as well, as the plugin currently does no
// syscall in the web worker.
(self as any).syscall = async (
  name: string,
  ...args: unknown[]
): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    syscallReqId++;
    pendingRequests.set(syscallReqId, { resolve, reject });
    workerPostMessage({ type: "sys", id: syscallReqId, name, args });
  });
};

export function setupMessageListener(
  functionMapping: Record<string, Function>,
  manifest: Record<string, unknown>,
  postMessageFn: PostMessageFn,
) {
  workerPostMessage = postMessageFn;

  self.addEventListener("message", (event: MessageEvent) => {
    (async () => {
      const data = event.data;
      switch (data.type) {
        case "inv": {
          const fn = functionMapping[data.name];
          if (!fn) throw new Error(`Function not loaded: ${data.name}`);
          try {
            const result = await Promise.resolve(fn(...(data.args || [])));
            workerPostMessage({ type: "invr", id: data.id, result });
          } catch (e: any) {
            console.error("Error invoking function", data.name, ":", e.message);
            workerPostMessage({ type: "invr", id: data.id, error: e.message });
          }
          break;
        }
        case "sysr": {
          const lookup = pendingRequests.get(data.id);
          if (!lookup) throw new Error("Invalid request id");
          pendingRequests.delete(data.id);
          if (data.error) {
            lookup.reject(new Error(data.error));
          } else {
            lookup.resolve(data.result);
          }
          break;
        }
      }
    })().catch(console.error);
  });

  // Signal initialization with manifest
  workerPostMessage({ type: "manifest", manifest });
}
