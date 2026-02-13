create table if not exists buildhub.caixa_empresa_movimentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada', 'saida')),
  categoria text not null check (categoria in ('aporte', 'despesa_empresa', 'prolabore', 'outros')),
  descricao text not null,
  valor decimal(10, 2) not null check (valor > 0),
  data date not null default current_date,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_buildhub_caixa_empresa_user_id
  on buildhub.caixa_empresa_movimentos(user_id);

create index if not exists idx_buildhub_caixa_empresa_data
  on buildhub.caixa_empresa_movimentos(data);

create index if not exists idx_buildhub_caixa_empresa_tipo
  on buildhub.caixa_empresa_movimentos(tipo);

alter table buildhub.caixa_empresa_movimentos enable row level security;

create policy "Users can view their own company cash movements (buildhub)"
  on buildhub.caixa_empresa_movimentos
  for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own company cash movements (buildhub)"
  on buildhub.caixa_empresa_movimentos
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own company cash movements (buildhub)"
  on buildhub.caixa_empresa_movimentos
  for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own company cash movements (buildhub)"
  on buildhub.caixa_empresa_movimentos
  for delete to authenticated
  using (user_id = auth.uid());
