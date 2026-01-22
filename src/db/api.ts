import { supabase } from './supabase';
import type {
  Cliente,
  Obra,
  ObraWithCliente,
  Orcamento,
  OrcamentoItem,
  Receita,
  Custo,
  Funcionario,
  EquipeObra,
  EquipeObraWithFuncionario,
  LancamentoMaoObra,
  LancamentoMaoObraWithFuncionario,
  MaterialSobra,
  MaterialSobraAplicacao,
  Material,
  MaterialMovimento,
  AlocacaoDiaria,
} from '@/types/types';

// Clientes API
export const clientesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome');
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(cliente: Partial<Cliente>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('clientes')
      .insert({ ...cliente, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, cliente: Partial<Cliente>) {
    const { data, error } = await supabase
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Obras API
export const obrasApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('obras')
      .select('*, clientes(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getCompletedByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('obras')
      .select('id')
      .eq('status', 'finalizada')
      .gte('data_fim', startDate)
      .lte('data_fim', endDate);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getByStatus(status: string) {
    const { data, error } = await supabase
      .from('obras')
      .select('*, clientes(*)')
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getByClienteId(clienteId: string) {
    const { data, error } = await supabase
      .from('obras')
      .select('*, clientes(*)')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('obras')
      .select('*, clientes(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(obra: Partial<Obra>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('obras')
      .insert({ ...obra, user_id: user.id })
      .select('*, clientes(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, obra: Partial<Obra>) {
    const { data, error } = await supabase
      .from('obras')
      .update(obra)
      .eq('id', id)
      .select('*, clientes(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('obras')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getMetrics() {
    const { data: obras, error } = await supabase
      .from('obras')
      .select('status');
    if (error) throw error;

    const ativas = obras?.filter(o => ['a_iniciar', 'em_andamento'].includes(o.status)).length || 0;
    const finalizadas = obras?.filter(o => o.status === 'finalizada').length || 0;
    const total = obras?.length || 0;

    return { ativas, finalizadas, total };
  },
};

// Materiais API
export const materiaisApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('materiais')
      .select('*')
      .order('nome');
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(material: Partial<Material>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('materiais')
      .insert({ ...material, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, material: Partial<Material>) {
    const { data, error } = await supabase
      .from('materiais')
      .update(material)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('materiais')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Materiais Movimentos API
export const materiaisMovimentosApi = {
  async getByObraId(obraId: string) {
    const { data, error } = await supabase
      .from('materiais_movimentos')
      .select('*')
      .eq('obra_id', obraId)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getAllByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('materiais_movimentos')
      .select('*')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(movimento: Partial<MaterialMovimento>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('materiais_movimentos')
      .insert({ ...movimento, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, movimento: Partial<MaterialMovimento>) {
    const { data, error } = await supabase
      .from('materiais_movimentos')
      .update(movimento)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('materiais_movimentos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Alocacoes Diarias API
export const alocacoesDiariasApi = {
  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('alocacoes_diarias')
      .select('*')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: true });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getByObraId(obraId: string) {
    const { data, error } = await supabase
      .from('alocacoes_diarias')
      .select('*')
      .eq('obra_id', obraId)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(alocacao: Partial<AlocacaoDiaria>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('alocacoes_diarias')
      .insert({ ...alocacao, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, alocacao: Partial<AlocacaoDiaria>) {
    const { data, error } = await supabase
      .from('alocacoes_diarias')
      .update(alocacao)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('alocacoes_diarias')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Orcamentos API
export const orcamentosApi = {
  async getByObraId(obraId: string) {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('obra_id', obraId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(orcamento: Partial<Orcamento>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('orcamentos')
      .insert({ ...orcamento, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, orcamento: Partial<Orcamento>) {
    const { data, error } = await supabase
      .from('orcamentos')
      .update(orcamento)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Orcamento Itens API
export const orcamentoItensApi = {
  async getByOrcamentoId(orcamentoId: string) {
    const { data, error } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', orcamentoId)
      .order('created_at');
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(item: Partial<OrcamentoItem>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('orcamento_itens')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, item: Partial<OrcamentoItem>) {
    const { data, error } = await supabase
      .from('orcamento_itens')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('orcamento_itens')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Receitas API
export const receitasApi = {
  async getByObraId(obraId: string) {
    const { data, error } = await supabase
      .from('receitas')
      .select('*')
      .eq('obra_id', obraId)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getAllByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('receitas')
      .select('*')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(receita: Partial<Receita>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('receitas')
      .insert({ ...receita, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, receita: Partial<Receita>) {
    const { data, error } = await supabase
      .from('receitas')
      .update(receita)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('receitas')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getTotalByObraId(obraId: string) {
    const { data, error } = await supabase
      .from('receitas')
      .select('valor')
      .eq('obra_id', obraId);
    if (error) throw error;
    return data?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
  },
};

// Custos API
export const custosApi = {
  async getByObraId(obraId: string) {
    const { data, error } = await supabase
      .from('custos')
      .select('*')
      .eq('obra_id', obraId)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getAllByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('custos')
      .select('*')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(custo: Partial<Custo>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('custos')
      .insert({ ...custo, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, custo: Partial<Custo>) {
    const { data, error } = await supabase
      .from('custos')
      .update(custo)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('custos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getTotalByObraId(obraId: string) {
    const { data, error } = await supabase
      .from('custos')
      .select('valor')
      .eq('obra_id', obraId);
    if (error) throw error;
    return data?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;
  },
};

// Funcionarios API
export const funcionariosApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('nome');
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(funcionario: Partial<Funcionario>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('funcionarios')
      .insert({ ...funcionario, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, funcionario: Partial<Funcionario>) {
    const { data, error } = await supabase
      .from('funcionarios')
      .update(funcionario)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Equipe Obra API
export const equipeObraApi = {
  async getByObraId(obraId: string) {
    const { data, error } = await supabase
      .from('equipe_obra')
      .select('*, funcionarios(*)')
      .eq('obra_id', obraId)
      .order('created_at');
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async addFuncionario(obraId: string, funcionarioId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('equipe_obra')
      .insert({ obra_id: obraId, funcionario_id: funcionarioId, user_id: user.id })
      .select('*, funcionarios(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async removeFuncionario(id: string) {
    const { error } = await supabase
      .from('equipe_obra')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Lancamentos Mao de Obra API
export const lancamentosMaoObraApi = {
  async getByObraId(obraId: string) {
    const { data, error } = await supabase
      .from('lancamentos_mao_obra')
      .select('*, funcionarios(*)')
      .eq('obra_id', obraId)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getAllByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('lancamentos_mao_obra')
      .select('*')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(lancamento: Partial<LancamentoMaoObra>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('lancamentos_mao_obra')
      .insert({ ...lancamento, user_id: user.id })
      .select('*, funcionarios(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, lancamento: Partial<LancamentoMaoObra>) {
    const { data, error } = await supabase
      .from('lancamentos_mao_obra')
      .update(lancamento)
      .eq('id', id)
      .select('*, funcionarios(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('lancamentos_mao_obra')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getTotalByObraId(obraId: string) {
    const { data: lancamentos, error: lancError } = await supabase
      .from('lancamentos_mao_obra')
      .select('quantidade, funcionario_id')
      .eq('obra_id', obraId);
    if (lancError) throw lancError;

    const { data: funcionarios, error: funcError } = await supabase
      .from('funcionarios')
      .select('id, valor');
    if (funcError) throw funcError;

    let total = 0;
    lancamentos?.forEach(lanc => {
      const func = funcionarios?.find(f => f.id === lanc.funcionario_id);
      if (func) {
        total += Number(lanc.quantidade) * Number(func.valor);
      }
    });

    return total;
  },
};

// Materiais Sobra API
export const materiaisSobraApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('materiais_sobra')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getByObraOrigemId(obraId: string) {
    const { data, error } = await supabase
      .from('materiais_sobra')
      .select('*')
      .eq('obra_origem_id', obraId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(material: Partial<MaterialSobra>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('materiais_sobra')
      .insert({ ...material, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, material: Partial<MaterialSobra>) {
    const { data, error } = await supabase
      .from('materiais_sobra')
      .update(material)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('materiais_sobra')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Materiais Sobra Aplicacoes API
export const materiaisSobraAplicacoesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('materiais_sobra_aplicacoes')
      .select('*')
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getByObraDestinoId(obraId: string) {
    const { data, error } = await supabase
      .from('materiais_sobra_aplicacoes')
      .select('*')
      .eq('obra_destino_id', obraId)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getAllByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('materiais_sobra_aplicacoes')
      .select('*')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(aplicacao: Partial<MaterialSobraAplicacao>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('materiais_sobra_aplicacoes')
      .insert({ ...aplicacao, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('materiais_sobra_aplicacoes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
