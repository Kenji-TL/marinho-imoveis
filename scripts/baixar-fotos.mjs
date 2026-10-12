// Roda depois do `next build`: copia para out/fotos as fotos dos imóveis
// anunciados, para a Cloudflare entregá-las como arquivos do site (de graça e
// sem limite de visitas). As fotos ficam guardadas em .fotos-cache, então a
// cada publicação só as fotos novas saem do Supabase.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BUCKET = "property-images";
// A Cloudflare aceita até 20 mil arquivos por publicação no plano grátis
const MAX_FILES = 19_000;
const CONCURRENCY = 8;

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = path.join(root, ".fotos-cache");
const outDir = path.join(root, "out", "fotos");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) fail("Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
if (!fs.existsSync(path.join(root, "out"))) fail("Rode o `next build` antes (a pasta out/ não existe).");

// Mesma lista que gerou as páginas: imóveis anunciados e suas fotos
const res = await fetch(`${url}/rest/v1/rpc/site_snapshot`, {
  method: "POST",
  headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
  body: "{}",
});
if (!res.ok) fail(`Não foi possível ler os imóveis (${res.status}): ${await res.text()}`);
const { properties } = await res.json();

const wanted = properties.flatMap((p) => p.images.flatMap((i) => [i.storage_path, i.storage_path.replace(/\.jpg$/, "-p.jpg")]));
if (wanted.length > MAX_FILES) fail(`São ${wanted.length} arquivos de foto; o limite da Cloudflare é ${MAX_FILES}.`);

// Baixa só o que ainda não está guardado
const missing = wanted.filter((k) => !fs.existsSync(path.join(cacheDir, k)));
let failed = 0;
const queue = [...missing];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let k = queue.shift(); k; k = queue.shift()) {
      try {
        const photo = await fetch(`${url}/storage/v1/object/public/${BUCKET}/${k}`);
        if (!photo.ok) throw new Error(String(photo.status));
        const file = path.join(cacheDir, k);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, Buffer.from(await photo.arrayBuffer()));
      } catch (e) {
        failed++;
        console.warn(`! Não foi possível baixar ${k} (${e.message})`);
      }
    }
  }),
);

// Copia para o site e tira do guardado o que não é mais usado (vendidos, ocultos…)
const wantedSet = new Set(wanted);
let copied = 0;
for (const k of wanted) {
  const from = path.join(cacheDir, k);
  if (!fs.existsSync(from)) continue;
  const to = path.join(outDir, k);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  copied++;
}
let removed = 0;
if (fs.existsSync(cacheDir)) {
  for (const folder of fs.readdirSync(cacheDir)) {
    const dir = path.join(cacheDir, folder);
    for (const name of fs.readdirSync(dir)) {
      if (!wantedSet.has(`${folder}/${name}`)) {
        fs.rmSync(path.join(dir, name));
        removed++;
      }
    }
    if (!fs.readdirSync(dir).length) fs.rmdirSync(dir);
  }
}

console.log(
  `✔ Fotos no site: ${copied} arquivos (${missing.length - failed} baixados agora, ${copied - (missing.length - failed)} já guardados, ${removed} retirados)`,
);
if (failed) console.warn(`! ${failed} foto(s) não baixaram. Elas aparecem na próxima publicação.`);

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}
