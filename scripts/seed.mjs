// Popula o banco com as configurações da empresa e 6 imóveis de exemplo (com fotos).
// Uso: npm run seed   (só roda com a tabela de imóveis vazia)
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { properties, settings } from "./seed-data.mjs";

const BUCKET = "property-images";
const imagesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "supabase", "seed", "images");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) fail("Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local.");

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { count, error: countError } = await supabase
  .from("properties")
  .select("id", { count: "exact", head: true });
if (countError) fail(`Não foi possível acessar o banco: ${countError.message}\nConfira se as migrations foram aplicadas.`);
if (count > 0) fail(`Já existem ${count} imóveis cadastrados. O seed só roda em banco vazio.`);

const { error: settingsError } = await supabase.from("settings").update(settings).eq("id", 1);
if (settingsError) fail(`Erro ao gravar configurações: ${settingsError.message}`);
console.log("✔ Configurações da empresa");

for (const { folder, data } of properties) {
  const { data: property, error } = await supabase
    .from("properties")
    .insert(data)
    .select("id, code, slug")
    .single();
  if (error) fail(`Erro ao cadastrar "${data.title}": ${error.message}`);

  const files = fs
    .readdirSync(path.join(imagesDir, folder))
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort();

  const rows = [];
  for (const [index, file] of files.entries()) {
    const buffer = fs.readFileSync(path.join(imagesDir, folder, file));
    const storagePath = `${property.id}/${randomUUID()}.jpg`;
    // As fotos de exemplo já são pequenas: a mesma imagem serve para as duas versões
    for (const key of [storagePath, storagePath.replace(/\.jpg$/, "-p.jpg")]) {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(key, buffer, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (uploadError) fail(`Erro ao enviar ${folder}/${file}: ${uploadError.message}`);
    }

    const { width, height } = jpegSize(buffer);
    rows.push({
      property_id: property.id,
      storage_path: storagePath,
      url: `/fotos/${storagePath}`,
      position: index,
      is_cover: index === 0,
      width,
      height,
    });
  }

  const { error: imagesError } = await supabase.from("property_images").insert(rows);
  if (imagesError) fail(`Erro ao gravar fotos de "${data.title}": ${imagesError.message}`);

  console.log(`✔ ${property.code}  ${data.title}  (${rows.length} fotos)`);
}

console.log("\nSeed concluído. Publique o site para os imóveis aparecerem (veja o README).");

// Lê largura e altura do cabeçalho de um JPEG (marcador SOF)
function jpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return { width: null, height: null };
}

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}
