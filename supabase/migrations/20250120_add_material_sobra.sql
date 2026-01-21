create table buildhub.materiais_sobra (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  unidade text,
  quantidade decimal(10, 2) not null,
  valor_total decimal(10, 2) not null,
  obra_origem_id uuid references buildhub.obras(id) on delete set null,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table buildhub.materiais_sobra_aplicacoes (
  id uuid primary key default gen_random_uuid(),
  material_sobra_id uuid not null references buildhub.materiais_sobra(id) on delete cascade,
  obra_destino_id uuid not null references buildhub.obras(id) on delete cascade,
  quantidade decimal(10, 2) not null,
  valor_credito decimal(10, 2) not null,
  data date not null default current_date,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_buildhub_materiais_sobra_user_id on buildhub.materiais_sobra(user_id);
create index idx_buildhub_materiais_sobra_obra_origem_id on buildhub.materiais_sobra(obra_origem_id);
create index idx_buildhub_materiais_sobra_aplicacoes_user_id on buildhub.materiais_sobra_aplicacoes(user_id);
create index idx_buildhub_materiais_sobra_aplicacoes_material_id on buildhub.materiais_sobra_aplicacoes(material_sobra_id);
create index idx_buildhub_materiais_sobra_aplicacoes_obra_destino_id on buildhub.materiais_sobra_aplicacoes(obra_destino_id);
create index idx_buildhub_materiais_sobra_aplicacoes_data on buildhub.materiais_sobra_aplicacoes(data);

alter table buildhub.materiais_sobra enable row level security;
alter table buildhub.materiais_sobra_aplicacoes enable row level security;

create policy "Users can view their own material leftovers (buildhub)" on buildhub.materiais_sobra
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own material leftovers (buildhub)" on buildhub.materiais_sobra
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own material leftovers (buildhub)" on buildhub.materiais_sobra
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own material leftovers (buildhub)" on buildhub.materiais_sobra
  for delete to authenticated using (user_id = auth.uid());

create policy "Users can view their own leftover applications (buildhub)" on buildhub.materiais_sobra_aplicacoes
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own leftover applications (buildhub)" on buildhub.materiais_sobra_aplicacoes
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can delete their own leftover applications (buildhub)" on buildhub.materiais_sobra_aplicacoes
  for delete to authenticated using (user_id = auth.uid());
