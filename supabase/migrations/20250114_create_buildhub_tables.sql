create schema if not exists buildhub;

-- Create user_role enum
create type buildhub.user_role as enum ('user', 'admin');

-- Create profiles table
create table buildhub.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role buildhub.user_role not null default 'user'::buildhub.user_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create trigger to sync users to buildhub.profiles
create or replace function buildhub.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = buildhub, public
as $$
declare
  user_count int;
begin
  select count(*) into user_count from buildhub.profiles;
  insert into buildhub.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when user_count = 0 then 'admin'::buildhub.user_role else 'user'::buildhub.user_role end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed_buildhub on auth.users;
create trigger on_auth_user_confirmed_buildhub
  after update on auth.users
  for each row
  when (old.confirmed_at is null and new.confirmed_at is not null)
  execute function buildhub.handle_new_user();

-- Create helper function for admin check
create or replace function buildhub.is_admin(uid uuid)
returns boolean language sql security definer set search_path = buildhub, public as $$
  select exists (
    select 1 from buildhub.profiles p
    where p.id = uid and p.role = 'admin'::buildhub.user_role
  );
$$;

-- Create clientes (clients) table
create table buildhub.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create project status enum
create type buildhub.status_obra as enum ('orcamento', 'a_iniciar', 'em_andamento', 'paralisada', 'finalizada');

-- Create obras (projects) table
create table buildhub.obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cliente_id uuid not null references buildhub.clientes(id) on delete cascade,
  status buildhub.status_obra not null default 'orcamento'::buildhub.status_obra,
  motivo_paralisacao text,
  data_inicio date,
  data_fim date,
  observacoes text,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create budget status enum
create type buildhub.status_orcamento as enum ('em_revisao', 'aprovado');

-- Create orcamentos (budgets) table
create table buildhub.orcamentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references buildhub.obras(id) on delete cascade,
  status buildhub.status_orcamento not null default 'em_revisao'::buildhub.status_orcamento,
  observacoes text,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create orcamento_itens (budget items) table
create table buildhub.orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references buildhub.orcamentos(id) on delete cascade,
  descricao text not null,
  quantidade decimal(10, 2) not null default 1,
  valor_unitario decimal(10, 2) not null default 0,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create receitas (revenues) table
create table buildhub.receitas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references buildhub.obras(id) on delete cascade,
  valor decimal(10, 2) not null,
  data date not null,
  forma_pagamento text,
  observacoes text,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create cost type enum
create type buildhub.tipo_custo as enum ('mao_de_obra', 'material_outros');

-- Create custos (costs) table
create table buildhub.custos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references buildhub.obras(id) on delete cascade,
  tipo buildhub.tipo_custo not null,
  valor decimal(10, 2) not null,
  data date not null,
  descricao text,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create charge type enum
create type buildhub.tipo_cobranca as enum ('hora', 'dia');

-- Create funcionarios (employees) table
create table buildhub.funcionarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_cobranca buildhub.tipo_cobranca not null,
  valor decimal(10, 2) not null,
  telefone text,
  observacoes text,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create equipe_obra (project team) table
create table buildhub.equipe_obra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references buildhub.obras(id) on delete cascade,
  funcionario_id uuid not null references buildhub.funcionarios(id) on delete cascade,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(obra_id, funcionario_id)
);

-- Create lancamentos_mao_obra (labor entries) table
create table buildhub.lancamentos_mao_obra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references buildhub.obras(id) on delete cascade,
  funcionario_id uuid not null references buildhub.funcionarios(id) on delete cascade,
  data date not null,
  quantidade decimal(10, 2) not null,
  observacoes text,
  user_id uuid not null references buildhub.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for better performance
create index idx_buildhub_clientes_user_id on buildhub.clientes(user_id);
create index idx_buildhub_obras_user_id on buildhub.obras(user_id);
create index idx_buildhub_obras_cliente_id on buildhub.obras(cliente_id);
create index idx_buildhub_obras_status on buildhub.obras(status);
create index idx_buildhub_orcamentos_obra_id on buildhub.orcamentos(obra_id);
create index idx_buildhub_orcamento_itens_orcamento_id on buildhub.orcamento_itens(orcamento_id);
create index idx_buildhub_receitas_obra_id on buildhub.receitas(obra_id);
create index idx_buildhub_receitas_data on buildhub.receitas(data);
create index idx_buildhub_custos_obra_id on buildhub.custos(obra_id);
create index idx_buildhub_custos_data on buildhub.custos(data);
create index idx_buildhub_funcionarios_user_id on buildhub.funcionarios(user_id);
create index idx_buildhub_equipe_obra_obra_id on buildhub.equipe_obra(obra_id);
create index idx_buildhub_equipe_obra_funcionario_id on buildhub.equipe_obra(funcionario_id);
create index idx_buildhub_lancamentos_obra_id on buildhub.lancamentos_mao_obra(obra_id);
create index idx_buildhub_lancamentos_funcionario_id on buildhub.lancamentos_mao_obra(funcionario_id);
create index idx_buildhub_lancamentos_data on buildhub.lancamentos_mao_obra(data);

-- Enable RLS on all tables
alter table buildhub.profiles enable row level security;
alter table buildhub.clientes enable row level security;
alter table buildhub.obras enable row level security;
alter table buildhub.orcamentos enable row level security;
alter table buildhub.orcamento_itens enable row level security;
alter table buildhub.receitas enable row level security;
alter table buildhub.custos enable row level security;
alter table buildhub.funcionarios enable row level security;
alter table buildhub.equipe_obra enable row level security;
alter table buildhub.lancamentos_mao_obra enable row level security;

-- Profiles policies
create policy "Users can view their own profile (buildhub)" on buildhub.profiles
  for select to authenticated using (auth.uid() = id);

create policy "Users can update their own profile (buildhub)" on buildhub.profiles
  for update to authenticated using (auth.uid() = id)
  with check (role is not distinct from (select role from buildhub.profiles where id = auth.uid()));

-- Clientes policies
create policy "Users can view their own clients (buildhub)" on buildhub.clientes
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own clients (buildhub)" on buildhub.clientes
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own clients (buildhub)" on buildhub.clientes
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own clients (buildhub)" on buildhub.clientes
  for delete to authenticated using (user_id = auth.uid());

-- Obras policies
create policy "Users can view their own projects (buildhub)" on buildhub.obras
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own projects (buildhub)" on buildhub.obras
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own projects (buildhub)" on buildhub.obras
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own projects (buildhub)" on buildhub.obras
  for delete to authenticated using (user_id = auth.uid());

-- Orcamentos policies
create policy "Users can view their own budgets (buildhub)" on buildhub.orcamentos
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own budgets (buildhub)" on buildhub.orcamentos
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own budgets (buildhub)" on buildhub.orcamentos
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own budgets (buildhub)" on buildhub.orcamentos
  for delete to authenticated using (user_id = auth.uid());

-- Orcamento_itens policies
create policy "Users can view their own budget items (buildhub)" on buildhub.orcamento_itens
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own budget items (buildhub)" on buildhub.orcamento_itens
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own budget items (buildhub)" on buildhub.orcamento_itens
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own budget items (buildhub)" on buildhub.orcamento_itens
  for delete to authenticated using (user_id = auth.uid());

-- Receitas policies
create policy "Users can view their own revenues (buildhub)" on buildhub.receitas
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own revenues (buildhub)" on buildhub.receitas
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own revenues (buildhub)" on buildhub.receitas
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own revenues (buildhub)" on buildhub.receitas
  for delete to authenticated using (user_id = auth.uid());

-- Custos policies
create policy "Users can view their own costs (buildhub)" on buildhub.custos
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own costs (buildhub)" on buildhub.custos
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own costs (buildhub)" on buildhub.custos
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own costs (buildhub)" on buildhub.custos
  for delete to authenticated using (user_id = auth.uid());

-- Funcionarios policies
create policy "Users can view their own employees (buildhub)" on buildhub.funcionarios
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own employees (buildhub)" on buildhub.funcionarios
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own employees (buildhub)" on buildhub.funcionarios
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own employees (buildhub)" on buildhub.funcionarios
  for delete to authenticated using (user_id = auth.uid());

-- Equipe_obra policies
create policy "Users can view their own project teams (buildhub)" on buildhub.equipe_obra
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own project teams (buildhub)" on buildhub.equipe_obra
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can delete their own project teams (buildhub)" on buildhub.equipe_obra
  for delete to authenticated using (user_id = auth.uid());

-- Lancamentos_mao_obra policies
create policy "Users can view their own labor entries (buildhub)" on buildhub.lancamentos_mao_obra
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert their own labor entries (buildhub)" on buildhub.lancamentos_mao_obra
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update their own labor entries (buildhub)" on buildhub.lancamentos_mao_obra
  for update to authenticated using (user_id = auth.uid());

create policy "Users can delete their own labor entries (buildhub)" on buildhub.lancamentos_mao_obra
  for delete to authenticated using (user_id = auth.uid());
