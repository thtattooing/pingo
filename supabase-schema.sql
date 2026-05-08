-- =============================================
-- PINGO — Schema do Banco de Dados (idempotente)
-- Pode rodar quantas vezes quiser sem erro
-- =============================================

-- ==================
-- 1. PROFILES
-- ==================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

alter table public.profiles enable row level security;

drop policy if exists "Usuário lê o próprio perfil"      on public.profiles;
drop policy if exists "Usuário atualiza o próprio perfil" on public.profiles;
drop policy if exists "Usuário insere o próprio perfil"   on public.profiles;

create policy "Usuário lê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário atualiza o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuário insere o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_app_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==================
-- 2. CATEGORIES
-- ==================
create table if not exists public.categories (
  id           text primary key,
  name         text not null,
  icon         text not null,
  color        text not null,
  is_default   boolean default true,
  user_id      uuid references public.profiles(id) on delete cascade
);

alter table public.categories enable row level security;

drop policy if exists "Categorias padrão visíveis a todos autenticados" on public.categories;
drop policy if exists "Usuário gerencia suas categorias"                 on public.categories;

create policy "Categorias padrão visíveis a todos autenticados"
  on public.categories for select
  using (auth.role() = 'authenticated' and (is_default = true or user_id = auth.uid()));

create policy "Usuário gerencia suas categorias"
  on public.categories for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

insert into public.categories (id, name, icon, color, is_default) values
  ('alimentacao',  'Alimentação',      'fa-utensils',        '#F59E0B', true),
  ('transporte',   'Transporte',       'fa-car',             '#3B82F6', true),
  ('moradia',      'Moradia',          'fa-house',           '#8B5CF6', true),
  ('saude',        'Saúde',            'fa-heart-pulse',     '#EC4899', true),
  ('educacao',     'Educação',         'fa-graduation-cap',  '#06B6D4', true),
  ('lazer',        'Lazer',            'fa-gamepad',         '#A855F7', true),
  ('assinaturas',  'Assinaturas',      'fa-tv',              '#14B8A6', true),
  ('energia',      'Energia',          'fa-bolt',            '#EAB308', true),
  ('agua',         'Água/Saneamento',  'fa-droplet',         '#0EA5E9', true),
  ('vestuario',    'Vestuário',        'fa-shirt',           '#F97316', true),
  ('salario',      'Salário',          'fa-money-bill-wave', '#10B981', true),
  ('freelance',    'Freelance',        'fa-briefcase',       '#059669', true),
  ('investimento', 'Investimento',     'fa-chart-line',      '#6366F1', true),
  ('outros',       'Outros',           'fa-ellipsis',        '#64748B', true)
on conflict (id) do nothing;


-- ==================
-- 3. TRANSACTIONS
-- ==================
create table if not exists public.transactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  description         text not null,
  amount              numeric(12,2) not null check (amount > 0),
  type                text not null check (type in ('income', 'expense')),
  category_id         text references public.categories(id),
  date                date not null default current_date,
  installments        int default 1,
  installment_current int default 1,
  is_imported         boolean default false,
  created_at          timestamptz default now() not null
);

alter table public.transactions enable row level security;

drop policy if exists "Usuário vê apenas suas transações"   on public.transactions;
drop policy if exists "Usuário insere suas transações"      on public.transactions;
drop policy if exists "Usuário atualiza suas transações"    on public.transactions;
drop policy if exists "Usuário deleta suas transações"      on public.transactions;

create policy "Usuário vê apenas suas transações"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Usuário insere suas transações"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza suas transações"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Usuário deleta suas transações"
  on public.transactions for delete
  using (auth.uid() = user_id);

create index if not exists idx_transactions_user_date
  on public.transactions(user_id, date desc);

create index if not exists idx_transactions_user_category
  on public.transactions(user_id, category_id);


-- ==================
-- 4. GOALS (METAS)
-- ==================
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  category_id   text references public.categories(id),
  limit_amount  numeric(12,2) not null check (limit_amount > 0),
  month         int not null check (month between 1 and 12),
  year          int not null check (year >= 2020),
  created_at    timestamptz default now() not null,
  unique(user_id, category_id, month, year)
);

alter table public.goals enable row level security;

drop policy if exists "Usuário vê apenas suas metas"  on public.goals;
drop policy if exists "Usuário gerencia suas metas"   on public.goals;

create policy "Usuário vê apenas suas metas"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Usuário gerencia suas metas"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ==================
-- 5. VIEW: resumo mensal
-- ==================
create or replace view public.monthly_summary
with (security_invoker = true)
as
select
  user_id,
  extract(year  from date)::int as year,
  extract(month from date)::int as month,
  category_id,
  type,
  sum(amount)   as total,
  count(*)      as count
from public.transactions
group by user_id, year, month, category_id, type;

-- =============================================
-- FIM — Success. No rows returned = tudo certo
-- =============================================
