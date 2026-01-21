import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { obrasApi } from '@/db/api';
import type { ObraWithCliente, StatusObra } from '@/types/types';

export default function ObrasListPage() {
  const { t } = useLanguage();
  const [obras, setObras] = useState<ObraWithCliente[]>([]);
  const [filteredObras, setFilteredObras] = useState<ObraWithCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterObras();
  }, [searchTerm, statusFilter, obras]);

  const loadData = async () => {
    try {
      setLoading(true);
      const obrasData = await obrasApi.getAll();
      setObras(obrasData);
      setFilteredObras(obrasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
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
    const variants: Record<
      StatusObra,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
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
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-bold xl:text-3xl">{t('projects.title')}</h1>
        <Button asChild size="lg">
          <Link to="/obras/nova">
            <Plus className="mr-2 h-5 w-5" />
            {t('dashboard.newProject')}
          </Link>
        </Button>
      </div>

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
    </div>
  );
}
