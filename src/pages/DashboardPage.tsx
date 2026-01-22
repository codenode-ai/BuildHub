import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, CheckCircle2, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  obrasApi,
  funcionariosApi,
  alocacoesDiariasApi,
} from '@/db/api';
import type { ObraWithCliente, StatusObra, AlocacaoDiaria, Funcionario } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const formatDateInput = (date: Date) => date.toISOString().split('T')[0];

export default function DashboardPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [obras, setObras] = useState<ObraWithCliente[]>([]);
  const [filteredObras, setFilteredObras] = useState<ObraWithCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [metrics, setMetrics] = useState({ ativas: 0, finalizadas: 0, total: 0 });
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoDiaria[]>([]);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [allocationDialog, setAllocationDialog] = useState({
    open: false,
    data: new Date(),
    funcionarioId: '',
  });
  const [allocationForm, setAllocationForm] = useState({
    obra_id: '',
    horas: '',
    observacao: '',
  });
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  useEffect(() => {
    loadData();
  }, []);

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
    } catch (error) {
      console.error('Erro ao carregar alocações:', error);
    }
  };

  const openAllocation = (date: Date, funcionarioId: string) => {
    setAllocationDialog({ open: true, data: date, funcionarioId });
    setAllocationForm({ obra_id: '', horas: '', observacao: '' });
  };

  const handleAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const funcionario = funcionarios.find((item) => item.id === allocationDialog.funcionarioId);
    if (!funcionario) return;

    if (!allocationForm.obra_id || !allocationForm.horas) {
      toast({ title: 'Erro', description: t('messages.required'), variant: 'destructive' });
      return;
    }

    try {
      await alocacoesDiariasApi.create({
        data: formatDateInput(allocationDialog.data),
        funcionario_id: allocationDialog.funcionarioId,
        obra_id: allocationForm.obra_id,
        horas: Number(allocationForm.horas),
        valor_hora: Number(funcionario.valor),
        observacao: allocationForm.observacao || undefined,
      });
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setAllocationDialog({ open: false, data: new Date(), funcionarioId: '' });
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
              {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
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
          {funcionarios.length === 0 ? (
            <p className="text-center text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('team.employee')}</TableHead>
                  {weekDates.map((date) => (
                    <TableHead key={date.toISOString()} className="text-center">
                      {date.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit' })}
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
                                    <div key={item.id} className="rounded-md border border-border p-2 text-xs">
                                      <p className="font-semibold">{obra?.nome || t('projects.title')}</p>
                                      <p className="text-muted-foreground">
                                        {Number(item.horas).toFixed(1)}h
                                      </p>
                                    </div>
                                  );
                                })}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => openAllocation(date, funcionario.id)}
                                >
                                  {t('allocations.new')}
                                </Button>
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-full xl:w-[200px]">
            <SelectValue placeholder={t('common.filter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.filter')}</SelectItem>
            <SelectItem value="orcamento">{t('status.orcamento')}</SelectItem>
            <SelectItem value="a_iniciar">{t('status.a_iniciar')}</SelectItem>
            <SelectItem value="em_andamento">{t('status.em_andamento')}</SelectItem>
            <SelectItem value="paralisada">{t('status.paralisada')}</SelectItem>
            <SelectItem value="finalizada">{t('status.finalizada')}</SelectItem>
          </SelectContent>
        </Select>
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
                        <span>{new Date(obra.data_inicio).toLocaleDateString()}</span>
                      </div>
                    )}
                    {obra.data_fim && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('projects.endDate')}:</span>
                        <span>{new Date(obra.data_fim).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <Dialog
        open={allocationDialog.open}
        onOpenChange={(open) =>
          setAllocationDialog((current) => ({ ...current, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('allocations.new')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAllocation} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('team.employee')}</Label>
              <Input
                value={
                  funcionarios.find((item) => item.id === allocationDialog.funcionarioId)?.nome || ''
                }
                disabled
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('common.date')}</Label>
              <Input value={formatDateInput(allocationDialog.data)} disabled className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obra_id">{t('projects.title')} *</Label>
              <Select
                value={allocationForm.obra_id}
                onValueChange={(value) => setAllocationForm({ ...allocationForm, obra_id: value })}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t('projects.title')} />
                </SelectTrigger>
                <SelectContent>
                  {obras.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="horas">{t('allocations.hours')} *</Label>
              <Input
                id="horas"
                type="number"
                step="0.5"
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
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">
                {t('common.save')}
              </Button>
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setAllocationDialog({ open: false, data: new Date(), funcionarioId: '' })}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
