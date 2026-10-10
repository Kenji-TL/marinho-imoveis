-- =============================================================
-- Marinho Imóveis — equipe do painel com papéis
--   dono:     faz tudo (imóveis, configurações do site e equipe)
--   corretor: cadastra e edita imóveis e fotos
-- A tabela admins passa a guardar nome, e-mail e papel de cada pessoa.
-- =============================================================

alter table public.admins
  add column name  text check (char_length(name) <= 80),
  add column email text,
  add column role  text not null default 'dono' check (role in ('dono', 'corretor'));

-- Quem já era admin continua como dono; pessoas novas entram como corretor
alter table public.admins alter column role set default 'corretor';

-- Preenche o e-mail de quem já existia
update public.admins a set email = u.email from auth.users u where u.id = a.user_id;

-- -------------------------------------------------------------
-- Nunca ficar sem dono: não deixa remover nem rebaixar o último
-- -------------------------------------------------------------
create or replace function public.admins_keep_one_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'dono'
     and (tg_op = 'DELETE' or new.role <> 'dono')
     and (select count(*) from public.admins where role = 'dono' and user_id <> old.user_id) = 0 then
    raise exception 'O painel precisa ter pelo menos um dono.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger admins_keep_one_owner
  before update or delete on public.admins
  for each row execute function public.admins_keep_one_owner();

-- -------------------------------------------------------------
-- is_owner(): a pessoa logada é dona?
-- (is_admin() continua valendo para qualquer pessoa da equipe)
-- -------------------------------------------------------------
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid()) and role = 'dono'
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- -------------------------------------------------------------
-- Permissões
-- -------------------------------------------------------------

-- Configurações do site: só o dono altera
drop policy "Admin edita configurações" on public.settings;
create policy "Dono edita configurações"
  on public.settings for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

-- Equipe: cada um vê a própria linha (política já existente); o dono vê e gerencia todos
create policy "Dono vê a equipe"
  on public.admins for select
  to authenticated
  using ((select public.is_owner()));

grant insert, update, delete on public.admins to authenticated;

create policy "Dono adiciona pessoas"
  on public.admins for insert
  to authenticated
  with check ((select public.is_owner()));

create policy "Dono altera pessoas"
  on public.admins for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy "Dono remove pessoas"
  on public.admins for delete
  to authenticated
  using ((select public.is_owner()));

-- Cada pessoa edita o próprio nome em "Minha conta", sem conseguir mudar
-- o próprio papel nem o e-mail. A comparação com os valores atuais fica numa
-- função protegida (uma política não pode consultar a própria tabela).
create or replace function public.admin_self_edit_allowed(p_role text, p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where user_id = (select auth.uid())
      and role = p_role
      and email is not distinct from p_email
  );
$$;

revoke all on function public.admin_self_edit_allowed(text, text) from public, anon;
grant execute on function public.admin_self_edit_allowed(text, text) to authenticated;

create policy "Pessoa edita o próprio nome"
  on public.admins for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and public.admin_self_edit_allowed(role, email)
  );
