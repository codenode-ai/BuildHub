-- Create user_role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create trigger to sync users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create helper function for admin check
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Create clientes (clients) table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project status enum
CREATE TYPE public.status_obra AS ENUM ('orcamento', 'a_iniciar', 'em_andamento', 'paralisada', 'finalizada');

-- Create obras (projects) table
CREATE TABLE public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  status public.status_obra NOT NULL DEFAULT 'orcamento'::public.status_obra,
  motivo_paralisacao TEXT,
  data_inicio DATE,
  data_fim DATE,
  observacoes TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create budget status enum
CREATE TYPE public.status_orcamento AS ENUM ('em_revisao', 'aprovado');

-- Create orcamentos (budgets) table
CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  status public.status_orcamento NOT NULL DEFAULT 'em_revisao'::public.status_orcamento,
  observacoes TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orcamento_itens (budget items) table
CREATE TABLE public.orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade DECIMAL(10, 2) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create receitas (revenues) table
CREATE TABLE public.receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  valor DECIMAL(10, 2) NOT NULL,
  data DATE NOT NULL,
  forma_pagamento TEXT,
  observacoes TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cost type enum
CREATE TYPE public.tipo_custo AS ENUM ('mao_de_obra', 'material_outros');

-- Create custos (costs) table
CREATE TABLE public.custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  tipo public.tipo_custo NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data DATE NOT NULL,
  descricao TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create charge type enum
CREATE TYPE public.tipo_cobranca AS ENUM ('hora', 'dia');

-- Create funcionarios (employees) table
CREATE TABLE public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo_cobranca public.tipo_cobranca NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  telefone TEXT,
  observacoes TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create equipe_obra (project team) table
CREATE TABLE public.equipe_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(obra_id, funcionario_id)
);

-- Create lancamentos_mao_obra (labor entries) table
CREATE TABLE public.lancamentos_mao_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  quantidade DECIMAL(10, 2) NOT NULL,
  observacoes TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX idx_obras_user_id ON public.obras(user_id);
CREATE INDEX idx_obras_cliente_id ON public.obras(cliente_id);
CREATE INDEX idx_obras_status ON public.obras(status);
CREATE INDEX idx_orcamentos_obra_id ON public.orcamentos(obra_id);
CREATE INDEX idx_orcamento_itens_orcamento_id ON public.orcamento_itens(orcamento_id);
CREATE INDEX idx_receitas_obra_id ON public.receitas(obra_id);
CREATE INDEX idx_receitas_data ON public.receitas(data);
CREATE INDEX idx_custos_obra_id ON public.custos(obra_id);
CREATE INDEX idx_custos_data ON public.custos(data);
CREATE INDEX idx_funcionarios_user_id ON public.funcionarios(user_id);
CREATE INDEX idx_equipe_obra_obra_id ON public.equipe_obra(obra_id);
CREATE INDEX idx_equipe_obra_funcionario_id ON public.equipe_obra(funcionario_id);
CREATE INDEX idx_lancamentos_obra_id ON public.lancamentos_mao_obra(obra_id);
CREATE INDEX idx_lancamentos_funcionario_id ON public.lancamentos_mao_obra(funcionario_id);
CREATE INDEX idx_lancamentos_data ON public.lancamentos_mao_obra(data);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_mao_obra ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Clientes policies
CREATE POLICY "Users can view their own clients" ON public.clientes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own clients" ON public.clientes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own clients" ON public.clientes
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own clients" ON public.clientes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Obras policies
CREATE POLICY "Users can view their own projects" ON public.obras
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own projects" ON public.obras
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON public.obras
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" ON public.obras
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Orcamentos policies
CREATE POLICY "Users can view their own budgets" ON public.orcamentos
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own budgets" ON public.orcamentos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own budgets" ON public.orcamentos
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own budgets" ON public.orcamentos
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Orcamento_itens policies
CREATE POLICY "Users can view their own budget items" ON public.orcamento_itens
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own budget items" ON public.orcamento_itens
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own budget items" ON public.orcamento_itens
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own budget items" ON public.orcamento_itens
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Receitas policies
CREATE POLICY "Users can view their own revenues" ON public.receitas
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own revenues" ON public.receitas
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own revenues" ON public.receitas
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own revenues" ON public.receitas
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Custos policies
CREATE POLICY "Users can view their own costs" ON public.custos
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own costs" ON public.custos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own costs" ON public.custos
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own costs" ON public.custos
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Funcionarios policies
CREATE POLICY "Users can view their own employees" ON public.funcionarios
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own employees" ON public.funcionarios
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own employees" ON public.funcionarios
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own employees" ON public.funcionarios
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Equipe_obra policies
CREATE POLICY "Users can view their own project teams" ON public.equipe_obra
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own project teams" ON public.equipe_obra
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own project teams" ON public.equipe_obra
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Lancamentos_mao_obra policies
CREATE POLICY "Users can view their own labor entries" ON public.lancamentos_mao_obra
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own labor entries" ON public.lancamentos_mao_obra
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own labor entries" ON public.lancamentos_mao_obra
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own labor entries" ON public.lancamentos_mao_obra
  FOR DELETE TO authenticated USING (user_id = auth.uid());