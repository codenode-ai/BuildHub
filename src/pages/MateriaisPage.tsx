import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { materiaisApi } from '@/db/api';
import type { Material } from '@/types/types';

export default function MateriaisPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    unidade: '',
    preco_referencia: '',
  });

  useEffect(() => {
    loadMateriais();
  }, []);

  const loadMateriais = async () => {
    try {
      setLoading(true);
      const data = await materiaisApi.getAll();
      setMateriais(data);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      toast({
        title: 'Erro',
        description: t('messages.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openForm = (material?: Material) => {
    if (material) {
      setEditing(material);
      setFormData({
        nome: material.nome,
        unidade: material.unidade || '',
        preco_referencia: material.preco_referencia ? material.preco_referencia.toString() : '',
      });
    } else {
      setEditing(null);
      setFormData({ nome: '', unidade: '', preco_referencia: '' });
    }
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nome: formData.nome,
        unidade: formData.unidade || undefined,
        preco_referencia: formData.preco_referencia ? Number(formData.preco_referencia) : undefined,
      };
      if (editing) {
        await materiaisApi.update(editing.id, payload);
      } else {
        await materiaisApi.create(payload);
      }
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setFormOpen(false);
      loadMateriais();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await materiaisApi.delete(deleteId);
      toast({ title: 'Sucesso', description: t('messages.deleteSuccess') });
      loadMateriais();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
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
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-bold xl:text-3xl">{t('materials.title')}</h1>
        <Button size="lg" onClick={() => openForm()}>
          <Plus className="mr-2 h-5 w-5" />
          {t('materials.new')}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {materiais.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <p className="text-muted-foreground">{t('common.noData')}</p>
            </CardContent>
          </Card>
        ) : (
          materiais.map((material) => (
            <Card key={material.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{material.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {material.unidade || t('materials.unit')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openForm(material)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(material.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('materials.referencePrice')}:</span>{' '}
                  <span className="font-semibold">
                    {material.preco_referencia ? `$${material.preco_referencia.toFixed(2)}` : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('common.edit') : t('materials.new')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">{t('materials.name')} *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unidade">{t('materials.unit')}</Label>
                <Input
                  id="unidade"
                  value={formData.unidade}
                  onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_referencia">{t('materials.referencePrice')}</Label>
                <Input
                  id="preco_referencia"
                  type="number"
                  step="0.01"
                  value={formData.preco_referencia}
                  onChange={(e) => setFormData({ ...formData, preco_referencia: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">
                {t('common.save')}
              </Button>
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setFormOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('materials.deleteConfirm')}</AlertDialogDescription>
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
