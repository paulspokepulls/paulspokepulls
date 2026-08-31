-- Paul's Poke Pulls V3 migration
alter table public.cards add column if not exists set_id text;
alter table public.cards add column if not exists set_symbol_url text;
create index if not exists cards_set_id_idx on public.cards(set_id);
