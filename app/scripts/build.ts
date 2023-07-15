import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appDir = path.join(__dirname, "..");

const main = async () => {
  const res = await build({
    entryPoints: [path.join(appDir, "src", "main.ts")],
    bundle: true,
    platform: "node",
    outfile: path.join(appDir, "dist", "main.js"),
    sourcemap: "inline",
    tsconfig: path.join(appDir, "tsconfig.json"),
  });
  console.log(res);
};

main();
