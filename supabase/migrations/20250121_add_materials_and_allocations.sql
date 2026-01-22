alter table buildhub.obras
  add column if not exists orcamento_total decimal(10, 2) not null default 0;

create table buildhub.materiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  unidade text,
  preco_referencia decimal(10, 2),
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type buildhub.tipo_movimento_material as enum ('uso', 'sobra', 'ajuste');

create table buildhub.materiais_movimentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references buildhub.obras(id) on delete cascade,
  material_id uuid not null references buildhub.materiais(id) on delete cascade,
  tipo buildhub.tipo_movimento_material not null default 'uso'::buildhub.tipo_movimento_material,
  quantidade decimal(10, 2) not null,
  valor_total decimal(10, 2) not null,
  data date not null default current_date,
  observacao text,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table buildhub.alocacoes_diarias (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  funcionario_id uuid not null references buildhub.funcionarios(id) on delete cascade,
  obra_id uuid not null references buildhub.obras(id) on delete cascade,
  horas decimal(10, 2) not null,
  valor_hora decimal(10, 2) not null,
  observacao text,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (data, funcionario_id, obra_id)
);

create index idx_buildhub_materiais_user_id on buildhub.materiais(user_id);
create index idx_buildhub_materiais_movimentos_obra_id on buildhub.materiais_movimentos(obra_id);
create index idx_buildhub_materiais_movimentos_material_id on buildhub.materiais_movimentos(material_id);
create index idx_buildhub_materiais_movimentos_data on buildhub.materiais_movimentos(data);
create index idx_buildhub_alocacoes_diarias_obra_id on buildhub.alocacoes_diarias(obra_id);
create index idx_buildhub_alocacoes_diarias_funcionario_id on buildhub.alocacoes_diarias(funcionario_id);
create index idx_buildhub_alocacoes_diarias_data on buildhub.alocacoes_diarias(data);
create index idx_buildhub_alocacoes_diarias_user_id on buildhub.alocacoes_diarias(user_id);

alter table buildhub.materiais enable row level security;
alter table buildhub.materiais_movimentos enable row level security;
alter table buildhub.alocacoes_diarias enable row level security;

create policy "Users can view their own materials (buildhub)" on buildhub.materiais
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own materials (buildhub)" on buildhub.materiais
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own materials (buildhub)" on buildhub.materiais
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own materials (buildhub)" on buildhub.materiais
  for delete to authenticated using (user_id = auth.uid());

create policy "Users can view their own material movements (buildhub)" on buildhub.materiais_movimentos
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own material movements (buildhub)" on buildhub.materiais_movimentos
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own material movements (buildhub)" on buildhub.materiais_movimentos
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own material movements (buildhub)" on buildhub.materiais_movimentos
  for delete to authenticated using (user_id = auth.uid());

create policy "Users can view their own daily allocations (buildhub)" on buildhub.alocacoes_diarias
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own daily allocations (buildhub)" on buildhub.alocacoes_diarias
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own daily allocations (buildhub)" on buildhub.alocacoes_diarias
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own daily allocations (buildhub)" on buildhub.alocacoes_diarias
  for delete to authenticated using (user_id = auth.uid());
