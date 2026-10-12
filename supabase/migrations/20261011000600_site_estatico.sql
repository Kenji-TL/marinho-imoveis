-- =============================================================
-- Marinho Imóveis — site em páginas prontas (Cloudflare)
--   - O site público é gerado a cada publicação a partir de
--     site_snapshot(). Os visitantes não consultam mais o banco:
--     só a equipe (painel) lê as tabelas de imóveis.
--   - As fotos continuam no Storage (bucket property-images), em
--     duas versões (grande e pequena); o site as mostra pela
--     Cloudflare, que guarda cópia em cache.
--   - Limpeza diária (serviço na Cloudflare, chave secreta): fotos de
--     imóveis vendidos ou alugados há 30 dias e arquivos soltos.
--   - Backup semanal do banco no bucket privado "backups".
-- =============================================================

-- -------------------------------------------------------------
-- Data da última mudança de situação
-- -------------------------------------------------------------
alter table public.properties
  add column status_changed_at timestamptz not null default now();

create or replace function public.properties_track_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger properties_track_status
  before update on public.properties
  for each row execute function public.properties_track_status();

-- -------------------------------------------------------------
-- Leitura pública: sai das tabelas, entra a função do site
-- (assim número, complemento e CEP ocultos nunca ficam expostos)
-- -------------------------------------------------------------
drop policy "Público lê imóveis visíveis" on public.properties;
drop policy "Lê fotos de imóveis visíveis" on public.property_images;

create policy "Admin lê fotos"
  on public.property_images for select
  to authenticated
  using ((select public.is_admin()));

revoke select on public.properties, public.property_images from anon;

-- Tudo o que o site público mostra: configurações + imóveis anunciados
-- (visíveis, disponíveis ou reservados) com as fotos em ordem.
create or replace function public.site_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'settings', (select to_jsonb(s) from public.settings s where s.id = 1),
    'properties', coalesce((
      select jsonb_agg(
        (to_jsonb(p) - 'search_text' - 'number' - 'complement' - 'zip_code')
        || jsonb_build_object(
          'number', case when p.hide_number then null else p.number end,
          'complement', case when p.hide_number then null else p.complement end,
          'zip_code', case when p.hide_number then null else p.zip_code end,
          'images', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', i.id,
                'storage_path', i.storage_path,
                'width', i.width,
                'height', i.height,
                'is_cover', i.is_cover
              ) order by i.position
            )
            from public.property_images i
            where i.property_id = p.id
          ), '[]'::jsonb)
        )
        order by p.created_at desc
      )
      from public.properties p
      where p.visible and p.status in ('available', 'reserved')
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.site_snapshot() from public;
grant execute on function public.site_snapshot() to anon, authenticated;

-- -------------------------------------------------------------
-- Limpeza diária (roda na Cloudflare, com a chave secreta)
-- -------------------------------------------------------------

-- Apaga as fotos de imóveis vendidos/alugados há mais de p_days dias e
-- devolve os caminhos, para o serviço apagar os arquivos no Storage.
create or replace function public.purge_closed_property_photos(p_days integer default 30)
returns setof text
language sql
set search_path = ''
as $$
  delete from public.property_images i
  using public.properties p
  where p.id = i.property_id
    and p.status in ('rented', 'sold')
    and p.status_changed_at < now() - make_interval(days => p_days)
  returning i.storage_path;
$$;

revoke all on function public.purge_closed_property_photos(integer) from public, anon, authenticated;
grant execute on function public.purge_closed_property_photos(integer) to service_role;

-- Arquivos do bucket de fotos que nenhum imóvel usa (ex.: enviados e o
-- imóvel não foi salvo), com mais de p_days dias. Inclui as versões pequenas.
create or replace function public.orphan_property_photos(p_days integer default 2)
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'property-images'
    and o.created_at < now() - make_interval(days => p_days)
    and not exists (
      select 1 from public.property_images i
      where i.storage_path = regexp_replace(o.name, '-p\.jpg$', '.jpg')
    );
$$;

revoke all on function public.orphan_property_photos(integer) from public, anon, authenticated;
grant execute on function public.orphan_property_photos(integer) to service_role;

-- -------------------------------------------------------------
-- Backups semanais (só a chave secreta acessa: bucket privado,
-- sem regras de acesso para a equipe ou visitantes)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('backups', 'backups', false, 52428800, array['application/json'])
on conflict (id) do nothing;
