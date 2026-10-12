// Restaura imóveis, fotos e configurações a partir de um backup semanal
// (arquivo banco/AAAA-MM-DD.json do bucket "backups", no Storage do Supabase).
// As fotos em si continuam no bucket "property-images"; o backup guarda os dados.
// A equipe não é restaurada: crie o dono com `npm run admin:criar` e adicione
// o resto pelo painel.
// Uso: npm run backup:restaurar -- caminho/do/backup.json
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const file = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) fail("Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local.");
if (!file || !fs.existsSync(file)) fail("Uso: npm run backup:restaurar -- caminho/do/backup.json");

const backup = JSON.parse(fs.readFileSync(file, "utf8"));
const supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

const [settings] = backup.settings ?? [];
if (settings) {
  const { error } = await supabase.from("settings").upsert(settings);
  if (error) fail(`Configurações: ${error.message}`);
  console.log("✔ Configurações");
}

// search_text é calculado pelo banco e não pode ser gravado
const properties = (backup.properties ?? []).map(({ search_text: _search, ...p }) => p);
for (let i = 0; i < properties.length; i += 100) {
  const { error } = await supabase.from("properties").upsert(properties.slice(i, i + 100));
  if (error) fail(`Imóveis: ${error.message}`);
}
console.log(`✔ ${properties.length} imóveis`);

const images = backup.property_images ?? [];
for (let i = 0; i < images.length; i += 500) {
  const { error } = await supabase.from("property_images").upsert(images.slice(i, i + 500));
  if (error) fail(`Fotos: ${error.message}`);
}
console.log(`✔ ${images.length} fotos`);

const lastCode = Math.max(0, ...properties.map((p) => Number(String(p.code).replace(/\D/g, "")) || 0));
console.log(`
Último passo, no SQL Editor do Supabase (para os próximos imóveis não repetirem códigos):

  select setval('public.property_code_seq', ${lastCode});

Depois publique o site de novo (salvar qualquer imóvel no painel já publica).`);

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}
