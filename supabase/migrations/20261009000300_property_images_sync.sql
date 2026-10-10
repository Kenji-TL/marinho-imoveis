-- =============================================================
-- Marinho Imóveis — sincronização das fotos de um imóvel
-- O painel envia a lista final de fotos (ordem e capa) ao salvar.
-- Esta função aplica tudo de uma vez, numa única transação:
--   - apaga do banco as fotos que saíram da lista
--   - cadastra as novas
--   - atualiza ordem e capa
-- Devolve os caminhos no Storage das fotos removidas, para o
-- painel apagar os arquivos.
-- =============================================================

create or replace function public.parse_property_images(p_images jsonb)
returns table (
  id uuid,
  storage_path text,
  url text,
  "position" integer,
  is_cover boolean,
  width integer,
  height integer
)
language sql
immutable
set search_path = ''
as $$
  select
    (x->>'id')::uuid,
    x->>'storage_path',
    x->>'url',
    (x->>'position')::integer,
    coalesce((x->>'is_cover')::boolean, false),
    (x->>'width')::integer,
    (x->>'height')::integer
  from jsonb_array_elements(p_images) as x;
$$;

create or replace function public.sync_property_images(p_property_id uuid, p_images jsonb)
returns setof text
language plpgsql
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;

  if p_images is null or jsonb_typeof(p_images) <> 'array' then
    raise exception 'Lista de fotos inválida';
  end if;

  if not exists (select 1 from public.properties where id = p_property_id) then
    raise exception 'Imóvel não encontrado';
  end if;

  -- Toda foto precisa estar na pasta do próprio imóvel e ter URL
  if exists (
    select 1 from public.parse_property_images(p_images) i
    where i.id is null
       or i.url is null
       or i.storage_path is null
       or i.storage_path not like p_property_id::text || '/%'
  ) then
    raise exception 'Foto inválida ou fora da pasta do imóvel';
  end if;

  -- Uma foto de outro imóvel não pode ser "puxada" para este
  if exists (
    select 1
    from public.parse_property_images(p_images) i
    join public.property_images e on e.id = i.id
    where e.property_id <> p_property_id
  ) then
    raise exception 'Foto pertence a outro imóvel';
  end if;

  if (select count(*) from public.parse_property_images(p_images) i where i.is_cover) > 1 then
    raise exception 'Escolha apenas uma foto de capa';
  end if;

  -- Fotos removidas: devolve os caminhos e apaga as linhas
  return query
    delete from public.property_images e
    where e.property_id = p_property_id
      and not exists (select 1 from public.parse_property_images(p_images) i where i.id = e.id)
    returning e.storage_path;

  -- Zera a capa antes de aplicar a nova (índice de capa única)
  update public.property_images e set is_cover = false
  where e.property_id = p_property_id and e.is_cover;

  insert into public.property_images
    (id, property_id, storage_path, url, "position", is_cover, width, height)
  select i.id, p_property_id, i.storage_path, i.url, coalesce(i."position", 0), false, i.width, i.height
  from public.parse_property_images(p_images) i
  on conflict (id) do update set
    "position" = excluded."position",
    is_cover = false;

  -- Capa: a escolhida, ou a primeira foto se nenhuma foi marcada
  update public.property_images e set is_cover = true
  where e.id = coalesce(
    (select i.id from public.parse_property_images(p_images) i where i.is_cover limit 1),
    (select i.id from public.parse_property_images(p_images) i order by i."position" nulls last limit 1)
  );
end;
$$;

revoke all on function public.parse_property_images(jsonb) from public, anon;
grant execute on function public.parse_property_images(jsonb) to authenticated;
revoke all on function public.sync_property_images(uuid, jsonb) from public, anon;
grant execute on function public.sync_property_images(uuid, jsonb) to authenticated;
