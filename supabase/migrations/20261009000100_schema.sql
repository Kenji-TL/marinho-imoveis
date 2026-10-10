-- =============================================================
-- Marinho Imóveis — estrutura do banco
-- Tabelas: properties, property_images, settings, admins
-- =============================================================

-- -------------------------------------------------------------
-- Tipos
-- -------------------------------------------------------------
create type public.deal_type as enum ('rent', 'sale');

create type public.property_status as enum ('available', 'reserved', 'rented', 'sold');

create type public.property_type as enum (
  'apartamento',
  'casa',
  'cobertura',
  'kitnet',
  'sala_comercial',
  'loja',
  'galpao',
  'terreno',
  'outro'
);

-- -------------------------------------------------------------
-- Funções utilitárias
-- -------------------------------------------------------------

-- "Apartamento 3 Quartos — Jd. Guanabara" -> "apartamento-3-quartos-jd-guanabara"
create or replace function public.slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    translate(
      lower(coalesce(value, '')),
      'áàâãäåéèêëíìîïóòôõöúùûüçñý',
      'aaaaaaeeeeiiiiooooouuuucny'
    ),
    '[^a-z0-9]+', '-', 'g'
  ));
$$;

-- -------------------------------------------------------------
-- Imóveis
-- -------------------------------------------------------------
create sequence public.property_code_seq;

create table public.properties (
  id               uuid primary key default gen_random_uuid(),
  -- Código público do imóvel, gerado automaticamente: MI-0001, MI-0002...
  code             text not null unique
                   default ('MI-' || lpad(nextval('public.property_code_seq')::text, 4, '0')),
  -- Gerado pelo trigger a partir do título + código (sempre único)
  slug             text not null unique,
  title            text not null check (char_length(title) between 3 and 140),

  deal_type        public.deal_type not null,
  property_type    public.property_type not null,
  status           public.property_status not null default 'available',
  visible          boolean not null default true,   -- false = oculto do site
  featured         boolean not null default false,  -- destaque na home
  accepts_proposal boolean not null default false,  -- selo "Aceita proposta"

  -- Valores (R$). IPTU e condomínio são mensais.
  rent_price       numeric(12, 2) check (rent_price >= 0),
  sale_price       numeric(12, 2) check (sale_price >= 0),
  condo_fee        numeric(12, 2) check (condo_fee >= 0),
  iptu             numeric(12, 2) check (iptu >= 0),
  iptu_exempt      boolean not null default false,
  price_notes      text,  -- ex.: "Rateio de água e luz", "Consumo individualizado"

  -- Endereço
  street           text,
  number           text,
  complement       text,
  neighborhood     text not null,
  city             text not null default 'Rio de Janeiro',
  state            char(2) not null default 'RJ',
  zip_code         text,
  hide_number      boolean not null default false, -- oculta o número e mostra o mapa aproximado

  -- Características
  bedrooms         smallint not null default 0 check (bedrooms >= 0),
  suites           smallint not null default 0 check (suites >= 0),
  bathrooms        smallint not null default 0 check (bathrooms >= 0),
  parking_spots    smallint not null default 0 check (parking_spots >= 0),
  usable_area      numeric(10, 2) check (usable_area > 0),
  total_area       numeric(10, 2) check (total_area > 0),
  amenities        text[] not null default '{}',
  description      text,  -- HTML simples (negrito e listas), sanitizado na exibição

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint properties_price_matches_deal check (
    (deal_type = 'rent' and rent_price is not null)
    or (deal_type = 'sale' and sale_price is not null)
  )
);

comment on table public.properties is 'Imóveis à venda e para aluguel';

create index properties_public_listing_idx
  on public.properties (deal_type, status, created_at desc)
  where visible;
create index properties_featured_idx on public.properties (featured) where visible and featured;
create index properties_neighborhood_idx on public.properties (neighborhood);
create index properties_rent_price_idx on public.properties (rent_price) where deal_type = 'rent';
create index properties_sale_price_idx on public.properties (sale_price) where deal_type = 'sale';

-- Gera slug, atualiza updated_at e limpa campos que não fazem sentido
-- para o tipo de negócio escolhido.
create or replace function public.properties_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.title is distinct from old.title
     or new.code is distinct from old.code then
    new.slug := trim(both '-' from left(public.slugify(new.title), 80))
                || '-' || lower(new.code);
  end if;

  if new.deal_type = 'rent' then
    new.sale_price := null;
  else
    new.rent_price := null;
  end if;

  if new.iptu_exempt then
    new.iptu := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger properties_before_write
  before insert or update on public.properties
  for each row execute function public.properties_before_write();

-- -------------------------------------------------------------
-- Fotos dos imóveis
-- -------------------------------------------------------------
create table public.property_images (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties (id) on delete cascade,
  storage_path text not null,  -- caminho no bucket (usado para apagar o arquivo)
  url          text not null,  -- URL pública
  position     integer not null default 0,
  is_cover     boolean not null default false,
  width        integer,
  height       integer,
  created_at   timestamptz not null default now()
);

create index property_images_property_idx on public.property_images (property_id, position);
-- No máximo uma capa por imóvel
create unique index property_images_one_cover_idx
  on public.property_images (property_id) where is_cover;

-- Define a capa de um imóvel (desmarca a anterior na mesma transação)
create or replace function public.set_property_cover(p_image_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_property_id uuid;
begin
  select property_id into v_property_id
  from public.property_images where id = p_image_id;

  if v_property_id is null then
    raise exception 'Foto não encontrada';
  end if;

  update public.property_images set is_cover = false
  where property_id = v_property_id and is_cover and id <> p_image_id;

  update public.property_images set is_cover = true where id = p_image_id;
end;
$$;

-- Reordena as fotos de um imóvel conforme a lista de ids recebida
create or replace function public.reorder_property_images(p_property_id uuid, p_image_ids uuid[])
returns void
language sql
set search_path = ''
as $$
  update public.property_images i
  set position = o.ord - 1
  from unnest(p_image_ids) with ordinality as o(id, ord)
  where i.id = o.id and i.property_id = p_property_id;
$$;

-- -------------------------------------------------------------
-- Configurações do site (linha única)
-- -------------------------------------------------------------
create table public.settings (
  id            smallint primary key default 1 check (id = 1),
  company_name  text not null default 'Marinho Imóveis',
  -- Somente dígitos, com DDI 55 + DDD. Ex.: 5521997801515
  whatsapp      text not null default '5521997801515'
                check (whatsapp ~ '^55[0-9]{10,11}$'),
  phone         text,
  email         text,
  creci         text,
  address       text,
  opening_hours text,
  instagram_url text,
  facebook_url  text,
  about_text    text,
  updated_at    timestamptz not null default now()
);

insert into public.settings (id) values (1);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- Administradores
-- Só quem está nesta tabela pode alterar dados. Assim, mesmo que o
-- cadastro público do Supabase fique ligado por engano, uma conta
-- nova não consegue mexer em nada.
-- -------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;
