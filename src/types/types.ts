export type Profile = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
};

export type Cliente = {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type StatusObra = 'orcamento' | 'a_iniciar' | 'em_andamento' | 'paralisada' | 'finalizada';

export type Obra = {
  id: string;
  nome: string;
  cliente_id: string;
  status: StatusObra;
  motivo_paralisacao?: string;
  data_inicio?: string;
  data_fim?: string;
  observacoes?: string;
  orcamento_total?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type ObraWithCliente = Obra & {
  clientes: Cliente;
};

export type StatusOrcamento = 'em_revisao' | 'aprovado';

export type Orcamento = {
  id: string;
  obra_id: string;
  status: StatusOrcamento;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type OrcamentoItem = {
  id: string;
  orcamento_id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Receita = {
  id: string;
  obra_id: string;
  valor: number;
  data: string;
  forma_pagamento?: string;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type TipoCusto = 'mao_de_obra' | 'material_outros';

export type Custo = {
  id: string;
  obra_id: string;
  tipo: TipoCusto;
  valor: number;
  data: string;
  descricao?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type TipoCobranca = 'hora' | 'dia';

export type Funcionario = {
  id: string;
  nome: string;
  tipo_cobranca: TipoCobranca;
  valor: number;
  telefone?: string;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type EquipeObra = {
  id: string;
  obra_id: string;
  funcionario_id: string;
  user_id: string;
  created_at: string;
};

export type EquipeObraWithFuncionario = EquipeObra & {
  funcionarios: Funcionario;
};

export type LancamentoMaoObra = {
  id: string;
  obra_id: string;
  funcionario_id: string;
  data: string;
  quantidade: number;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type LancamentoMaoObraWithFuncionario = LancamentoMaoObra & {
  funcionarios: Funcionario;
};

export type Material = {
  id: string;
  nome: string;
  unidade?: string;
  preco_referencia?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type TipoMovimentoMaterial = 'uso' | 'sobra' | 'ajuste';

export type MaterialMovimento = {
  id: string;
  obra_id?: string | null;
  material_id: string;
  tipo: TipoMovimentoMaterial;
  quantidade: number;
  valor_total: number;
  data: string;
  observacao?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type AlocacaoDiaria = {
  id: string;
  data: string;
  funcionario_id: string;
  obra_id: string;
  horas: number;
  valor_hora: number;
  observacao?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type MaterialSobra = {
  id: string;
  descricao: string;
  unidade?: string;
  quantidade: number;
  valor_total: number;
  material_id?: string | null;
  movimento_estoque_id?: string | null;
  obra_origem_id?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type MaterialSobraAplicacao = {
  id: string;
  material_sobra_id: string;
  obra_destino_id: string;
  quantidade: number;
  valor_credito: number;
  data: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};
