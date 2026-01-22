import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  obrasApi,
  receitasApi,
  custosApi,
  lancamentosMaoObraApi,
  funcionariosApi,
  materiaisSobraAplicacoesApi,
  materiaisMovimentosApi,
  alocacoesDiariasApi,
} from '@/db/api';
import type {
  Receita,
  Custo,
  LancamentoMaoObra,
  Funcionario,
  MaterialSobraAplicacao,
  MaterialMovimento,
  AlocacaoDiaria,
} from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [creditos, setCreditos] = useState<MaterialSobraAplicacao[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [obrasFinalizadas, setObrasFinalizadas] = useState(0);

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
      const [finalizadas, funcionariosData] = await Promise.all([
        obrasApi.getCompletedByDateRange(startDate, endDate),
        funcionariosApi.getAll(),
      ]);

      setFuncionarios(funcionariosData);
      setObrasFinalizadas(finalizadas.length);

      // Load financial data by date range to avoid per-project queries
      const [receitasData, custosData, lancamentosData, creditosData, movimentosData, alocacoesData] = await Promise.all([
        receitasApi.getAllByDateRange(startDate, endDate),
        custosApi.getAllByDateRange(startDate, endDate),
        lancamentosMaoObraApi.getAllByDateRange(startDate, endDate),
        materiaisSobraAplicacoesApi.getAllByDateRange(startDate, endDate),
        materiaisMovimentosApi.getAllByDateRange(startDate, endDate),
        alocacoesDiariasApi.getByDateRange(startDate, endDate),
      ]);

      setReceitas(receitasData);
      setCustos(custosData);
      setLancamentos(lancamentosData);
      setCreditos(creditosData);
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
  const totalReceitas = receitas.reduce((sum, r) => sum + Number(r.valor), 0);
  const totalCustosMateriaisLegado = custos
    .filter((c) => c.tipo === 'material_outros')
    .reduce((sum, c) => sum + Number(c.valor), 0);
  const totalMateriaisMovimentos = movimentos
    .filter((mov) => mov.tipo === 'uso')
    .reduce((sum, mov) => sum + Number(mov.valor_total), 0);
  const totalCustosMateriais = totalCustosMateriaisLegado + totalMateriaisMovimentos;
  const totalCustosMaoObra = custos
    .filter((c) => c.tipo === 'mao_de_obra')
    .reduce((sum, c) => sum + Number(c.valor), 0);
  const totalMaoObraLancamentos = lancamentos.reduce((sum, l) => {
    const func = funcionarios.find(f => f.id === l.funcionario_id);
    return sum + (func ? Number(l.quantidade) * Number(func.valor) : 0);
  }, 0);
  const totalMaoObraAlocacoes = alocacoes.reduce(
    (sum, a) => sum + Number(a.horas) * Number(a.valor_hora),
    0
  );
  const totalMaoObra = totalMaoObraLancamentos + totalMaoObraAlocacoes + totalCustosMaoObra;
  const totalCreditos = creditos.reduce((sum, c) => sum + Number(c.valor_credito), 0);
  const resultado = totalReceitas - totalCustosMateriais - totalMaoObra + totalCreditos;
  const breakdownCount = custos.length + lancamentos.length + creditos.length + movimentos.length + alocacoes.length;

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
          <div className="grid gap-4 xl:grid-cols-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('financial.totalRevenue')}</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">${totalReceitas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {receitas.length} {receitas.length === 1 ? 'receita' : 'receitas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('financial.totalCosts')}</CardTitle>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(totalCustosMateriais + totalMaoObra - totalCreditos).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${totalCustosMateriais.toFixed(2)} materiais + ${totalMaoObra.toFixed(2)} mão de obra - ${totalCreditos.toFixed(2)} créditos
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

      {/* Breakdown */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('financial.revenues')}</CardTitle>
          </CardHeader>
          <CardContent>
            {receitas.length === 0 ? (
              <p className="text-center text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="space-y-2">
                {receitas.slice(0, 5).map((receita) => (
                  <div key={receita.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(receita.data).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-primary">${receita.valor.toFixed(2)}</span>
                  </div>
                ))}
                {receitas.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{receitas.length - 5} mais
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('financial.costs')}</CardTitle>
          </CardHeader>
          <CardContent>
            {custos.length === 0 && lancamentos.length === 0 && creditos.length === 0 && movimentos.length === 0 && alocacoes.length === 0 ? (
              <p className="text-center text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="space-y-2">
                {movimentos.slice(0, 2).map((mov) => (
                  <div key={mov.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(mov.data).toLocaleDateString()} - {t('financial.materialsUsage')}
                    </span>
                    <span className="font-semibold">${Number(mov.valor_total).toFixed(2)}</span>
                  </div>
                ))}
                {custos.slice(0, 3).map((custo) => (
                  <div key={custo.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(custo.data).toLocaleDateString()} - {custo.descricao || (custo.tipo === 'mao_de_obra' ? t('financial.labor') : t('financial.materials'))}
                    </span>
                    <span className="font-semibold">${custo.valor.toFixed(2)}</span>
                  </div>
                ))}
                {lancamentos.slice(0, 2).map((lanc) => {
                  const func = funcionarios.find(f => f.id === lanc.funcionario_id);
                  const valor = func ? Number(lanc.quantidade) * Number(func.valor) : 0;
                  return (
                    <div key={lanc.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(lanc.data).toLocaleDateString()} - {t('financial.labor')}
                      </span>
                      <span className="font-semibold">${valor.toFixed(2)}</span>
                    </div>
                  );
                })}
                {alocacoes.slice(0, 2).map((alocacao) => (
                  <div key={alocacao.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(alocacao.data).toLocaleDateString()} - {t('financial.laborAllocations')}
                    </span>
                    <span className="font-semibold">
                      ${(Number(alocacao.horas) * Number(alocacao.valor_hora)).toFixed(2)}
                    </span>
                  </div>
                ))}
                {creditos.slice(0, 2).map((credito) => (
                  <div key={credito.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(credito.data).toLocaleDateString()} - {t('financial.leftoversCredit')}
                    </span>
                    <span className="font-semibold text-primary">-${Number(credito.valor_credito).toFixed(2)}</span>
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
    </div>
  );
}
