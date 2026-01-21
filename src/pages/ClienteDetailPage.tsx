import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { clientesApi, obrasApi } from '@/db/api';
import type { Cliente, ObraWithCliente, StatusObra } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [obras, setObras] = useState<ObraWithCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [clienteData, obrasData] = await Promise.all([
        clientesApi.getById(id),
        obrasApi.getByClienteId(id),
      ]);
      setCliente(clienteData);
      setObras(obrasData);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">{t('common.noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold xl:text-3xl">{cliente.nome}</h1>
        <Button variant="outline" size="icon" asChild className="ml-auto">
          <Link to={`/clientes/${id}/editar`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('clients.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cliente.telefone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('clients.phone')}:</span>
              <span>{cliente.telefone}</span>
            </div>
          )}
          {cliente.email && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('clients.email')}:</span>
              <span>{cliente.email}</span>
            </div>
          )}
          {cliente.endereco && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('clients.address')}:</span>
              <span>{cliente.endereco}</span>
            </div>
          )}
          {cliente.observacoes && (
            <div>
              <span className="text-muted-foreground">{t('common.observations')}:</span>
              <p className="mt-1">{cliente.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('clients.projects')}</CardTitle>
            <Button asChild>
              <Link to={`/obras/nova?cliente=${id}`}>
                <Plus className="mr-2 h-4 w-4" />
                {t('clients.newProject')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {obras.length === 0 ? (
            <p className="text-center text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <div className="space-y-3">
              {obras.map((obra) => (
                <Link key={obra.id} to={`/obras/${obra.id}`}>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent">
                    <div>
                      <p className="font-medium">{obra.nome}</p>
                      {obra.data_inicio && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(obra.data_inicio).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(obra.status)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
