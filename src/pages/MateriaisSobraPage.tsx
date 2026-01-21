import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { materiaisSobraApi, materiaisSobraAplicacoesApi, obrasApi } from '@/db/api';
import type { MaterialSobra, MaterialSobraAplicacao, Obra } from '@/types/types';

type ApplyDialogState = {
  open: boolean;
  material?: MaterialSobra;
};

export default function MateriaisSobraPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [materiais, setMateriais] = useState<MaterialSobra[]>([]);
  const [aplicacoes, setAplicacoes] = useState<MaterialSobraAplicacao[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [applyDialog, setApplyDialog] = useState<ApplyDialogState>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    descricao: '',
    unidade: '',
    quantidade: '',
    valor_total: '',
    obra_origem_id: '',
  });

  const [applyForm, setApplyForm] = useState({
    obra_destino_id: '',
    quantidade: '',
    valor_credito: '',
    data: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materiaisData, aplicacoesData, obrasData] = await Promise.all([
        materiaisSobraApi.getAll(),
        materiaisSobraAplicacoesApi.getAll(),
        obrasApi.getAll(),
      ]);
      setMateriais(materiaisData);
      setAplicacoes(aplicacoesData);
      setObras(obrasData);
    } catch (error) {
      console.error('Erro ao carregar sobras:', error);
      toast({
        title: 'Erro',
        description: t('messages.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const obrasMap = useMemo(() => {
    const map = new Map<string, Obra>();
    obras.forEach((obra) => map.set(obra.id, obra));
    return map;
  }, [obras]);

  const getAppliedTotals = (materialId: string) => {
    const applied = aplicacoes.filter((item) => item.material_sobra_id === materialId);
    const quantidade = applied.reduce((sum, item) => sum + Number(item.quantidade), 0);
    const valor = applied.reduce((sum, item) => sum + Number(item.valor_credito), 0);
    return { quantidade, valor };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        descricao: form.descricao,
        unidade: form.unidade || undefined,
        quantidade: Number(form.quantidade),
        valor_total: Number(form.valor_total),
        obra_origem_id: form.obra_origem_id || undefined,
      };
      await materiaisSobraApi.create(data);
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setCreateOpen(false);
      setForm({ descricao: '', unidade: '', quantidade: '', valor_total: '', obra_origem_id: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao criar sobra:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  const openApplyDialog = (material: MaterialSobra) => {
    setApplyDialog({ open: true, material });
    setApplyForm({
      obra_destino_id: '',
      quantidade: '',
      valor_credito: '',
      data: new Date().toISOString().split('T')[0],
    });
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const material = applyDialog.material;
    if (!material) return;

    const applied = getAppliedTotals(material.id);
    const availableQty = Number(material.quantidade) - applied.quantidade;
    const availableValue = Number(material.valor_total) - applied.valor;
    const quantidade = Number(applyForm.quantidade);
    const valorCredito = Number(applyForm.valor_credito);

    if (!applyForm.obra_destino_id || quantidade <= 0 || valorCredito <= 0) {
      toast({ title: 'Erro', description: t('messages.required'), variant: 'destructive' });
      return;
    }

    if (quantidade > availableQty) {
      toast({
        title: 'Erro',
        description: t('leftovers.exceedQuantity'),
        variant: 'destructive',
      });
      return;
    }

    if (valorCredito > availableValue) {
      toast({
        title: 'Erro',
        description: t('leftovers.exceedValue'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await materiaisSobraAplicacoesApi.create({
        material_sobra_id: material.id,
        obra_destino_id: applyForm.obra_destino_id,
        quantidade,
        valor_credito: valorCredito,
        data: applyForm.data,
      });
      toast({ title: 'Sucesso', description: t('messages.saveSuccess') });
      setApplyDialog({ open: false });
      loadData();
    } catch (error) {
      console.error('Erro ao aplicar sobra:', error);
      toast({ title: 'Erro', description: t('messages.error'), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await materiaisSobraApi.delete(deleteId);
      toast({ title: 'Sucesso', description: t('messages.deleteSuccess') });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir sobra:', error);
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
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-bold xl:text-3xl">{t('leftovers.title')}</h1>
        <Button size="lg" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-5 w-5" />
          {t('leftovers.new')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('leftovers.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {materiais.length === 0 ? (
            <p className="text-center text-muted-foreground">{t('leftovers.noData')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.description')}</TableHead>
                  <TableHead>{t('leftovers.unit')}</TableHead>
                  <TableHead className="text-right">{t('leftovers.quantity')}</TableHead>
                  <TableHead className="text-right">{t('leftovers.available')}</TableHead>
                  <TableHead className="text-right">{t('leftovers.totalValue')}</TableHead>
                  <TableHead className="text-right">{t('leftovers.balanceValue')}</TableHead>
                  <TableHead>{t('leftovers.originWork')}</TableHead>
                  <TableHead className="w-[120px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiais.map((material) => {
                  const applied = getAppliedTotals(material.id);
                  const availableQty = Number(material.quantidade) - applied.quantidade;
                  const availableValue = Number(material.valor_total) - applied.valor;
                  const obra = material.obra_origem_id ? obrasMap.get(material.obra_origem_id) : undefined;
                  return (
                    <TableRow key={material.id}>
                      <TableCell>{material.descricao}</TableCell>
                      <TableCell>{material.unidade || '-'}</TableCell>
                      <TableCell className="text-right">{Number(material.quantidade).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{availableQty.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${Number(material.valor_total).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${availableValue.toFixed(2)}</TableCell>
                      <TableCell>
                        {obra ? (
                          <Link to={`/obras/${obra.id}`} className="text-primary hover:underline">
                            {obra.nome}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openApplyDialog(material)}
                            disabled={availableQty <= 0}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(material.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leftovers.new')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">{t('common.description')} *</Label>
              <Input
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unidade">{t('leftovers.unit')}</Label>
                <Input
                  id="unidade"
                  value={form.unidade}
                  onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade">{t('leftovers.quantity')} *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_total">{t('leftovers.totalValue')} *</Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                value={form.valor_total}
                onChange={(e) => setForm({ ...form, valor_total: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obra_origem_id">{t('leftovers.originWork')}</Label>
              <Select
                value={form.obra_origem_id}
                onValueChange={(value) => setForm({ ...form, obra_origem_id: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t('leftovers.originWork')} />
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
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">
                {t('common.save')}
              </Button>
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setCreateOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={applyDialog.open} onOpenChange={(open) => setApplyDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leftovers.apply')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="obra_destino_id">{t('leftovers.destinationWork')} *</Label>
              <Select
                value={applyForm.obra_destino_id}
                onValueChange={(value) => setApplyForm({ ...applyForm, obra_destino_id: value })}
                required
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t('leftovers.destinationWork')} />
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
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apply-quantidade">{t('leftovers.quantity')} *</Label>
                <Input
                  id="apply-quantidade"
                  type="number"
                  step="0.01"
                  value={applyForm.quantidade}
                  onChange={(e) => setApplyForm({ ...applyForm, quantidade: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apply-valor">{t('leftovers.creditValue')} *</Label>
                <Input
                  id="apply-valor"
                  type="number"
                  step="0.01"
                  value={applyForm.valor_credito}
                  onChange={(e) => setApplyForm({ ...applyForm, valor_credito: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apply-data">{t('leftovers.date')}</Label>
              <Input
                id="apply-data"
                type="date"
                value={applyForm.data}
                onChange={(e) => setApplyForm({ ...applyForm, data: e.target.value })}
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
                className="flex-1"
                onClick={() => setApplyDialog({ open: false })}
              >
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
            <AlertDialogDescription>{t('leftovers.deleteConfirm')}</AlertDialogDescription>
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
