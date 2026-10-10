// Cria (ou atualiza a senha de) o DONO do painel. O resto da equipe é
// adicionado pelo próprio painel, em Equipe.
// Uso: npm run admin:criar -- email@exemplo.com "senha-forte" "Nome"
import { createClient } from "@supabase/supabase-js";

const [email, password, name] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  fail("Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local.");
}
if (!email || !password) {
  fail('Uso: npm run admin:criar -- email@exemplo.com "senha-forte" "Nome (opcional)"');
}
if (password.length < 8) {
  fail("A senha precisa ter pelo menos 8 caracteres.");
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let userId;
const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (created?.user) {
  userId = created.user.id;
  console.log(`Usuário criado: ${email}`);
} else if (createError?.code === "email_exists") {
  userId = await findUserId(email);
  const { error } = await supabase.auth.admin.updateUserById(userId, { password });
  if (error) fail(`Não foi possível atualizar a senha: ${error.message}`);
  console.log(`Usuário já existia: senha atualizada para ${email}`);
} else {
  fail(`Não foi possível criar o usuário: ${createError?.message}`);
}

// O primeiro acesso é sempre do dono (pode adicionar o resto da equipe pelo painel)
const { error: adminError } = await supabase
  .from("admins")
  .upsert({ user_id: userId, email: email.toLowerCase(), role: "dono", ...(name ? { name } : {}) });
if (adminError) {
  fail(`Usuário criado, mas não foi possível liberar o acesso ao painel: ${adminError.message}
Confira se as migrations foram aplicadas.`);
}

console.log("Acesso de DONO liberado. Entre em /admin/login e adicione o resto da equipe em Equipe.");

async function findUserId(targetEmail) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`Erro ao buscar usuários: ${error.message}`);
    const user = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (user) return user.id;
    if (data.users.length < 200) break;
  }
  fail(`Usuário ${targetEmail} não encontrado.`);
}

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}
