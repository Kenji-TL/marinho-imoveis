-- =============================================================
-- Marinho Imóveis — busca sem acento
-- "meier" encontra "Méier", "mi 4" encontra "MI-0004" etc.
-- Busca com: search_text ilike '%' || slugify(termo) || '%'
-- =============================================================

alter table public.properties
  add column search_text text generated always as (
    public.slugify(
      coalesce(title, '') || ' ' || code || ' ' || coalesce(neighborhood, '') || ' ' ||
      coalesce(street, '') || ' ' || coalesce(city, '')
    )
  ) stored;

create index properties_search_text_idx on public.properties (search_text);
