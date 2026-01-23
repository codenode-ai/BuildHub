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
import { materiaisApi, materiaisMovimentosApi } from '@/db/api';
import type { Material, MaterialMovimento } from '@/types/types';
import { MateriaisSobraSection } from '@/pages/MateriaisSobraPage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function MateriaisPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [movimentos, setMovimentos] = useState<MaterialMovimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Material | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockMaterial, setStockMaterial] = useState<Material | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState({
    nome: '',
    preco_referencia: '',
    quantidade_inicial: '',
  });
  const [stockForm, setStockForm] = useState({
    quantidade: '',
    valor_unitario: '',
    data: new Date().toISOString().split('T')[0],
    observacao: '',
  });
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  useEffect(() => {
    loadMateriais();
  }, []);

  const loadMateriais = async () => {
    try {
      setLoading(true);
      const [materiaisData, movimentosData] = await Promise.all([
        materiaisApi.getAll(),
        materiaisMovimentosApi.getAll(),
      ]);
      setMateriais(materiaisData);
      setMovimentos(movimentosData);
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

  const estoquePorMaterial = new Map<string, number>();
  movimentos.forEach((mov) => {
    const atual = estoquePorMaterial.get(mov.material_id) || 0;
    const quantidade = Number(mov.quantidade);
    const delta = mov.tipo === 'uso' ? -quantidade : quantidade;
    estoquePorMaterial.set(mov.material_id, atual + delta);
  });

  const openForm = (material?: Material) => {
    if (material) {
      setEditing(material);
      setFormData({
        nome: material.nome,
        preco_referencia: material.preco_referencia ? material.preco_referencia.toString() : '',
        quantidade_inicial: '',
      });
    } else {
      setEditing(null);
      setFormData({ nome: '', preco_referencia: '', quantidade_inicial: '' });
    }
    setFormOpen(true);
  };

  const openStockDialog = (material: Material) => {
    setStockMaterial(material);
    setStockForm({
      quantidade: '',
      valor_unitario: material.preco_referencia ? material.preco_referencia.toString() : '',
      data: new Date().toISOString().split('T')[0],
      observacao: '',
    });
    setStockDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editing) {
        if (!formData.preco_referencia || !formData.quantidade_inicial) {
          toast({ title: 'Erro', description: t('messages.required'), variant: 'destructive' });
          return;
        }
      }
      const payload = {
        nome: formData.nome,
        preco_referencia: formData.preco_referencia ? Number(formData.preco_referencia) : undefined,
      };
      if (editing) {
        await materiaisApi.update(editing.id, payload);
      } else {
        const created = await materiaisApi.create(payload);
        const quantidadeInicial = Number(formData.quantidade_inicial);
        if (!Number.isInteger(quantidadeInicial)) {
          toast({ title: 'Erro', description: 'Quantidade deve ser um numero inteiro.', variant: 'destructive' });
          return;
        }
        if (quantidadeInicial > 0) {
          await materiaisMovimentosApi.create({
            material_id: created.id,
            tipo: 'ajuste',
            quantidade: quantidadeInicial,
            valor_total: quantidadeInicial * Number(formData.preco_referencia),
            data: new Date().toISOString().split('T')[0],
            observacao: 'Estoque inicial',
            obra_id: null,
          });
        }
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

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockMaterial) return;
    try {
      const quantidade = Number(stockForm.quantidade);
      if (!Number.isInteger(quantidade)) {
        toast({ title: 'Erro', description: 'Quantidade deve ser um numero inteiro.', variant: 'destructive' });
        return;
      }
      const valorUnitario = Number(stockForm.valor_unitario);
      const valorTotal = quantidade * valorUnitario;
      await materiaisMovimentosApi.create({
        material_id: stockMaterial.id,
        tipo: 'ajuste',
        quantidade,
        valor_total: valorTotal,
        data: stockForm.data,
        observacao: stockForm.observacao || undefined,
        obra_id: null,
      });
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setStockDialogOpen(false);
      setStockMaterial(null);
      loadMateriais();
    } catch (error) {
      console.error('Erro ao adicionar estoque:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
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
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-md border border-border p-1">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
            >
              Cards
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
            >
              Lista
            </Button>
          </div>
          <Button size="lg" onClick={() => openForm()}>
            <Plus className="mr-2 h-5 w-5" />
            {t('materials.new')}
          </Button>
        </div>
      </div>

      {materiais.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <p className="text-muted-foreground">{t('common.noData')}</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {materiais.map((material) => (
            <Card key={material.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="truncate text-lg" title={material.nome}>
                      {material.nome}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t('materials.stock')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openStockDialog(material)}>
                      <Plus className="h-4 w-4" />
                    </Button>
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
                    {material.preco_referencia ? currencyFormatter.format(material.preco_referencia) : '-'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('materials.stock')}:</span>{' '}
                  <span className="font-semibold">
                    {Number(estoquePorMaterial.get(material.id) || 0).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('materials.name')}</TableHead>
                  <TableHead>{t('materials.referencePrice')}</TableHead>
                  <TableHead>{t('materials.stock')}</TableHead>
                  <TableHead className="w-[120px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiais.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.nome}</TableCell>
                    <TableCell>
                      {material.preco_referencia ? currencyFormatter.format(material.preco_referencia) : '-'}
                    </TableCell>
                    <TableCell>{Number(estoquePorMaterial.get(material.id) || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openStockDialog(material)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openForm(material)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(material.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="quantidade_inicial">{t('materials.stockQuantity')} *</Label>
                <Input
                  id="quantidade_inicial"
                  type="number"
                  step="1"
                  min="1"
                  value={formData.quantidade_inicial}
                  onChange={(e) => setFormData({ ...formData, quantidade_inicial: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
            )}
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

      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('materials.stockEntry')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock_material">Material</Label>
              <Input id="stock_material" value={stockMaterial?.nome || ''} readOnly className="h-12" />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stock_quantidade">{t('leftovers.quantity')} *</Label>
                <Input
                  id="stock_quantidade"
                  type="number"
                  step="1"
                  min="1"
                  value={stockForm.quantidade}
                  onChange={(e) => setStockForm({ ...stockForm, quantidade: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_valor">{t('materials.referencePrice')} *</Label>
                <Input
                  id="stock_valor"
                  type="number"
                  step="0.01"
                  value={stockForm.valor_unitario}
                  onChange={(e) => setStockForm({ ...stockForm, valor_unitario: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_data">Data *</Label>
              <Input
                id="stock_data"
                type="date"
                value={stockForm.data}
                onChange={(e) => setStockForm({ ...stockForm, data: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_observacao">Observacoes</Label>
              <Input
                id="stock_observacao"
                value={stockForm.observacao}
                onChange={(e) => setStockForm({ ...stockForm, observacao: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">
                {t('common.save')}
              </Button>
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStockDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border-t border-border pt-6">
        <MateriaisSobraSection showHeader={false} />
      </div>
    </div>
  );
}
