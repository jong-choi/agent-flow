import { mkdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

/** Opt-in CLI-only raw capture. Never persist authentication headers. */
export async function captureNetwork(directory: string | undefined) {
  if (!directory) return async () => {};
  const path = resolve(directory);
  if (!path.startsWith(resolve(".local") + sep))
    throw Error("Diagnostic output must be inside .local");
  await mkdir(path, { recursive: true, mode: 0o700 });
  const original = globalThis.fetch;
  let index = 0;
  const pending: Promise<unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const id = ++index;
    const url = new URL(request.url);
    for (const key of ["key", "api_key", "apiKey", "access_token"])
      url.searchParams.delete(key);
    await writeFile(
      `${path}/${id}-request.json`,
      JSON.stringify({
        url: url.toString(),
        method: request.method,
        body: await request.clone().text(),
      }),
      { mode: 0o600 },
    );
    const response = await original(request);
    const saved = response
      .clone()
      .text()
      .then(async (body) => {
        await writeFile(`${path}/${id}-response.raw`, body, { mode: 0o600 });
        await writeFile(
          `${path}/${id}-http.json`,
          JSON.stringify({
            status: response.status,
            contentType: response.headers.get("content-type"),
          }),
          { mode: 0o600 },
        );
      });
    pending.push(saved);
    void saved.catch(() => {});
    return response;
  };
  return async () => {
    globalThis.fetch = original;
    await Promise.allSettled(pending);
  };
}
