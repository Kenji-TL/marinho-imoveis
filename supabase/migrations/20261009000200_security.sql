-- =============================================================
-- Marinho Imóveis — permissões (RLS) e Storage
-- Público: lê imóveis visíveis, as fotos deles e as configurações.
-- Admin (tabela public.admins): lê e altera tudo.
-- =============================================================

-- -------------------------------------------------------------
-- Permissões de tabela (o RLS abaixo filtra as linhas)
-- -------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.properties, public.property_images, public.settings
  to anon, authenticated;
grant insert, update, delete on public.properties, public.property_images
  to authenticated;
grant update on public.settings to authenticated;
grant select on public.admins to authenticated;
grant usage, select on sequence public.property_code_seq to authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
revoke all on function public.set_property_cover(uuid) from public, anon;
grant execute on function public.set_property_cover(uuid) to authenticated;
revoke all on function public.reorder_property_images(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_property_images(uuid, uuid[]) to authenticated;

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.settings enable row level security;
alter table public.admins enable row level security;

-- properties
create policy "Público lê imóveis visíveis"
  on public.properties for select
  to anon, authenticated
  using (visible);

create policy "Admin lê todos os imóveis"
  on public.properties for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admin cadastra imóveis"
  on public.properties for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admin edita imóveis"
  on public.properties for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin exclui imóveis"
  on public.properties for delete
  to authenticated
  using ((select public.is_admin()));

-- property_images: a foto é visível quando o imóvel é visível para quem
-- consulta (o RLS de properties já se aplica dentro do exists).
create policy "Lê fotos de imóveis visíveis"
  on public.property_images for select
  to anon, authenticated
  using (exists (
    select 1 from public.properties p where p.id = property_id
  ));

create policy "Admin cadastra fotos"
  on public.property_images for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admin edita fotos"
  on public.property_images for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin exclui fotos"
  on public.property_images for delete
  to authenticated
  using ((select public.is_admin()));

-- settings
create policy "Público lê configurações"
  on public.settings for select
  to anon, authenticated
  using (true);

create policy "Admin edita configurações"
  on public.settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- admins: cada usuário só enxerga a própria linha
create policy "Usuário vê o próprio registro de admin"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()));

-- -------------------------------------------------------------
-- Storage: bucket de fotos
-- Bucket público = qualquer pessoa abre as fotos pela URL pública.
-- Enviar, substituir e apagar: só admin.
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  10485760, -- 10 MB por arquivo (as fotos já chegam comprimidas pelo painel)
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Admin lista fotos do bucket"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));

create policy "Admin envia fotos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-images' and (select public.is_admin()));

create policy "Admin substitui fotos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()))
  with check (bucket_id = 'property-images' and (select public.is_admin()));

create policy "Admin apaga fotos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));
