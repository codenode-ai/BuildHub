import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  obrasApi,
  orcamentosApi,
  orcamentoItensApi,
  receitasApi,
  custosApi,
  equipeObraApi,
  lancamentosMaoObraApi,
  funcionariosApi,
  materiaisApi,
  materiaisMovimentosApi,
  alocacoesDiariasApi,
} from '@/db/api';
import type {
  ObraWithCliente,
  Orcamento,
  OrcamentoItem,
  Receita,
  Custo,
  EquipeObraWithFuncionario,
  LancamentoMaoObraWithFuncionario,
  Funcionario,
  TipoCusto,
  StatusObra,
  MaterialMovimento,
  Material,
  AlocacaoDiaria,
} from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ObraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [obra, setObra] = useState<ObraWithCliente | null>(null);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [orcamentoItens, setOrcamentoItens] = useState<OrcamentoItem[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [custos, setCustos] = useState<Custo[]>([]);
  const [equipe, setEquipe] = useState<EquipeObraWithFuncionario[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoMaoObraWithFuncionario[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoDiaria[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [movimentos, setMovimentos] = useState<MaterialMovimento[]>([]);
  const [movimentosEstoque, setMovimentosEstoque] = useState<MaterialMovimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: string } | null>(null);
  
  // Form states
  const [itemDialog, setItemDialog] = useState(false);
  const [receitaDialog, setReceitaDialog] = useState(false);
  const [custoDialog, setCustoDialog] = useState(false);
  const [lancamentoDialog, setLancamentoDialog] = useState(false);
  const [addFuncionarioDialog, setAddFuncionarioDialog] = useState(false);
  const [materialDialog, setMaterialDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('resumo');
  
  const [editingItem, setEditingItem] = useState<OrcamentoItem | null>(null);
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null);
  const [editingCusto, setEditingCusto] = useState<Custo | null>(null);
  const [editingLancamento, setEditingLancamento] = useState<LancamentoMaoObraWithFuncionario | null>(null);

  const [itemForm, setItemForm] = useState({ descricao: '', quantidade: '1', valor_unitario: '0' });
  const [receitaForm, setReceitaForm] = useState({ valor: '', data: '', observacoes: '' });
  const [custoForm, setCustoForm] = useState({ tipo: 'material_outros' as TipoCusto, valor: '', data: '', descricao: '' });
  const [lancamentoForm, setLancamentoForm] = useState({ funcionario_id: '', data: '', quantidade: '', observacoes: '' });
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState('');
  const [materialForm, setMaterialForm] = useState({
    material_id: '',
    quantidade: '',
    data: '',
    observacao: '',
  });
  const [alocacaoForm, setAlocacaoForm] = useState({
    funcionario_id: '',
    data: new Date().toISOString().split('T')[0],
    horas: '',
    observacao: '',
  });
  const [editingAlocacaoId, setEditingAlocacaoId] = useState<string | null>(null);
  const [materialCreateOpen, setMaterialCreateOpen] = useState(false);
  const [materialCreateForm, setMaterialCreateForm] = useState({
    nome: '',
    preco_referencia: '',
    quantidade_inicial: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [
        obraData,
        orcamentoData,
        receitasData,
        custosData,
        equipeData,
        lancamentosData,
        funcionariosData,
        materiaisData,
        movimentosData,
        movimentosEstoqueData,
        alocacoesData,
      ] = await Promise.all([
        obrasApi.getById(id),
        orcamentosApi.getByObraId(id),
        receitasApi.getByObraId(id),
        custosApi.getByObraId(id),
        equipeObraApi.getByObraId(id),
        lancamentosMaoObraApi.getByObraId(id),
        funcionariosApi.getAll(),
        materiaisApi.getAll(),
        materiaisMovimentosApi.getByObraId(id),
        materiaisMovimentosApi.getAll(),
        alocacoesDiariasApi.getByObraId(id),
      ]);

      setObra(obraData);
      setOrcamento(orcamentoData);
      setReceitas(receitasData);
      setCustos(custosData);
      setEquipe(equipeData);
      setLancamentos(lancamentosData);
      setFuncionarios(funcionariosData);
      setMateriais(materiaisData);
      setMovimentos(movimentosData);
      setMovimentosEstoque(movimentosEstoqueData);
      setAlocacoes(alocacoesData);

      if (orcamentoData) {
        const itensData = await orcamentoItensApi.getByOrcamentoId(orcamentoData.id);
        setOrcamentoItens(itensData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: t('messages.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: StatusObra) => {
    const variants: Record<StatusObra, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      orcamento: { variant: 'outline', label: t('status.orcamento') },
      a_iniciar: { variant: 'secondary', label: t('status.a_iniciar') },
      em_andamento: { variant: 'default', label: t('status.em_andamento') },
      paralisada: { variant: 'destructive', label: t('status.paralisada') },
      finalizada: { variant: 'secondary', label: t('status.finalizada') },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Calculations
  const totalOrcado = orcamentoItens.reduce((sum, item) => sum + Number(item.quantidade) * Number(item.valor_unitario), 0);
  const totalRecebido = receitas.reduce((sum, r) => sum + Number(r.valor), 0);
  const materialCustos = custos.filter((c) => c.tipo === 'material_outros');
  const maoDeObraCustos = custos.filter((c) => c.tipo === 'mao_de_obra');
  const totalCustosMateriaisLegado = materialCustos.reduce((sum, c) => sum + Number(c.valor), 0);
  const totalMateriaisMovimentos = movimentos
    .filter((mov) => mov.tipo === 'uso')
    .reduce((sum, mov) => sum + Number(mov.valor_total), 0);
  const totalCustosMateriais = totalCustosMateriaisLegado + totalMateriaisMovimentos;
  const totalMaoObraLancamentos = alocacoes.length > 0
    ? 0
    : lancamentos.reduce((sum, l) => {
        const func = funcionarios.find(f => f.id === l.funcionario_id);
        return sum + (func ? Number(l.quantidade) * Number(func.valor) : 0);
      }, 0);
  const totalMaoObraAlocacoes = alocacoes.reduce(
    (sum, a) => sum + Number(a.horas) * Number(a.valor_hora),
    0
  );
  const totalMaoObra = totalMaoObraLancamentos + totalMaoObraAlocacoes + maoDeObraCustos.reduce((sum, c) => sum + Number(c.valor), 0);
  const resultado = totalRecebido - totalCustosMateriais - totalMaoObra;
  const orcamentoTotal = obra?.orcamento_total ? Number(obra.orcamento_total) : 0;
  const saldoOrcamento = orcamentoTotal - totalCustosMateriais - totalMaoObra;
  const estoquePorMaterial = useMemo(() => {
    const map = new Map<string, number>();
    movimentosEstoque.forEach((mov) => {
      const atual = map.get(mov.material_id) || 0;
      const quantidade = Number(mov.quantidade);
      const delta = mov.tipo === 'uso' ? -quantidade : quantidade;
      map.set(mov.material_id, atual + delta);
    });
    return map;
  }, [movimentosEstoque]);
  const selectedMaterial = materiais.find((item) => item.id === materialForm.material_id);
  const valorUnitarioMaterial = selectedMaterial?.preco_referencia ? Number(selectedMaterial.preco_referencia) : 0;
  const totalUsoMaterial = (Number(materialForm.quantidade) || 0) * valorUnitarioMaterial;

  // Budget Item handlers
  const openItemDialog = (item?: OrcamentoItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        descricao: item.descricao,
        quantidade: item.quantidade.toString(),
        valor_unitario: item.valor_unitario.toString(),
      });
    } else {
      setEditingItem(null);
      setItemForm({ descricao: '', quantidade: '1', valor_unitario: '0' });
    }
    setItemDialog(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orcamento || !id) return;

    try {
      const data = {
        orcamento_id: orcamento.id,
        descricao: itemForm.descricao,
        quantidade: parseFloat(itemForm.quantidade),
        valor_unitario: parseFloat(itemForm.valor_unitario),
      };

      if (editingItem) {
        await orcamentoItensApi.update(editingItem.id, data);
      } else {
        // Create budget if doesn't exist
        if (!orcamento) {
          const newOrcamento = await orcamentosApi.create({ obra_id: id });
          setOrcamento(newOrcamento);
          await orcamentoItensApi.create({ ...data, orcamento_id: newOrcamento.id });
        } else {
          await orcamentoItensApi.create(data);
        }
      }

      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setItemDialog(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  // Revenue handlers
  const openReceitaDialog = (receita?: Receita) => {
    if (receita) {
      setEditingReceita(receita);
      setReceitaForm({
        valor: receita.valor.toString(),
        data: receita.data,
        observacoes: receita.observacoes || '',
      });
    } else {
      setEditingReceita(null);
      setReceitaForm({ valor: '', data: new Date().toISOString().split('T')[0], observacoes: '' });
    }
    setReceitaDialog(true);
  };

  const handleReceitaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const data = {
        obra_id: id,
        valor: parseFloat(receitaForm.valor),
        data: receitaForm.data,
        observacoes: receitaForm.observacoes || undefined,
      };

      if (editingReceita) {
        await receitasApi.update(editingReceita.id, data);
      } else {
        await receitasApi.create(data);
      }

      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setReceitaDialog(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  // Cost handlers
  const openCustoDialog = (custo?: Custo) => {
    if (custo) {
      setEditingCusto(custo);
      setCustoForm({
        tipo: custo.tipo,
        valor: custo.valor.toString(),
        data: custo.data,
        descricao: custo.descricao || '',
      });
    } else {
      setEditingCusto(null);
      setCustoForm({ tipo: 'material_outros', valor: '', data: new Date().toISOString().split('T')[0], descricao: '' });
    }
    setCustoDialog(true);
  };

  const handleCustoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const data = {
        obra_id: id,
        tipo: custoForm.tipo,
        valor: parseFloat(custoForm.valor),
        data: custoForm.data,
        descricao: custoForm.descricao || undefined,
      };

      if (editingCusto) {
        await custosApi.update(editingCusto.id, data);
      } else {
        await custosApi.create(data);
      }

      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setCustoDialog(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar custo:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  // Material handlers
  const openMaterialDialog = () => {
    setMaterialForm({
      material_id: '',
      quantidade: '',
      data: new Date().toISOString().split('T')[0],
      observacao: '',
    });
    setMaterialCreateOpen(false);
    setMaterialCreateForm({ nome: '', preco_referencia: '', quantidade_inicial: '' });
    setMaterialDialog(true);
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const selectedMaterial = materiais.find((item) => item.id === materialForm.material_id);
      const valorUnitario = selectedMaterial?.preco_referencia ? Number(selectedMaterial.preco_referencia) : 0;
      const estoqueDisponivel = estoquePorMaterial.get(materialForm.material_id) || 0;
      if (Number(materialForm.quantidade) > estoqueDisponivel) {
        toast({
          title: 'Erro',
          description: 'Quantidade acima do estoque disponivel.',
          variant: 'destructive',
        });
        return;
      }
      if (!valorUnitario) {
        toast({
          title: 'Erro',
          description: 'Defina o preco unitario do material.',
          variant: 'destructive',
        });
        return;
      }
      const data = {
        obra_id: id,
        material_id: materialForm.material_id,
        tipo: 'uso',
        quantidade: parseFloat(materialForm.quantidade),
        valor_total: parseFloat(materialForm.quantidade) * valorUnitario,
        data: materialForm.data,
        observacao: materialForm.observacao || undefined,
      };

      await materiaisMovimentosApi.create(data);

      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setMaterialDialog(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  const handleMaterialCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const quantidadeInicial = Number(materialCreateForm.quantidade_inicial);
      if (!Number.isInteger(quantidadeInicial)) {
        toast({ title: 'Erro', description: 'Quantidade deve ser um numero inteiro.', variant: 'destructive' });
        return;
      }
      const valorUnitario = Number(materialCreateForm.preco_referencia);
      if (!materialCreateForm.nome || !quantidadeInicial || !valorUnitario) {
        toast({ title: 'Erro', description: t('messages.required'), variant: 'destructive' });
        return;
      }
      const novo = await materiaisApi.create({
        nome: materialCreateForm.nome,
        preco_referencia: materialCreateForm.preco_referencia
          ? Number(materialCreateForm.preco_referencia)
          : undefined,
      });
      await materiaisMovimentosApi.create({
        material_id: novo.id,
        tipo: 'ajuste',
        quantidade: quantidadeInicial,
        valor_total: quantidadeInicial * valorUnitario,
        data: new Date().toISOString().split('T')[0],
        observacao: 'Estoque inicial',
        obra_id: null,
      });
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setMaterialCreateForm({ nome: '', preco_referencia: '', quantidade_inicial: '' });
      setMaterialCreateOpen(false);
      loadData();
      setMaterialForm({ ...materialForm, material_id: novo.id });
    } catch (error) {
      console.error('Erro ao criar material:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  const startEditAlocacao = (alocacao: AlocacaoDiaria) => {
    setEditingAlocacaoId(alocacao.id);
    setAlocacaoForm({
      funcionario_id: alocacao.funcionario_id,
      data: alocacao.data,
      horas: alocacao.horas.toString(),
      observacao: alocacao.observacao || '',
    });
  };

  const resetAlocacaoForm = () => {
    setEditingAlocacaoId(null);
    setAlocacaoForm({
      funcionario_id: '',
      data: new Date().toISOString().split('T')[0],
      horas: '',
      observacao: '',
    });
  };

  const handleAlocacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!alocacaoForm.funcionario_id || !alocacaoForm.horas) {
      toast({ title: 'Erro', description: t('messages.required'), variant: 'destructive' });
      return;
    }
    const funcionario = funcionarios.find((item) => item.id === alocacaoForm.funcionario_id);
    if (!funcionario) {
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
      return;
    }

    try {
      await alocacoesDiariasApi.create({
        obra_id: id,
        funcionario_id: alocacaoForm.funcionario_id,
        data: alocacaoForm.data,
        horas: Number(alocacaoForm.horas),
        valor_hora: Number(funcionario.valor),
        observacao: alocacaoForm.observacao || undefined,
      });
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      resetAlocacaoForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar alocacao:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  const handleAlocacaoDelete = async (alocacaoId: string) => {
    try {
      await alocacoesDiariasApi.delete(alocacaoId);
      toast({ title: 'Sucesso', description: t('messages.deleteSuccess') });
      if (editingAlocacaoId === alocacaoId) {
        resetAlocacaoForm();
      }
      loadData();
    } catch (error) {
      console.error('Erro ao excluir alocacao:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  // Labor entry handlers
  const openLancamentoDialog = (lancamento?: LancamentoMaoObraWithFuncionario) => {
    if (lancamento) {
      setEditingLancamento(lancamento);
      setLancamentoForm({
        funcionario_id: lancamento.funcionario_id,
        data: lancamento.data,
        quantidade: lancamento.quantidade.toString(),
        observacoes: lancamento.observacoes || '',
      });
    } else {
      setEditingLancamento(null);
      setLancamentoForm({ funcionario_id: '', data: new Date().toISOString().split('T')[0], quantidade: '', observacoes: '' });
    }
    setLancamentoDialog(true);
  };

  const handleLancamentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const data = {
        obra_id: id,
        funcionario_id: lancamentoForm.funcionario_id,
        data: lancamentoForm.data,
        quantidade: parseFloat(lancamentoForm.quantidade),
        observacoes: lancamentoForm.observacoes || undefined,
      };

      if (editingLancamento) {
        await lancamentosMaoObraApi.update(editingLancamento.id, data);
      } else {
        await lancamentosMaoObraApi.create(data);
      }

      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setLancamentoDialog(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  // Team handlers
  const handleAddFuncionario = async () => {
    if (!id || !selectedFuncionarioId) return;

    try {
      await equipeObraApi.addFuncionario(id, selectedFuncionarioId);
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setAddFuncionarioDialog(false);
      setSelectedFuncionarioId('');
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteDialog) return;

    try {
      switch (deleteDialog.type) {
        case 'item':
          await orcamentoItensApi.delete(deleteDialog.id);
          break;
        case 'receita':
          await receitasApi.delete(deleteDialog.id);
          break;
        case 'custo':
          await custosApi.delete(deleteDialog.id);
          break;
        case 'lancamento':
          await lancamentosMaoObraApi.delete(deleteDialog.id);
          break;
        case 'equipe':
          await equipeObraApi.removeFuncionario(deleteDialog.id);
          break;
      }

      toast({ title: 'Sucesso', description: t('messages.deleteSuccess') });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleCreateBudget = async () => {
    if (!id) return;
    try {
      const newOrcamento = await orcamentosApi.create({ obra_id: id });
      setOrcamento(newOrcamento);
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">{t('common.noData')}</p>
      </div>
    );
  }

  const availableFuncionarios = funcionarios.filter(
    f => !equipe.some(e => e.funcionario_id === f.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold xl:text-3xl">{obra.nome}</h1>
            {getStatusBadge(obra.status)}
          </div>
          <p className="text-sm text-muted-foreground">{obra.clientes?.nome}</p>
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link to={`/obras/${id}/editar`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumo">{t('projects.summary')}</TabsTrigger>
          <TabsTrigger value="financeiro">{t('projects.financial')}</TabsTrigger>
          <TabsTrigger value="equipe">{t('projects.team')}</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="resumo" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('projects.budgetTotal')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${orcamentoTotal.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('projects.budgetBalance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${saldoOrcamento >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  ${saldoOrcamento.toFixed(2)}
                </p>
                {saldoOrcamento < 0 && (
                  <p className="text-sm text-destructive">{t('projects.loss')}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('projects.receivedTotal')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${totalRecebido.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('projects.costsTotal')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">${totalCustosMateriais.toFixed(2)}</p>
              </CardContent>
            </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('projects.laborTotal')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">${totalMaoObra.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
          <Card>
            <CardHeader>
              <CardTitle>{t('projects.estimatedResult')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${resultado >= 0 ? 'text-primary' : 'text-destructive'}`}>
                ${resultado.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {resultado >= 0 ? t('projects.profit') : t('projects.loss')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="orcamento" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('budget.items')}</CardTitle>
                <Button onClick={() => orcamento ? openItemDialog() : handleCreateBudget()}>
                  <Plus className="mr-2 h-4 w-4" />
                  {orcamento ? t('budget.newItem') : t('budget.new')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orcamentoItens.length === 0 ? (
                <p className="text-center text-muted-foreground">{t('common.noData')}</p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.description')}</TableHead>
                        <TableHead className="text-right">{t('budget.quantity')}</TableHead>
                        <TableHead className="text-right">{t('budget.unitPrice')}</TableHead>
                        <TableHead className="text-right">{t('budget.subtotal')}</TableHead>
                        <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orcamentoItens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-right">${item.valor_unitario.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            ${(Number(item.quantidade) * Number(item.valor_unitario)).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openItemDialog(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteDialog({ type: 'item', id: item.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end border-t border-border pt-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t('budget.total')}</p>
                      <p className="text-2xl font-bold">${totalOrcado.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('financial.revenues')}</CardTitle>
                <Button onClick={() => openReceitaDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('financial.newRevenue')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {receitas.length === 0 ? (
                <p className="text-center text-muted-foreground">{t('common.noData')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead className="text-right">{t('common.value')}</TableHead>
                      <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitas.map((receita) => (
                      <TableRow key={receita.id}>
                        <TableCell>{new Date(receita.data).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          ${receita.valor.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openReceitaDialog(receita)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDialog({ type: 'receita', id: receita.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('financial.materialsUsage')}</CardTitle>
                <Button onClick={openMaterialDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('financial.newCost')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{t('financial.materialsHint')}</p>
            </CardHeader>
            <CardContent>
              {movimentos.filter((mov) => mov.tipo === 'uso').length === 0 && materialCustos.length === 0 ? (
                <p className="text-center text-muted-foreground">{t('common.noData')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.date')}</TableHead>
                      <TableHead>{t('common.description')}</TableHead>
                      <TableHead className="text-right">{t('leftovers.quantity')}</TableHead>
                      <TableHead className="text-right">{t('common.value')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentos
                      .filter((mov) => mov.tipo === 'uso')
                      .map((mov) => {
                        const material = materiais.find((item) => item.id === mov.material_id);
                        return (
                          <TableRow key={mov.id}>
                            <TableCell>{new Date(mov.data).toLocaleDateString()}</TableCell>
                            <TableCell>{material?.nome || t('materials.title')}</TableCell>
                            <TableCell className="text-right">{Number(mov.quantidade).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold text-rose-600 dark:text-rose-400">
                              ${Number(mov.valor_total).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {materialCustos.map((custo) => (
                      <TableRow key={custo.id}>
                        <TableCell>{new Date(custo.data).toLocaleDateString()}</TableCell>
                        <TableCell>{custo.descricao || t('materials.title')}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right font-semibold text-rose-600 dark:text-rose-400">
                          ${Number(custo.valor).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('financial.laborAllocations')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAlocacaoSubmit} className="grid gap-4 xl:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="alocacao_funcionario">{t('team.employee')} *</Label>
                  <select
                    id="alocacao_funcionario"
                    value={alocacaoForm.funcionario_id}
                    onChange={(e) => setAlocacaoForm({ ...alocacaoForm, funcionario_id: e.target.value })}
                    className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
                    disabled={!!editingAlocacaoId}
                    required
                  >
                    <option value="">{t('team.employee')}</option>
                    {funcionarios.map((func) => (
                      <option key={func.id} value={func.id}>
                        {func.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alocacao_data">{t('common.date')} *</Label>
                  <Input
                    id="alocacao_data"
                    type="date"
                    value={alocacaoForm.data}
                    onChange={(e) => setAlocacaoForm({ ...alocacaoForm, data: e.target.value })}
                    required
                    className="h-12"
                    disabled={!!editingAlocacaoId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alocacao_horas">{t('allocations.hours')} *</Label>
                  <Input
                    id="alocacao_horas"
                    type="number"
                    step="0.5"
                    value={alocacaoForm.horas}
                    onChange={(e) => setAlocacaoForm({ ...alocacaoForm, horas: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="alocacao_obs">{t('allocations.note')}</Label>
                  <Input
                    id="alocacao_obs"
                    value={alocacaoForm.observacao}
                    onChange={(e) => setAlocacaoForm({ ...alocacaoForm, observacao: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="flex items-end gap-2 xl:col-span-5">
                  <Button type="submit" size="lg">
                    {t('common.save')}
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={resetAlocacaoForm}>
                    {t('common.cancel')}
                  </Button>
                  {editingAlocacaoId && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="lg"
                      onClick={() => handleAlocacaoDelete(editingAlocacaoId)}
                    >
                      {t('common.delete')}
                    </Button>
                  )}
                </div>
              </form>

              {alocacoes.length === 0 ? (
                <p className="text-center text-muted-foreground">{t('common.noData')}</p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('team.employee')}</TableHead>
                        <TableHead className="text-right">{t('allocations.hours')}</TableHead>
                        <TableHead className="text-right">{t('common.value')}</TableHead>
                        <TableHead>{t('common.observations')}</TableHead>
                        <TableHead className="w-[120px]">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alocacoes.map((alocacao) => {
                        const func = funcionarios.find((f) => f.id === alocacao.funcionario_id);
                        const valor = Number(alocacao.horas) * Number(alocacao.valor_hora);
                        return (
                          <TableRow key={alocacao.id}>
                            <TableCell>{new Date(alocacao.data).toLocaleDateString()}</TableCell>
                            <TableCell>{func?.nome || t('team.employee')}</TableCell>
                            <TableCell className="text-right">{Number(alocacao.horas).toFixed(1)}</TableCell>
                            <TableCell className="text-right font-semibold text-rose-600 dark:text-rose-400">${valor.toFixed(2)}</TableCell>
                            <TableCell>{alocacao.observacao || '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => startEditAlocacao(alocacao)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleAlocacaoDelete(alocacao.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end border-t border-border pt-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t('projects.laborTotal')}</p>
                      <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">${totalMaoObraAlocacoes.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Budget Item Dialog */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? t('budget.editItem') : t('budget.newItem')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleItemSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">{t('common.description')} *</Label>
              <Input
                id="descricao"
                value={itemForm.descricao}
                onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantidade">{t('budget.quantity')} *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  value={itemForm.quantidade}
                  onChange={(e) => setItemForm({ ...itemForm, quantidade: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_unitario">{t('budget.unitPrice')} *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  value={itemForm.valor_unitario}
                  onChange={(e) => setItemForm({ ...itemForm, valor_unitario: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">{t('common.save')}</Button>
              <Button type="button" variant="outline" size="lg" onClick={() => setItemDialog(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revenue Dialog */}
      <Dialog open={receitaDialog} onOpenChange={setReceitaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReceita ? t('financial.editRevenue') : t('financial.newRevenue')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReceitaSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor">{t('common.value')} *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={receitaForm.valor}
                onChange={(e) => setReceitaForm({ ...receitaForm, valor: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">{t('common.date')} *</Label>
              <Input
                id="data"
                type="date"
                value={receitaForm.data}
                onChange={(e) => setReceitaForm({ ...receitaForm, data: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">{t('common.observations')}</Label>
              <Textarea
                id="observacoes"
                value={receitaForm.observacoes}
                onChange={(e) => setReceitaForm({ ...receitaForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">{t('common.save')}</Button>
              <Button type="button" variant="outline" size="lg" onClick={() => setReceitaDialog(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cost Dialog */}
      <Dialog open={custoDialog} onOpenChange={setCustoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCusto ? t('financial.editCost') : t('financial.newCost')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCustoSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">{t('financial.costType')} *</Label>
              <select
                id="tipo"
                value={custoForm.tipo}
                onChange={(e) => setCustoForm({ ...custoForm, tipo: e.target.value as TipoCusto })}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {editingCusto?.tipo === 'mao_de_obra' && (
                  <option value="mao_de_obra">{t('financial.labor')}</option>
                )}
                <option value="material_outros">{t('financial.materials')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">{t('common.value')} *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={custoForm.valor}
                onChange={(e) => setCustoForm({ ...custoForm, valor: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">{t('common.date')} *</Label>
              <Input
                id="data"
                type="date"
                value={custoForm.data}
                onChange={(e) => setCustoForm({ ...custoForm, data: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">{t('common.description')}</Label>
              <Textarea
                id="descricao"
                value={custoForm.descricao}
                onChange={(e) => setCustoForm({ ...custoForm, descricao: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">{t('common.save')}</Button>
              <Button type="button" variant="outline" size="lg" onClick={() => setCustoDialog(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Material Usage Dialog */}
      <Dialog open={materialDialog} onOpenChange={setMaterialDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('financial.materialsUsage')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMaterialSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material_id">{t('materials.title')} *</Label>
              <select
                id="material_id"
                value={materialForm.material_id}
                onChange={(e) => setMaterialForm({ ...materialForm, material_id: e.target.value })}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">{t('materials.title')}</option>
                {materiais.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.nome} (disp: {Number(estoquePorMaterial.get(material.id) || 0).toFixed(2)})
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t('materials.stockAvailable')}:{' '}
                  {Number(estoquePorMaterial.get(materialForm.material_id) || 0).toFixed(2)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMaterialCreateOpen(!materialCreateOpen)}
                >
                  {t('materials.createInline')}
                </Button>
              </div>
            </div>
            {materialCreateOpen && (
              <div className="rounded-md border border-border p-3">
                <form onSubmit={handleMaterialCreate} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="novo_material_nome">Nome *</Label>
                    <Input
                      id="novo_material_nome"
                      value={materialCreateForm.nome}
                      onChange={(e) => setMaterialCreateForm({ ...materialCreateForm, nome: e.target.value })}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo_material_preco">{t('materials.referencePrice')}</Label>
                    <Input
                      id="novo_material_preco"
                      type="number"
                      step="0.01"
                      value={materialCreateForm.preco_referencia}
                      onChange={(e) => setMaterialCreateForm({ ...materialCreateForm, preco_referencia: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo_material_qtd">{t('materials.stockQuantity')} *</Label>
                    <Input
                      id="novo_material_qtd"
                      type="number"
                      step="1"
                      min="1"
                      value={materialCreateForm.quantidade_inicial}
                      onChange={(e) => setMaterialCreateForm({ ...materialCreateForm, quantidade_inicial: e.target.value })}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      {t('common.save')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMaterialCreateOpen(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </form>
              </div>
            )}
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="material_quantidade">{t('leftovers.quantity')} *</Label>
                <Input
                  id="material_quantidade"
                  type="number"
                  step="0.01"
                  value={materialForm.quantidade}
                  onChange={(e) => setMaterialForm({ ...materialForm, quantidade: e.target.value })}
                  required
                  className="h-12"
                  max={estoquePorMaterial.get(materialForm.material_id) || undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material_unitario">{t('materials.referencePrice')}</Label>
                <Input id="material_unitario" value={valorUnitarioMaterial ? valorUnitarioMaterial.toFixed(2) : ''} readOnly className="h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="material_total">{t('common.total')}</Label>
              <Input id="material_total" value={totalUsoMaterial ? totalUsoMaterial.toFixed(2) : ''} readOnly className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material_data">{t('common.date')}</Label>
              <Input
                id="material_data"
                type="date"
                value={materialForm.data}
                onChange={(e) => setMaterialForm({ ...materialForm, data: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material_observacao">{t('common.observations')}</Label>
              <Textarea
                id="material_observacao"
                value={materialForm.observacao}
                onChange={(e) => setMaterialForm({ ...materialForm, observacao: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">
                {t('common.save')}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => setMaterialDialog(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Labor Entry Dialog */}
      <Dialog open={lancamentoDialog} onOpenChange={setLancamentoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLancamento ? t('team.editEntry') : t('team.newEntry')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLancamentoSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="funcionario_id">{t('team.employee')} *</Label>
              <select
                id="funcionario_id"
                value={lancamentoForm.funcionario_id}
                onChange={(e) => setLancamentoForm({ ...lancamentoForm, funcionario_id: e.target.value })}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">{t('team.employee')}</option>
                {equipe.map((membro) => (
                  <option key={membro.funcionario_id} value={membro.funcionario_id}>
                    {membro.funcionarios.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">{t('common.date')} *</Label>
              <Input
                id="data"
                type="date"
                value={lancamentoForm.data}
                onChange={(e) => setLancamentoForm({ ...lancamentoForm, data: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">{t('team.quantity')} *</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.01"
                value={lancamentoForm.quantidade}
                onChange={(e) => setLancamentoForm({ ...lancamentoForm, quantidade: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">{t('common.observations')}</Label>
              <Textarea
                id="observacoes"
                value={lancamentoForm.observacoes}
                onChange={(e) => setLancamentoForm({ ...lancamentoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">{t('common.save')}</Button>
              <Button type="button" variant="outline" size="lg" onClick={() => setLancamentoDialog(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Employee to Team Dialog */}
      <Dialog open={addFuncionarioDialog} onOpenChange={setAddFuncionarioDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('team.addEmployee')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="funcionario">{t('team.employee')} *</Label>
              <select
                id="selected_funcionario_id"
                value={selectedFuncionarioId}
                onChange={(e) => setSelectedFuncionarioId(e.target.value)}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('team.employee')}</option>
                {availableFuncionarios.map((func) => (
                  <option key={func.id} value={func.id}>
                    {func.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <Button onClick={handleAddFuncionario} size="lg" className="flex-1" disabled={!selectedFuncionarioId}>
                {t('common.add')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setAddFuncionarioDialog(false);
                  setSelectedFuncionarioId('');
                }}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === 'item' && t('budget.deleteItemConfirm')}
              {deleteDialog?.type === 'receita' && t('financial.deleteRevenueConfirm')}
              {deleteDialog?.type === 'custo' && t('financial.deleteCostConfirm')}
              {deleteDialog?.type === 'lancamento' && t('team.deleteEntryConfirm')}
              {deleteDialog?.type === 'equipe' && t('team.removeConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
