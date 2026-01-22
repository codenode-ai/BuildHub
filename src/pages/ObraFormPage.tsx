import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { obrasApi, clientesApi } from '@/db/api';
import type { Cliente, StatusObra } from '@/types/types';

export default function ObraFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    cliente_id: searchParams.get('cliente') || '',
    status: 'orcamento' as StatusObra,
    data_inicio: '',
    data_fim: '',
    motivo_paralisacao: '',
    observacoes: '',
    orcamento_total: '',
  });

  const isEdit = !!id;

  useEffect(() => {
    loadClientes();
    if (isEdit) {
      loadObra();
    }
  }, [id]);

  const loadClientes = async () => {
    try {
      const data = await clientesApi.getAll();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadObra = async () => {
    if (!id) return;

    try {
      const data = await obrasApi.getById(id);
      if (data) {
        setFormData({
          nome: data.nome || '',
          cliente_id: data.cliente_id || '',
          status: data.status || 'orcamento',
          data_inicio: data.data_inicio || '',
          data_fim: data.data_fim || '',
          motivo_paralisacao: data.motivo_paralisacao || '',
          observacoes: data.observacoes || '',
          orcamento_total: data.orcamento_total ? data.orcamento_total.toString() : '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar obra:', error);
      toast({
        title: 'Erro',
        description: t('messages.error'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && id) {
        await obrasApi.update(id, {
          ...formData,
          orcamento_total: formData.orcamento_total ? Number(formData.orcamento_total) : 0,
        });
      } else {
        await obrasApi.create({
          ...formData,
          orcamento_total: formData.orcamento_total ? Number(formData.orcamento_total) : 0,
        });
      }

      toast({
        title: 'Sucesso',
        description: t('messages.saveSuccess'),
      });
      navigate('/obras');
    } catch (error) {
      console.error('Erro ao salvar obra:', error);
      toast({
        title: 'Erro',
        description: t('messages.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold xl:text-3xl">
          {isEdit ? t('projects.edit') : t('projects.new')}
        </h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? t('projects.edit') : t('projects.new')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                {t('projects.name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente_id">
                {t('projects.client')} <span className="text-destructive">*</span>
              </Label>
              <select
                id="cliente_id"
                value={formData.cliente_id}
                onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">{t('projects.client')}</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('projects.status')}</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusObra })}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="orcamento">{t('status.orcamento')}</option>
                <option value="a_iniciar">{t('status.a_iniciar')}</option>
                <option value="em_andamento">{t('status.em_andamento')}</option>
                <option value="paralisada">{t('status.paralisada')}</option>
                <option value="finalizada">{t('status.finalizada')}</option>
              </select>
            </div>

            {formData.status === 'paralisada' && (
              <div className="space-y-2">
                <Label htmlFor="motivo_paralisacao">{t('projects.pauseReason')}</Label>
                <Textarea
                  id="motivo_paralisacao"
                  value={formData.motivo_paralisacao}
                  onChange={(e) =>
                    setFormData({ ...formData, motivo_paralisacao: e.target.value })
                  }
                  rows={3}
                />
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">{t('projects.startDate')}</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim">{t('projects.endDate')}</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">{t('common.observations')}</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orcamento_total">{t('budget.total')}</Label>
              <Input
                id="orcamento_total"
                type="number"
                step="0.01"
                value={formData.orcamento_total}
                onChange={(e) => setFormData({ ...formData, orcamento_total: e.target.value })}
                className="h-12"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" size="lg" disabled={loading} className="flex-1">
                {loading ? t('common.loading') : t('common.save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
