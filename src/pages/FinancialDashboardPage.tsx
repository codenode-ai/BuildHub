import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CheckCircle2, LayoutGrid, BarChart3 } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  obrasApi,
  receitasApi,
  custosApi,
  lancamentosMaoObraApi,
  funcionariosApi,
  materiaisMovimentosApi,
  alocacoesDiariasApi,
} from '@/db/api';
import type {
  Receita,
  Custo,
  LancamentoMaoObra,
  Funcionario,
  MaterialMovimento,
  AlocacaoDiaria,
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
  const [receitasObraFiltro, setReceitasObraFiltro] = useState('');
  const [custosObraFiltro, setCustosObraFiltro] = useState('');
  const [custosTipoFiltro, setCustosTipoFiltro] = useState<'todos' | 'materiais' | 'mao'>('todos');

  useEffect(() => {
    // Set default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
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
      const [receitasData, custosData, lancamentosData, movimentosData, alocacoesData] = await Promise.all([
        receitasApi.getAllByDateRange(startDate, endDate),
        custosApi.getAllByDateRange(startDate, endDate),
        lancamentosMaoObraApi.getAllByDateRange(startDate, endDate),
        materiaisMovimentosApi.getAllByDateRange(startDate, endDate),
        alocacoesDiariasApi.getByDateRange(startDate, endDate),
      ]);

      setReceitas(receitasData);
      setCustos(custosData);
      setLancamentos(lancamentosData);
      setMovimentos(movimentosData);
      setAlocacoes(alocacoesData);
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

  const totalReceitas = receitasFiltradas.reduce((sum, r) => sum + Number(r.valor), 0);
  const totalCustosMateriaisLegado = custosFiltrados
    .filter((c) => c.tipo === 'material_outros')
    .reduce((sum, c) => sum + Number(c.valor), 0);
  const totalMateriaisMovimentos = movimentosFiltrados
    .filter((mov) => mov.tipo === 'uso')
    .reduce((sum, mov) => sum + Number(mov.valor_total), 0);
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
  const breakdownCount = custosFiltrados.length + lancamentosFiltrados.length + movimentosFiltrados.length + alocacoesFiltradas.length;
  const selectedObraLabel = obraSelecionada
    ? obras.find((obra) => obra.id === obraSelecionada)?.nome || t('projects.title')
    : t('projects.title');
  const chartData = [
    { name: t('financial.totalRevenue'), valor: totalReceitas, color: '#16a34a' },
    { name: t('financial.materialCosts'), valor: totalCustosMateriais, color: '#f97316' },
    { name: t('financial.laborCosts'), valor: totalMaoObra, color: '#e11d48' },
    { name: t('financial.result'), valor: resultado, color: resultado >= 0 ? '#2563eb' : '#dc2626' },
  ];
  const obrasMap = new Map(obras.map((obra) => [obra.id, obra.nome]));
  const receitasDialogItems = receitasFiltradas
    .filter((receita) => !receitasObraFiltro || receita.obra_id === receitasObraFiltro);
  const custosDialogItems = [
    ...movimentosFiltrados.map((mov) => ({
      id: mov.id,
      data: mov.data,
      valor: Number(mov.valor_total),
      obra_id: mov.obra_id || '',
      tipo: 'materiais' as const,
      descricao: t('financial.materialsUsage'),
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
                      {new Date(receita.data).toLocaleDateString()}
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
            {custosFiltrados.length === 0 && lancamentosFiltrados.length === 0 && movimentosFiltrados.length === 0 && alocacoesFiltradas.length === 0 ? (
              <p className="text-center text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="space-y-2">
                {movimentosFiltrados.slice(0, 2).map((mov) => (
                  <div key={mov.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(mov.data).toLocaleDateString()} - {t('financial.materialsUsage')}
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">${Number(mov.valor_total).toFixed(2)}</span>
                  </div>
                ))}
                {custosFiltrados.slice(0, 3).map((custo) => (
                  <div key={custo.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(custo.data).toLocaleDateString()} - {custo.descricao || (custo.tipo === 'mao_de_obra' ? t('financial.labor') : t('financial.materials'))}
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
                        {new Date(lanc.data).toLocaleDateString()} - {t('financial.labor')}
                      </span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">${valor.toFixed(2)}</span>
                    </div>
                  );
                })}
                {alocacoesFiltradas.slice(0, 2).map((alocacao) => (
                  <div key={alocacao.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(alocacao.data).toLocaleDateString()} - {t('financial.laborAllocations')}
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
                      <p className="text-muted-foreground">{new Date(receita.data).toLocaleDateString()}</p>
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
                        {new Date(item.data).toLocaleDateString()} - {item.descricao}
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
