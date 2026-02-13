import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CheckCircle2, LayoutGrid, BarChart3, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { formatDateDisplay, toLocalDateInput } from '@/lib/date';
import {
  obrasApi,
  receitasApi,
  custosApi,
  lancamentosMaoObraApi,
  funcionariosApi,
  materiaisMovimentosApi,
  alocacoesDiariasApi,
  caixaEmpresaApi,
} from '@/db/api';
import type {
  Receita,
  Custo,
  LancamentoMaoObra,
  Funcionario,
  MaterialMovimento,
  AlocacaoDiaria,
  CaixaEmpresaMovimento,
  TipoMovimentoCaixaEmpresa,
  CategoriaMovimentoCaixaEmpresa,
} from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  Cell,
} from 'recharts';

export default function FinancialDashboardPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [custos, setCustos] = useState<Custo[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoMaoObra[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoDiaria[]>([]);
  const [movimentos, setMovimentos] = useState<MaterialMovimento[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obrasFinalizadas, setObrasFinalizadas] = useState(0);
  const [obras, setObras] = useState<{ id: string; nome: string }[]>([]);
  const [obraSelecionada, setObraSelecionada] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('cards');
  const [receitasDialogOpen, setReceitasDialogOpen] = useState(false);
  const [custosDialogOpen, setCustosDialogOpen] = useState(false);
  const [caixaDialogOpen, setCaixaDialogOpen] = useState(false);
  const [receitasObraFiltro, setReceitasObraFiltro] = useState('');
  const [custosObraFiltro, setCustosObraFiltro] = useState('');
  const [custosTipoFiltro, setCustosTipoFiltro] = useState<'todos' | 'materiais' | 'mao'>('todos');
  const [caixaCategoriaFiltro, setCaixaCategoriaFiltro] = useState<
    'todos' | CategoriaMovimentoCaixaEmpresa
  >('todos');
  const [caixaPage, setCaixaPage] = useState(1);
  const [editingCaixaId, setEditingCaixaId] = useState<string | null>(null);
  const [deleteCaixaId, setDeleteCaixaId] = useState<string | null>(null);
  const [caixaEmpresaMovimentos, setCaixaEmpresaMovimentos] = useState<CaixaEmpresaMovimento[]>([]);
  const [receitasHistorico, setReceitasHistorico] = useState<Receita[]>([]);
  const [custosHistorico, setCustosHistorico] = useState<Custo[]>([]);
  const [lancamentosHistorico, setLancamentosHistorico] = useState<LancamentoMaoObra[]>([]);
  const [alocacoesHistorico, setAlocacoesHistorico] = useState<AlocacaoDiaria[]>([]);
  const [movimentosHistorico, setMovimentosHistorico] = useState<MaterialMovimento[]>([]);
  const [caixaEmpresaHistorico, setCaixaEmpresaHistorico] = useState<CaixaEmpresaMovimento[]>([]);
  const [caixaForm, setCaixaForm] = useState({
    tipo: 'saida' as TipoMovimentoCaixaEmpresa,
    categoria: 'retirada_dono' as CategoriaMovimentoCaixaEmpresa,
    descricao: '',
    valor: '',
    data: toLocalDateInput(new Date()),
  });

  useEffect(() => {
    // Set default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(toLocalDateInput(firstDay));
    setEndDate(toLocalDateInput(lastDay));
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadData();
    }
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data
      const [finalizadas, funcionariosData, obrasData] = await Promise.all([
        obrasApi.getCompletedByDateRange(startDate, endDate),
        funcionariosApi.getAll(),
        obrasApi.getAll(),
      ]);

      setFuncionarios(funcionariosData);
      setObrasFinalizadas(finalizadas.length);
      setObras(obrasData.map((obra) => ({ id: obra.id, nome: obra.nome })));

      // Load financial data by date range to avoid per-project queries
      const [receitasData, custosData, lancamentosData, movimentosData, alocacoesData, caixaEmpresaData] = await Promise.all([
        receitasApi.getAllByDateRange(startDate, endDate),
        custosApi.getAllByDateRange(startDate, endDate),
        lancamentosMaoObraApi.getAllByDateRange(startDate, endDate),
        materiaisMovimentosApi.getAllByDateRange(startDate, endDate),
        alocacoesDiariasApi.getByDateRange(startDate, endDate),
        caixaEmpresaApi.getAllByDateRange(startDate, endDate),
      ]);

      const [receitasAllData, custosAllData, lancamentosAllData, movimentosAllData, alocacoesAllData, caixaEmpresaAllData] = await Promise.all([
        receitasApi.getAll(),
        custosApi.getAll(),
        lancamentosMaoObraApi.getAll(),
        materiaisMovimentosApi.getAll(),
        alocacoesDiariasApi.getAll(),
        caixaEmpresaApi.getAll(),
      ]);

      setReceitas(receitasData);
      setCustos(custosData);
      setLancamentos(lancamentosData);
      setMovimentos(movimentosData);
      setAlocacoes(alocacoesData);
      setCaixaEmpresaMovimentos(caixaEmpresaData);
      setReceitasHistorico(receitasAllData);
      setCustosHistorico(custosAllData);
      setLancamentosHistorico(lancamentosAllData);
      setMovimentosHistorico(movimentosAllData);
      setAlocacoesHistorico(alocacoesAllData);
      setCaixaEmpresaHistorico(caixaEmpresaAllData);
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

  // Calculations
  const receitasFiltradas = obraSelecionada
    ? receitas.filter((r) => r.obra_id === obraSelecionada)
    : receitas;
  const custosFiltrados = obraSelecionada
    ? custos.filter((c) => c.obra_id === obraSelecionada)
    : custos;
  const lancamentosFiltrados = obraSelecionada
    ? lancamentos.filter((l) => l.obra_id === obraSelecionada)
    : lancamentos;
  const alocacoesFiltradas = obraSelecionada
    ? alocacoes.filter((a) => a.obra_id === obraSelecionada)
    : alocacoes;
  const movimentosFiltrados = obraSelecionada
    ? movimentos.filter((mov) => mov.obra_id === obraSelecionada)
    : movimentos;
  const movimentosCustos = movimentosFiltrados.filter(
    (mov) => !!mov.obra_id && (mov.tipo === 'uso' || mov.tipo === 'sobra')
  );

  const totalReceitas = receitasFiltradas.reduce((sum, r) => sum + Number(r.valor), 0);
  const totalCustosMateriaisLegado = custosFiltrados
    .filter((c) => c.tipo === 'material_outros')
    .reduce((sum, c) => sum + Number(c.valor), 0);
  const totalMateriaisMovimentos = movimentosCustos.reduce((sum, mov) => {
    const sinal = mov.tipo === 'sobra' ? -1 : 1;
    return sum + sinal * Number(mov.valor_total);
  }, 0);
  const totalCustosMateriais = totalCustosMateriaisLegado + totalMateriaisMovimentos;
  const totalCustosMaoObra = custosFiltrados
    .filter((c) => c.tipo === 'mao_de_obra')
    .reduce((sum, c) => sum + Number(c.valor), 0);
  const totalMaoObraLancamentos = alocacoesFiltradas.length > 0
    ? 0
    : lancamentosFiltrados.reduce((sum, l) => {
        const func = funcionarios.find(f => f.id === l.funcionario_id);
        return sum + (func ? Number(l.quantidade) * Number(func.valor) : 0);
      }, 0);
  const totalMaoObraAlocacoes = alocacoesFiltradas.reduce(
    (sum, a) => sum + Number(a.horas) * Number(a.valor_hora),
    0
  );
  const totalMaoObra = totalMaoObraLancamentos + totalMaoObraAlocacoes + totalCustosMaoObra;
  const resultado = totalReceitas - totalCustosMateriais - totalMaoObra;
  const totalCustos = totalCustosMateriais + totalMaoObra;
  const totalEntradasEmpresa = caixaEmpresaMovimentos
    .filter((mov) => mov.tipo === 'entrada')
    .reduce((sum, mov) => sum + Number(mov.valor), 0);
  const totalSaidasEmpresa = caixaEmpresaMovimentos
    .filter((mov) => mov.tipo === 'saida')
    .reduce((sum, mov) => sum + Number(mov.valor), 0);
  const totalEntradasEmpresaHistorico = caixaEmpresaHistorico
    .filter((mov) => mov.tipo === 'entrada')
    .reduce((sum, mov) => sum + Number(mov.valor), 0);
  const totalSaidasEmpresaHistorico = caixaEmpresaHistorico
    .filter((mov) => mov.tipo === 'saida')
    .reduce((sum, mov) => sum + Number(mov.valor), 0);
  const totalReceitasEmpresaBase = receitasHistorico.reduce((sum, r) => sum + Number(r.valor), 0);
  const totalCustosMateriaisLegadoEmpresaBase = custosHistorico
    .filter((c) => c.tipo === 'material_outros')
    .reduce((sum, c) => sum + Number(c.valor), 0);
  const totalMateriaisMovimentosEmpresaBase = movimentosHistorico
    .filter((mov) => !!mov.obra_id && (mov.tipo === 'uso' || mov.tipo === 'sobra'))
    .reduce((sum, mov) => {
      const sinal = mov.tipo === 'sobra' ? -1 : 1;
      return sum + sinal * Number(mov.valor_total);
    }, 0);
  const totalCustosMateriaisEmpresaBase = totalCustosMateriaisLegadoEmpresaBase + totalMateriaisMovimentosEmpresaBase;
  const totalCustosMaoObraEmpresaBase = custosHistorico
    .filter((c) => c.tipo === 'mao_de_obra')
    .reduce((sum, c) => sum + Number(c.valor), 0);
  const totalMaoObraLancamentosEmpresaBase = alocacoesHistorico.length > 0
    ? 0
    : lancamentosHistorico.reduce((sum, l) => {
        const func = funcionarios.find(f => f.id === l.funcionario_id);
        return sum + (func ? Number(l.quantidade) * Number(func.valor) : 0);
      }, 0);
  const totalMaoObraAlocacoesEmpresaBase = alocacoesHistorico.reduce(
    (sum, a) => sum + Number(a.horas) * Number(a.valor_hora),
    0
  );
  const totalMaoObraEmpresaBase = totalMaoObraLancamentosEmpresaBase + totalMaoObraAlocacoesEmpresaBase + totalCustosMaoObraEmpresaBase;
  const totalCustosEmpresaBase = totalCustosMateriaisEmpresaBase + totalMaoObraEmpresaBase;
  const saldoEmpresa = totalReceitasEmpresaBase + totalEntradasEmpresaHistorico - totalCustosEmpresaBase - totalSaidasEmpresaHistorico;
  const breakdownCount = custosFiltrados.length + lancamentosFiltrados.length + movimentosCustos.length + alocacoesFiltradas.length;
  const selectedObraLabel = obraSelecionada
    ? obras.find((obra) => obra.id === obraSelecionada)?.nome || t('projects.title')
    : t('projects.title');
  const chartData = [
    { name: t('financial.totalRevenue'), valor: totalReceitas, color: '#16a34a' },
    { name: t('financial.materialCosts'), valor: totalCustosMateriais, color: '#f97316' },
    { name: t('financial.laborCosts'), valor: totalMaoObra, color: '#e11d48' },
    { name: t('financial.companyExpenses'), valor: totalSaidasEmpresa, color: '#b91c1c' },
    { name: t('financial.result'), valor: resultado, color: resultado >= 0 ? '#2563eb' : '#dc2626' },
  ];
  const obrasMap = new Map(obras.map((obra) => [obra.id, obra.nome]));
  const receitasDialogItems = receitasFiltradas
    .filter((receita) => !receitasObraFiltro || receita.obra_id === receitasObraFiltro);
  const custosDialogItems = [
    ...movimentosCustos.map((mov) => ({
      id: mov.id,
      data: mov.data,
      valor: (mov.tipo === 'sobra' ? -1 : 1) * Number(mov.valor_total),
      obra_id: mov.obra_id || '',
      tipo: 'materiais' as const,
      descricao: mov.tipo === 'sobra' ? t('leftovers.title') : t('financial.materialsUsage'),
    })),
    ...custosFiltrados.map((custo) => ({
      id: custo.id,
      data: custo.data,
      valor: Number(custo.valor),
      obra_id: custo.obra_id,
      tipo: custo.tipo === 'mao_de_obra' ? 'mao' as const : 'materiais' as const,
      descricao: custo.descricao || (custo.tipo === 'mao_de_obra' ? t('financial.labor') : t('financial.materials')),
    })),
    ...lancamentosFiltrados.map((lanc) => {
      const func = funcionarios.find(f => f.id === lanc.funcionario_id);
      return {
        id: lanc.id,
        data: lanc.data,
        valor: func ? Number(lanc.quantidade) * Number(func.valor) : 0,
        obra_id: lanc.obra_id,
        tipo: 'mao' as const,
        descricao: t('financial.labor'),
      };
    }),
    ...alocacoesFiltradas.map((alocacao) => ({
      id: alocacao.id,
      data: alocacao.data,
      valor: Number(alocacao.horas) * Number(alocacao.valor_hora),
      obra_id: alocacao.obra_id,
      tipo: 'mao' as const,
      descricao: t('financial.laborAllocations'),
    })),
  ];
  const custosDialogFiltered = custosDialogItems
    .filter((item) => !custosObraFiltro || item.obra_id === custosObraFiltro)
    .filter((item) => custosTipoFiltro === 'todos' || item.tipo === custosTipoFiltro);
  const totalReceitasDialog = receitasDialogItems.reduce((sum, item) => sum + item.valor, 0);
  const totalCustosDialog = custosDialogFiltered.reduce((sum, item) => sum + item.valor, 0);
  const caixaEmpresaFiltrado = caixaEmpresaMovimentos
    .filter((mov) => caixaCategoriaFiltro === 'todos' || mov.categoria === caixaCategoriaFiltro);
  const caixaPageSize = 20;
  const caixaTotalPages = Math.max(1, Math.ceil(caixaEmpresaFiltrado.length / caixaPageSize));
  const caixaPageSafe = Math.min(caixaPage, caixaTotalPages);
  const caixaEmpresaPagina = caixaEmpresaFiltrado.slice(
    (caixaPageSafe - 1) * caixaPageSize,
    caixaPageSafe * caixaPageSize
  );

  const getCategoriaLabel = (categoria: CategoriaMovimentoCaixaEmpresa) => {
    switch (categoria) {
      case 'aporte':
        return t('financial.companyCategoryAporte');
      case 'despesa_empresa':
        return t('financial.companyCategoryExpense');
      case 'prolabore':
        return t('financial.companyCategoryProlabore');
      case 'retirada_dono':
        return t('financial.companyCategoryOwnerWithdrawal');
      default:
        return t('financial.companyCategoryOther');
    }
  };

  const handleCaixaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaForm.valor || Number(caixaForm.valor) <= 0) {
      toast({ title: 'Erro', description: t('messages.required'), variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        tipo: caixaForm.tipo,
        categoria: caixaForm.categoria,
        descricao: caixaForm.descricao || undefined,
        valor: Number(caixaForm.valor),
        data: caixaForm.data,
      };
      if (editingCaixaId) {
        await caixaEmpresaApi.update(editingCaixaId, payload);
      } else {
        await caixaEmpresaApi.create(payload);
      }
      setCaixaForm({
        tipo: 'saida',
        categoria: 'retirada_dono',
        descricao: '',
        valor: '',
        data: toLocalDateInput(new Date()),
      });
      setEditingCaixaId(null);
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      loadData();
    } catch (error) {
      console.error('Erro ao salvar movimento de caixa da empresa:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  const startEditCaixa = (mov: CaixaEmpresaMovimento) => {
    setEditingCaixaId(mov.id);
    setCaixaForm({
      tipo: mov.tipo,
      categoria: mov.categoria,
      descricao: mov.descricao,
      valor: Number(mov.valor).toString(),
      data: mov.data,
    });
  };

  const cancelEditCaixa = () => {
    setEditingCaixaId(null);
    setCaixaForm({
      tipo: 'saida',
      categoria: 'retirada_dono',
      descricao: '',
      valor: '',
      data: toLocalDateInput(new Date()),
    });
  };

  const handleDeleteCaixa = async (id: string) => {
    try {
      await caixaEmpresaApi.delete(id);
      if (editingCaixaId === id) {
        cancelEditCaixa();
      }
      toast({ title: 'Sucesso', description: t('messages.deleteSuccess') });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir movimento de caixa da empresa:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold xl:text-3xl">{t('financial.dashboard')}</h1>

      {/* Date Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('financial.period')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('projects.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('projects.endDate')}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obraFiltro">{t('financial.filterByProject')}</Label>
              <select
                id="obraFiltro"
                value={obraSelecionada}
                onChange={(e) => setObraSelecionada(e.target.value)}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('financial.allProjects')}</option>
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {t('financial.totalCosts')} ({selectedObraLabel})
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              ${totalCustos.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{t('financial.companyCash')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 xl:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('financial.companyCash')}</p>
              <p className={`text-2xl font-bold ${saldoEmpresa >= 0 ? 'text-primary' : 'text-destructive'}`}>
                ${saldoEmpresa.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('financial.companyEntries')}</p>
              <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                ${totalEntradasEmpresaHistorico.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('financial.companyExpenses')}</p>
              <p className="text-xl font-semibold text-rose-600 dark:text-rose-400">
                ${totalSaidasEmpresaHistorico.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 rounded-md border border-border p-1">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            onClick={() => setViewMode('cards')}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            {t('financial.viewCards')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'chart' ? 'default' : 'ghost'}
            onClick={() => setViewMode('chart')}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {t('financial.viewChart')}
          </Button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('financial.totalRevenue')}</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">${totalReceitas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {receitasFiltradas.length} {receitasFiltradas.length === 1 ? 'entrada' : 'entradas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('financial.materialCosts')}</CardTitle>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              ${totalCustosMateriais.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('financial.materialsUsage')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('financial.laborCosts')}</CardTitle>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              ${totalMaoObra.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('financial.labor')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('financial.result')}</CardTitle>
            {resultado >= 0 ? (
              <TrendingUp className="h-5 w-5 text-primary" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${resultado >= 0 ? 'text-primary' : 'text-destructive'}`}>
              ${resultado.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resultado >= 0 ? t('projects.profit') : t('projects.loss')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('financial.companyExpenses')}</CardTitle>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              ${totalSaidasEmpresa.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('financial.companyMovements')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('financial.completedProjects')}</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{obrasFinalizadas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('financial.completedProjects')}
            </p>
          </CardContent>
        </Card>
      </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('financial.viewChart')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                valor: { label: t('common.value') },
              }}
              className="h-[280px]"
            >
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="valor" radius={6}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('financial.companyMovements')}</CardTitle>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setCaixaCategoriaFiltro('todos');
                setCaixaPage(1);
                setCaixaDialogOpen(true);
              }}
            >
              {t('financial.viewAll')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCaixaSubmit} className="grid gap-4 xl:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="caixa_tipo">{t('financial.companyType')}</Label>
              <select
                id="caixa_tipo"
                value={caixaForm.tipo}
                onChange={(e) => setCaixaForm((prev) => ({ ...prev, tipo: e.target.value as TipoMovimentoCaixaEmpresa }))}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="entrada">{t('financial.companyEntry')}</option>
                <option value="saida">{t('financial.companyExit')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="caixa_categoria">{t('financial.companyCategory')}</Label>
              <select
                id="caixa_categoria"
                value={caixaForm.categoria}
                onChange={(e) => setCaixaForm((prev) => ({ ...prev, categoria: e.target.value as CategoriaMovimentoCaixaEmpresa }))}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="aporte">{t('financial.companyCategoryAporte')}</option>
                <option value="despesa_empresa">{t('financial.companyCategoryExpense')}</option>
                <option value="prolabore">{t('financial.companyCategoryProlabore')}</option>
                <option value="retirada_dono">{t('financial.companyCategoryOwnerWithdrawal')}</option>
                <option value="outros">{t('financial.companyCategoryOther')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="caixa_data">{t('common.date')}</Label>
              <Input
                id="caixa_data"
                type="date"
                value={caixaForm.data}
                onChange={(e) => setCaixaForm((prev) => ({ ...prev, data: e.target.value }))}
                className="h-12"
                required
              />
            </div>
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="caixa_descricao">{t('common.description')}</Label>
              <Input
                id="caixa_descricao"
                value={caixaForm.descricao}
                onChange={(e) => setCaixaForm((prev) => ({ ...prev, descricao: e.target.value }))}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caixa_valor">{t('common.value')}</Label>
              <Input
                id="caixa_valor"
                type="number"
                step="0.01"
                min="0.01"
                value={caixaForm.valor}
                onChange={(e) => setCaixaForm((prev) => ({ ...prev, valor: e.target.value }))}
                className="h-12"
                required
              />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="caixa_categoria_filtro">{t('common.filter')}</Label>
              <select
                id="caixa_categoria_filtro"
                value={caixaCategoriaFiltro}
                onChange={(e) => setCaixaCategoriaFiltro(e.target.value as 'todos' | CategoriaMovimentoCaixaEmpresa)}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="todos">{t('financial.filterTypeAll')}</option>
                <option value="aporte">{t('financial.companyCategoryAporte')}</option>
                <option value="despesa_empresa">{t('financial.companyCategoryExpense')}</option>
                <option value="prolabore">{t('financial.companyCategoryProlabore')}</option>
                <option value="retirada_dono">{t('financial.companyCategoryOwnerWithdrawal')}</option>
                <option value="outros">{t('financial.companyCategoryOther')}</option>
              </select>
            </div>
            <div className="xl:col-span-3 flex gap-2 justify-end">
              {editingCaixaId && (
                <Button type="button" variant="outline" className="h-12" onClick={cancelEditCaixa}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button type="submit" className="h-12 min-w-32">
                {editingCaixaId ? t('common.edit') : t('common.save')}
              </Button>
            </div>
          </form>

          {caixaEmpresaFiltrado.length === 0 ? (
            <p className="text-center text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <div className="space-y-2">
              {caixaEmpresaFiltrado.slice(0, 8).map((mov) => {
                const valor = Number(mov.valor);
                const negativo = mov.tipo === 'saida';
                return (
                  <div key={mov.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">
                          {mov.descricao || getCategoriaLabel(mov.categoria)}
                        </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateDisplay(mov.data)} - {getCategoriaLabel(mov.categoria)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${negativo ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {negativo ? '-' : '+'}${valor.toFixed(2)}
                      </span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => startEditCaixa(mov)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteCaixaId(mov.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={caixaDialogOpen} onOpenChange={setCaixaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('financial.companyMovements')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="caixa_dialog_categoria">{t('financial.companyCategory')}</Label>
                <select
                  id="caixa_dialog_categoria"
                  value={caixaCategoriaFiltro}
                  onChange={(e) => {
                    setCaixaCategoriaFiltro(e.target.value as 'todos' | CategoriaMovimentoCaixaEmpresa);
                    setCaixaPage(1);
                  }}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="todos">{t('financial.filterTypeAll')}</option>
                  <option value="aporte">{t('financial.companyCategoryAporte')}</option>
                  <option value="despesa_empresa">{t('financial.companyCategoryExpense')}</option>
                  <option value="prolabore">{t('financial.companyCategoryProlabore')}</option>
                  <option value="retirada_dono">{t('financial.companyCategoryOwnerWithdrawal')}</option>
                  <option value="outros">{t('financial.companyCategoryOther')}</option>
                </select>
              </div>
              <div className="flex items-end justify-end">
                <div className="rounded-md border border-border bg-muted/40 px-4 py-2 text-sm">
                  <span className="text-muted-foreground">{t('common.total')}:</span>{' '}
                  <span className="font-semibold">
                    {caixaEmpresaFiltrado.length}
                  </span>
                </div>
              </div>
            </div>
            {caixaEmpresaPagina.length === 0 ? (
              <p className="text-center text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-2">
                {caixaEmpresaPagina.map((mov) => {
                  const valor = Number(mov.valor);
                  const negativo = mov.tipo === 'saida';
                  return (
                    <div key={mov.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{mov.descricao || getCategoriaLabel(mov.categoria)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateDisplay(mov.data)} - {getCategoriaLabel(mov.categoria)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${negativo ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {negativo ? '-' : '+'}${valor.toFixed(2)}
                        </span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => {
                          startEditCaixa(mov);
                          setCaixaDialogOpen(false);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteCaixaId(mov.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={caixaPageSafe <= 1}
                onClick={() => setCaixaPage((prev) => Math.max(1, prev - 1))}
              >
                {'<'}
              </Button>
              <p className="text-xs text-muted-foreground">
                {caixaPageSafe}/{caixaTotalPages}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={caixaPageSafe >= caixaTotalPages}
                onClick={() => setCaixaPage((prev) => Math.min(caixaTotalPages, prev + 1))}
              >
                {'>'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCaixaId} onOpenChange={() => setDeleteCaixaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('financial.deleteCompanyMovementConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCaixaId) {
                  handleDeleteCaixa(deleteCaixaId);
                }
                setDeleteCaixaId(null);
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Breakdown */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="cursor-pointer" onClick={() => {
          setReceitasObraFiltro(obraSelecionada);
          setReceitasDialogOpen(true);
        }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('financial.revenues')}</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  setReceitasObraFiltro(obraSelecionada);
                  setReceitasDialogOpen(true);
                }}
              >
                {t('financial.viewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {receitasFiltradas.length === 0 ? (
              <p className="text-center text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="space-y-2">
                {receitasFiltradas.slice(0, 5).map((receita) => (
                  <div key={receita.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatDateDisplay(receita.data)}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">${receita.valor.toFixed(2)}</span>
                  </div>
                ))}
                {receitasFiltradas.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{receitasFiltradas.length - 5} mais
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => {
          setCustosObraFiltro(obraSelecionada);
          setCustosTipoFiltro('todos');
          setCustosDialogOpen(true);
        }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('financial.costs')}</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  setCustosObraFiltro(obraSelecionada);
                  setCustosTipoFiltro('todos');
                  setCustosDialogOpen(true);
                }}
              >
                {t('financial.viewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {custosFiltrados.length === 0 && lancamentosFiltrados.length === 0 && movimentosCustos.length === 0 && alocacoesFiltradas.length === 0 ? (
              <p className="text-center text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="space-y-2">
                {movimentosCustos.slice(0, 2).map((mov) => {
                  const valor = (mov.tipo === 'sobra' ? -1 : 1) * Number(mov.valor_total);
                  return (
                    <div key={mov.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatDateDisplay(mov.data)} - {mov.tipo === 'sobra' ? t('leftovers.title') : t('financial.materialsUsage')}
                      </span>
                      <span className={`font-semibold ${valor < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        ${valor.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                {custosFiltrados.slice(0, 3).map((custo) => (
                  <div key={custo.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatDateDisplay(custo.data)} - {custo.descricao || (custo.tipo === 'mao_de_obra' ? t('financial.labor') : t('financial.materials'))}
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">${custo.valor.toFixed(2)}</span>
                  </div>
                ))}
                {lancamentosFiltrados.slice(0, 2).map((lanc) => {
                  const func = funcionarios.find(f => f.id === lanc.funcionario_id);
                  const valor = func ? Number(lanc.quantidade) * Number(func.valor) : 0;
                  return (
                    <div key={lanc.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatDateDisplay(lanc.data)} - {t('financial.labor')}
                      </span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">${valor.toFixed(2)}</span>
                    </div>
                  );
                })}
                {alocacoesFiltradas.slice(0, 2).map((alocacao) => (
                  <div key={alocacao.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatDateDisplay(alocacao.data)} - {t('financial.laborAllocations')}
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      ${(Number(alocacao.horas) * Number(alocacao.valor_hora)).toFixed(2)}
                    </span>
                  </div>
                ))}
                {breakdownCount > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{breakdownCount - 5} mais
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={receitasDialogOpen} onOpenChange={setReceitasDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('financial.revenues')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="receitas_obra_filtro">{t('financial.filterByProject')}</Label>
                <select
                  id="receitas_obra_filtro"
                  value={receitasObraFiltro}
                  onChange={(e) => setReceitasObraFiltro(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t('financial.allProjects')}</option>
                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end justify-end">
                <div className="rounded-md border border-border bg-muted/40 px-4 py-2 text-sm">
                  <span className="text-muted-foreground">{t('common.total')}:</span>{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ${totalReceitasDialog.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            {receitasDialogItems.length === 0 ? (
              <p className="text-center text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-2">
                {receitasDialogItems.map((receita) => (
                  <div key={receita.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">{formatDateDisplay(receita.data)}</p>
                      <p className="text-xs text-muted-foreground">
                        {obrasMap.get(receita.obra_id) || t('projects.title')}
                      </p>
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ${receita.valor.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={custosDialogOpen} onOpenChange={setCustosDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('financial.costs')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="custos_obra_filtro">{t('financial.filterByProject')}</Label>
                <select
                  id="custos_obra_filtro"
                  value={custosObraFiltro}
                  onChange={(e) => setCustosObraFiltro(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t('financial.allProjects')}</option>
                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custos_tipo_filtro">{t('financial.filterType')}</Label>
                <select
                  id="custos_tipo_filtro"
                  value={custosTipoFiltro}
                  onChange={(e) => setCustosTipoFiltro(e.target.value as 'todos' | 'materiais' | 'mao')}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="todos">{t('financial.filterTypeAll')}</option>
                  <option value="materiais">{t('financial.filterTypeMaterials')}</option>
                  <option value="mao">{t('financial.filterTypeLabor')}</option>
                </select>
              </div>
              <div className="flex items-end justify-end">
                <div className="rounded-md border border-border bg-muted/40 px-4 py-2 text-sm">
                  <span className="text-muted-foreground">{t('common.total')}:</span>{' '}
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    ${totalCustosDialog.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            {custosDialogFiltered.length === 0 ? (
              <p className="text-center text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-2">
                {custosDialogFiltered.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        {formatDateDisplay(item.data)} - {item.descricao}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.obra_id ? obrasMap.get(item.obra_id) || t('projects.title') : t('projects.title')}
                      </p>
                    </div>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      ${item.valor.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
