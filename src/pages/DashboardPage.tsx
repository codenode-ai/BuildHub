import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, Building2, CheckCircle2, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  obrasApi,
  funcionariosApi,
  alocacoesDiariasApi,
} from '@/db/api';
import { formatDateDisplay, toLocalDateInput } from '@/lib/date';
import type { ObraWithCliente, StatusObra, AlocacaoDiaria, Funcionario } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const getWeekStart = (date: Date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = (day + 6) % 7;
  current.setDate(current.getDate() - diff);
  current.setHours(0, 0, 0, 0);
  return current;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDateInput = (date: Date) => toLocalDateInput(date);

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const location = useLocation();
  const [obras, setObras] = useState<ObraWithCliente[]>([]);
  const [filteredObras, setFilteredObras] = useState<ObraWithCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [metrics, setMetrics] = useState({ ativas: 0, finalizadas: 0, total: 0 });
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoDiaria[]>([]);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [allocationSelection, setAllocationSelection] = useState<{
    data: Date;
    funcionarioId: string;
  } | null>(null);
  const [allocationForm, setAllocationForm] = useState({
    obra_id: '',
    horas: '',
    observacao: '',
  });
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const [alocacoesUnavailable, setAlocacoesUnavailable] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setAllocationSelection(null);
  }, [location.pathname]);

  useEffect(() => {
    loadAlocacoes();
  }, [weekStart]);

  useEffect(() => {
    filterObras();
  }, [searchTerm, statusFilter, obras]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [obrasData, metricsData, funcionariosData] = await Promise.all([
        obrasApi.getAll(),
        obrasApi.getMetrics(),
        funcionariosApi.getAll(),
      ]);
      setObras(obrasData);
      setFilteredObras(obrasData);
      setMetrics(metricsData);
      setFuncionarios(funcionariosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlocacoes = async () => {
    try {
      const start = formatDateInput(weekStart);
      const end = formatDateInput(addDays(weekStart, 6));
      const data = await alocacoesDiariasApi.getByDateRange(start, end);
      setAlocacoes(data);
      setAlocacoesUnavailable(false);
    } catch (error) {
      console.error('Erro ao carregar alocações:', error);
      setAlocacoes([]);
      setAlocacoesUnavailable(true);
    }
  };

  const openAllocation = (date: Date, funcionarioId: string) => {
    const dayKey = formatDateInput(date);
    const existing = alocacoes.filter(
      (item) => item.funcionario_id === funcionarioId && item.data === dayKey
    );
    setAllocationSelection({ data: date, funcionarioId });
    if (existing.length === 1) {
      setAllocationForm({
        obra_id: existing[0].obra_id,
        horas: existing[0].horas.toString(),
        observacao: existing[0].observacao || '',
      });
    } else {
      setAllocationForm({ obra_id: '', horas: '', observacao: '' });
    }
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    try {
      await alocacoesDiariasApi.delete(allocationId);
      toast({ title: 'Sucesso', description: t('messages.deleteSuccess') });
      loadAlocacoes();
    } catch (error) {
      console.error('Erro ao excluir alocação:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  const handleAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationSelection) return;
    const funcionario = funcionarios.find((item) => item.id === allocationSelection.funcionarioId);
    if (!funcionario) return;

    if (!allocationForm.obra_id || !allocationForm.horas) {
      toast({ title: 'Erro', description: t('messages.required'), variant: 'destructive' });
      return;
    }

    try {
      await alocacoesDiariasApi.create({
        data: formatDateInput(allocationSelection.data),
        funcionario_id: allocationSelection.funcionarioId,
        obra_id: allocationForm.obra_id,
        horas: Number(allocationForm.horas),
        valor_hora: Number(funcionario.valor),
        observacao: allocationForm.observacao || undefined,
      });
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setAllocationSelection(null);
      loadAlocacoes();
    } catch (error) {
      console.error('Erro ao salvar alocação:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  const filterObras = () => {
    let filtered = obras;

    if (searchTerm) {
      filtered = filtered.filter(
        (obra) =>
          obra.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          obra.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((obra) => obra.status === statusFilter);
    }

    setFilteredObras(filtered);
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

  const formatWeekdayHeader = (date: Date) => {
    const locale = language === 'pt' ? 'pt-BR' : 'en-US';
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
      .format(date)
      .replace(/[.,]/g, '');
    const day = String(date.getDate()).padStart(2, '0');
    return `${weekday} ${day}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-bold xl:text-3xl">{t('dashboard.title')}</h1>
        <Button asChild size="lg">
          <Link to="/obras/nova">
            <Plus className="mr-2 h-5 w-5" />
            {t('dashboard.newProject')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>{t('allocations.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDateDisplay(formatDateInput(weekDates[0]))} - {formatDateDisplay(formatDateInput(weekDates[6]))}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alocacoesUnavailable ? (
            <p className="text-center text-muted-foreground">
              Tabela de alocacoes nao encontrada. Aplique a migracao `20250121_add_materials_and_allocations.sql`.
            </p>
          ) : funcionarios.length === 0 ? (
            <p className="text-center text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('team.employee')}</TableHead>
                  {weekDates.map((date) => (
                    <TableHead key={date.toISOString()} className="text-center">
                      {formatWeekdayHeader(date)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((funcionario) => (
                  <TableRow key={funcionario.id}>
                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                  {weekDates.map((date) => {
                      const dayKey = formatDateInput(date);
                      const dayAllocations = alocacoes.filter(
                        (item) =>
                          item.funcionario_id === funcionario.id &&
                          item.data === dayKey
                      );
                      return (
                        <TableCell key={dayKey} className="min-w-[140px]">
                          <div className="space-y-2">
                            {dayAllocations.length === 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => openAllocation(date, funcionario.id)}
                              >
                                {t('allocations.new')}
                              </Button>
                            ) : (
                              <>
                                {dayAllocations.map((item) => {
                                  const obra = obras.find((obraItem) => obraItem.id === item.obra_id);
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => openAllocation(date, funcionario.id)}
                                      className="w-full rounded-md border border-border p-2 text-left text-xs transition-colors hover:bg-accent"
                                    >
                                      <p className="font-semibold">{obra?.nome || t('projects.title')}</p>
                                      <p className="text-muted-foreground">
                                        {Number(item.horas).toFixed(1)}h
                                      </p>
                                    </button>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {allocationSelection && (
            <div className="mt-6 rounded-lg border border-border p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('team.employee')}</p>
                  <p className="font-semibold">
                    {funcionarios.find((item) => item.id === allocationSelection.funcionarioId)?.nome || ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateInput(allocationSelection.data)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {(() => {
                    const dayKey = formatDateInput(allocationSelection.data);
                    const existing = alocacoes.find(
                      (item) =>
                        item.funcionario_id === allocationSelection.funcionarioId &&
                        item.data === dayKey
                    );
                    return existing ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAllocation(existing.id)}
                      >
                        {t('common.delete')}
                      </Button>
                    ) : null;
                  })()}
                  <Button variant="outline" size="sm" onClick={() => setAllocationSelection(null)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
              <form onSubmit={handleAllocation} className="grid gap-4 xl:grid-cols-4">
                <div className="xl:col-span-2 space-y-2">
                  <Label htmlFor="obra_id">{t('projects.title')} *</Label>
                  <select
                    id="obra_id"
                    value={allocationForm.obra_id}
                    onChange={(e) => setAllocationForm({ ...allocationForm, obra_id: e.target.value })}
                    className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="">{t('projects.title')}</option>
                    {obras.map((obra) => (
                      <option key={obra.id} value={obra.id}>
                        {obra.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horas">{t('allocations.hours')} *</Label>
                  <Input
                    id="horas"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={allocationForm.horas}
                    onChange={(e) => setAllocationForm({ ...allocationForm, horas: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacao">{t('allocations.note')}</Label>
                  <Input
                    id="observacao"
                    value={allocationForm.observacao}
                    onChange={(e) => setAllocationForm({ ...allocationForm, observacao: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="xl:col-span-4 flex justify-end">
                  <Button type="submit" size="lg">
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.activeProjects')}</CardTitle>
            <Building2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.ativas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.completedProjects')}</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.finalizadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalProjects')}</CardTitle>
            <FolderOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm xl:w-[200px]"
        >
          <option value="all">{t('common.filter')}</option>
          <option value="orcamento">{t('status.orcamento')}</option>
          <option value="a_iniciar">{t('status.a_iniciar')}</option>
          <option value="em_andamento">{t('status.em_andamento')}</option>
          <option value="paralisada">{t('status.paralisada')}</option>
          <option value="finalizada">{t('status.finalizada')}</option>
        </select>
      </div>

      {/* Projects List */}
      <div className="grid gap-4 xl:grid-cols-2">
        {filteredObras.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <p className="text-muted-foreground">{t('common.noData')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredObras.map((obra) => (
            <Link key={obra.id} to={`/obras/${obra.id}`}>
              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{obra.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">{obra.clientes?.nome}</p>
                    </div>
                    {getStatusBadge(obra.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 text-sm">
                    {obra.data_inicio && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('projects.startDate')}:</span>
                        <span>{formatDateDisplay(obra.data_inicio)}</span>
                      </div>
                    )}
                    {obra.data_fim && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('projects.endDate')}:</span>
                        <span>{formatDateDisplay(obra.data_fim)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

    </div>
  );
}
