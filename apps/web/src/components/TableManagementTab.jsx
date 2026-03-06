import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Download, Plus, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import QRCode from 'qrcode';

const TableCard = ({ table, onDelete }) => {
  const [qrDataUri, setQrDataUri] = useState('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const baseUrl = window.location.origin;
        let targetUrl = table.qr_code;
        if (targetUrl && targetUrl.startsWith('?')) {
          targetUrl = `${baseUrl}/${targetUrl}`;
        } else if (!targetUrl || (!targetUrl.startsWith('http') && !targetUrl.startsWith('data:'))) {
          targetUrl = `${baseUrl}/?mesa=${table.table_number}`;
        }

        if (targetUrl.startsWith('data:')) {
          setQrDataUri(targetUrl);
          return;
        }

        const uri = await QRCode.toDataURL(targetUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#1c1917',
            light: '#ffffff'
          }
        });
        setQrDataUri(uri);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [table]);

  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 flex flex-col items-center text-center">
      <div className="w-full flex justify-between items-start mb-4">
        <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-sm">
          Mesa {table.table_number}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
          onClick={() => onDelete(table.id, table.table_number)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="bg-white p-2 rounded-lg border border-stone-200 mb-4 min-h-[144px] flex items-center justify-center w-full">
        {qrDataUri ? (
          <img 
            src={qrDataUri} 
            alt={`QR Code Mesa ${table.table_number}`}
            className="w-32 h-32 object-contain"
          />
        ) : (
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
      
      <a 
        href={qrDataUri || '#'} 
        download={qrDataUri ? `mesa-${table.table_number}-qrcode.png` : undefined}
        className="w-full"
        onClick={(e) => !qrDataUri && e.preventDefault()}
      >
        <Button variant="outline" className="w-full gap-2" disabled={!qrDataUri}>
          <Download className="w-4 h-4" />
          Baixar QR Code
        </Button>
      </a>
    </div>
  );
};

const TableManagementTab = () => {
  const [tables, setTables] = useState([]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number', { ascending: true });
      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mesas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    const number = parseInt(newTableNumber);
    
    if (isNaN(number) || number < 1 || number > 50) {
      toast({
        title: "Número inválido",
        description: "A mesa deve ter um número entre 1 e 50",
        variant: "destructive"
      });
      return;
    }

    if (tables.some(t => t.table_number === number)) {
      toast({
        title: "Mesa já existe",
        description: `A mesa ${number} já está cadastrada`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tables').insert([
        {
          table_number: number,
          qr_code: `?mesa=${number}`
        }
      ]);

      if (error) throw error;

      toast({
        title: "Mesa adicionada!",
        description: `Mesa ${number} gerada com sucesso`,
      });
      
      setNewTableNumber('');
      fetchTables();
    } catch (error) {
      console.error('Error adding table:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a mesa",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId, tableNumber) => {
    if (!window.confirm(`Tem certeza que deseja excluir a mesa ${tableNumber}?`)) return;

    try {
      const { error } = await supabase.from('tables').delete().eq('id', tableId);
      if (error) throw error;
      toast({
        title: "Mesa excluída",
        description: `A mesa ${tableNumber} foi removida`,
      });
      fetchTables();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a mesa",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-stone-500">Carregando mesas...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
          <Plus className="w-6 h-6 text-amber-600" />
          Adicionar Nova Mesa
        </h2>
        
        <form onSubmit={handleAddTable} className="flex items-end gap-4 max-w-md">
          <div className="flex-1">
            <Label htmlFor="newTableNumber">Número da Mesa (1-50)</Label>
            <Input
              id="newTableNumber"
              type="number"
              min="1"
              max="50"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="Ex: 12"
              className="mt-1"
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <QrCode className="w-4 h-4" />
            {isSubmitting ? 'Adicionando...' : 'Adicionar Mesa'}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Mesas Cadastradas</h2>
        
        {tables.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            Nenhuma mesa cadastrada ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tables.map((table) => (
              <TableCard 
                key={table.id} 
                table={table} 
                onDelete={handleDeleteTable} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableManagementTab;