import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { funcionariosApi } from '@/db/api';
import type { Funcionario, TipoCobranca } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function FuncionariosPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [filteredFuncionarios, setFilteredFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo_cobranca: 'hora' as TipoCobranca,
    valor: '',
    telefone: '',
    observacoes: '',
  });

  useEffect(() => {
    loadFuncionarios();
  }, []);

  useEffect(() => {
    filterFuncionarios();
  }, [searchTerm, funcionarios]);

  const loadFuncionarios = async () => {
    try {
      setLoading(true);
      const data = await funcionariosApi.getAll();
      setFuncionarios(data);
      setFilteredFuncionarios(data);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast({
        title: 'Erro',
        description: t('messages.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterFuncionarios = () => {
    if (searchTerm) {
      const filtered = funcionarios.filter((func) =>
        func.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFuncionarios(filtered);
    } else {
      setFilteredFuncionarios(funcionarios);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await funcionariosApi.delete(deleteId);
      toast({
        title: 'Sucesso',
        description: t('messages.deleteSuccess'),
      });
      loadFuncionarios();
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      toast({
        title: 'Erro',
        description: t('messages.error'),
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const openForm = (funcionario?: Funcionario) => {
    if (funcionario) {
      setEditingFuncionario(funcionario);
      setFormData({
        nome: funcionario.nome,
        tipo_cobranca: 'hora',
        valor: funcionario.valor.toString(),
        telefone: funcionario.telefone || '',
        observacoes: funcionario.observacoes || '',
      });
    } else {
      setEditingFuncionario(null);
      setFormData({
        nome: '',
        tipo_cobranca: 'hora',
        valor: '',
        telefone: '',
        observacoes: '',
      });
    }
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        valor: parseFloat(formData.valor),
      };

      if (editingFuncionario) {
        await funcionariosApi.update(editingFuncionario.id, data);
      } else {
        await funcionariosApi.create(data);
      }

      toast({
        title: 'Sucesso',
        description: t('messages.saveSuccess'),
      });
      setFormOpen(false);
      loadFuncionarios();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      toast({
        title: 'Erro',
        description: t('messages.error'),
        variant: 'destructive',
      });
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
        <h1 className="text-2xl font-bold xl:text-3xl">{t('employees.title')}</h1>
        <Button size="lg" onClick={() => openForm()}>
          <Plus className="mr-2 h-5 w-5" />
          {t('employees.new')}
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

      {/* Employees List */}
      <div className="grid gap-4 xl:grid-cols-2">
        {filteredFuncionarios.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <p className="text-muted-foreground">{t('common.noData')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredFuncionarios.map((funcionario) => (
            <Card key={funcionario.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{funcionario.nome}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {t('employees.hourly')}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openForm(funcionario)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(funcionario.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('employees.rate')}:</span>
                    <span className="font-semibold">
                      ${funcionario.valor.toFixed(2)}/{t('team.hours')}
                    </span>
                  </div>
                  {funcionario.telefone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('employees.phone')}:</span>
                      <span>{funcionario.telefone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFuncionario ? t('employees.edit') : t('employees.new')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                {t('employees.name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <input type="hidden" name="tipo_cobranca" value="hora" />

            <div className="space-y-2">
              <Label htmlFor="valor">
                Valor por hora <span className="text-destructive">*</span>
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="Valor por hora"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">{t('employees.phone')}</Label>
              <Input
                id="telefone"
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="h-12"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">
                {t('common.save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setFormOpen(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('employees.deleteConfirm')}</AlertDialogDescription>
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
