import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { clientesApi } from '@/db/api';
import type { Cliente } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientesListPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    filterClientes();
  }, [searchTerm, clientes]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clientesApi.getAll();
      setClientes(data);
      setFilteredClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro',
        description: t('messages.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClientes = () => {
    if (searchTerm) {
      const filtered = clientes.filter((cliente) =>
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
    } else {
      setFilteredClientes(clientes);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await clientesApi.delete(deleteId);
      toast({
        title: 'Sucesso',
        description: t('messages.deleteSuccess'),
      });
      loadClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: 'Erro',
        description: t('messages.error'),
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
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
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-bold xl:text-3xl">{t('clients.title')}</h1>
        <Button asChild size="lg">
          <Link to="/clientes/novo">
            <Plus className="mr-2 h-5 w-5" />
            {t('clients.new')}
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-12 pl-10"
        />
      </div>

      {/* Clients List */}
      <div className="grid gap-4 xl:grid-cols-2">
        {filteredClientes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <p className="text-muted-foreground">{t('common.noData')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredClientes.map((cliente) => (
            <Card key={cliente.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/clientes/${cliente.id}/editar`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(cliente.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link to={`/clientes/${cliente.id}`}>
                  <div className="space-y-2 text-sm">
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
                        <span className="truncate">{cliente.endereco}</span>
                      </div>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('clients.deleteConfirm')}</AlertDialogDescription>
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
