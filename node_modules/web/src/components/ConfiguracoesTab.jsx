import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Save, MapPin, Loader2, Map, Crosshair } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ConfiguracoesTab = () => {
  const [configId, setConfigId] = useState(null);
  const [formData, setFormData] = useState({
    endereco: '',
    latitude: -23.5505,
    longitude: -46.6333,
    restricao_ativa: false,
    raio_metros: 100,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const { toast } = useToast();
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!loading && mapRef.current && !mapInstanceRef.current) {
      initMap();
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading]);

  useEffect(() => {
    if (mapInstanceRef.current && formData.restricao_ativa) {
      updateMapMarker();
    }
  }, [formData.latitude, formData.longitude, formData.raio_metros, formData.restricao_ativa]);

  const initMap = () => {
    const map = L.map(mapRef.current).setView([formData.latitude, formData.longitude], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    });

    mapInstanceRef.current = map;
    updateMapMarker();
  };

  const updateMapMarker = () => {
    if (!mapInstanceRef.current) return;

    // Remove marcador e círculo anteriores
    if (markerRef.current) markerRef.current.remove();
    if (circleRef.current) circleRef.current.remove();

    // Adiciona novo marcador
    markerRef.current = L.marker([formData.latitude, formData.longitude], {
      draggable: true
    }).addTo(mapInstanceRef.current);

    markerRef.current.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    });

    // Adiciona círculo do raio
    if (formData.restricao_ativa && formData.raio_metros > 0) {
      circleRef.current = L.circle([formData.latitude, formData.longitude], {
        radius: formData.raio_metros,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.2,
        weight: 2
      }).addTo(mapInstanceRef.current);
    }

    // Centraliza o mapa no marcador
    mapInstanceRef.current.setView([formData.latitude, formData.longitude]);
  };

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
          latitude: data.latitude || -23.5505,
          longitude: data.longitude || -46.6333,
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

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      toast({
        title: "Erro",
        description: "Geolocalização não é suportada pelo seu navegador.",
        variant: "destructive"
      });
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        toast({
          title: "Localização obtida!",
          description: "Sua posição foi marcada no mapa.",
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Erro",
          description: "Não foi possível obter sua localização. Verifique as permissões.",
          variant: "destructive"
        });
        setGettingLocation(false);
      }
    );
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
    <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
      <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-amber-600" />
        Configurações do Estabelecimento
      </h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4 bg-stone-50 p-5 rounded-lg border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold text-stone-800">Restrição de Área de Pedido</Label>
              <p className="text-sm text-stone-500">Se ativo, clientes só poderão pedir se estiverem dentro do raio definido.</p>
            </div>
            <Switch checked={formData.restricao_ativa} onCheckedChange={handleSwitchChange} />
          </div>

          {formData.restricao_ativa && (
            <div className="pt-4 border-t border-stone-200 space-y-4">
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
              
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="gap-2"
                >
                  {gettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Crosshair className="w-4 h-4" />
                  )}
                  Usar minha localização atual
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="raio_metros">Raio de Atendimento (em metros)</Label>
                <Input
                  id="raio_metros"
                  name="raio_metros"
                  type="number"
                  min="10"
                  max="5000"
                  value={formData.raio_metros}
                  onChange={handleChange}
                  placeholder="Ex: 100"
                  required={formData.restricao_ativa}
                />
                <p className="text-xs text-stone-500">
                  Distância máxima permitida para o cliente fazer um pedido. Clique no mapa para ajustar a posição ou arraste o marcador.
                </p>
              </div>

              <div className="mt-4 border rounded-lg overflow-hidden h-96">
                <div ref={mapRef} className="w-full h-full" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 Dica:</p>
                <p>• Clique no mapa para posicionar o marcador</p>
                <p>• Arraste o marcador para ajustar a posição</p>
                <p>• O círculo mostra a área de atendimento</p>
                <p>• Use "Usar minha localização atual" para marcar onde você está agora</p>
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