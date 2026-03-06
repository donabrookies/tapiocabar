import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Save, MapPin, Loader2 } from 'lucide-react';

const ConfiguracoesTab = () => {
  const [configId, setConfigId] = useState(null);
  const [formData, setFormData] = useState({
    endereco: '',
    latitude: 0,
    longitude: 0,
    restricao_ativa: false,
    raio_metros: 100,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfigId(data.id);
        setFormData({
          endereco: data.endereco || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          restricao_ativa: data.restricao_ativa || false,
          raio_metros: data.raio_metros || 100,
        });
      }
    } catch (error) {
      console.error('Error fetching configuracoes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({ ...prev, restricao_ativa: checked }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (configId) {
        const { error } = await supabase
          .from('configuracoes')
          .update(formData)
          .eq('id', configId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('configuracoes')
          .insert([formData])
          .select()
          .single();
        if (error) throw error;
        setConfigId(data.id);
      }
      toast({
        title: 'Configurações salvas!',
        description: 'As configurações foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving configuracoes:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-stone-500">Carregando configurações...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-amber-600" />
        Configurações do Estabelecimento
      </h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4 bg-stone-50 p-5 rounded-lg border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold text-stone-800">Restrição de Área de Pedido</Label>
              <p className="text-sm text-stone-500">Se ativo, clientes só poderão pedir se estiverem próximos ao local.</p>
            </div>
            <Switch checked={formData.restricao_ativa} onCheckedChange={handleSwitchChange} />
          </div>

          {formData.restricao_ativa && (
            <div className="pt-4 border-t border-stone-200 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="endereco">Endereço do Local</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  placeholder="Ex: Rua das Flores, 123, Centro"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="-23.5505"
                  required={formData.restricao_ativa}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="-46.6333"
                  required={formData.restricao_ativa}
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="raio_metros">Raio de Atendimento (em metros)</Label>
                <Input
                  id="raio_metros"
                  name="raio_metros"
                  type="number"
                  min="10"
                  value={formData.raio_metros}
                  onChange={handleChange}
                  placeholder="Ex: 100"
                  required={formData.restricao_ativa}
                />
                <p className="text-xs text-stone-500">Distância máxima permitida para o cliente fazer um pedido.</p>
              </div>
            </div>
          )}
        </div>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </Button>
      </form>
    </div>
  );
};

export default ConfiguracoesTab;