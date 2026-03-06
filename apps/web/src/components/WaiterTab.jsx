import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const WaiterTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('waiter_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching waiter requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const subscription = supabase
      .channel('waiter_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiter_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setRequests((prev) => prev.filter((req) => req.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleComplete = async (id) => {
    try {
      const { error } = await supabase.from('waiter_requests').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Solicitação concluída",
        description: "A solicitação foi removida da lista.",
      });
    } catch (error) {
      console.error('Error completing request:', error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir a solicitação.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-stone-500">Carregando solicitações...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-600" />
          Chamados de Garçom
        </h2>
        <Badge variant="secondary" className="text-lg">
          {requests.length} pendente(s)
        </Badge>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-stone-50 rounded-lg border border-dashed border-stone-300">
          <Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-lg">Nenhum chamado no momento.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <Badge className="bg-stone-800 text-white text-lg px-3 py-1">
                  Mesa {req.table_number}
                </Badge>
                <div className="flex items-center text-stone-500 text-sm gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(req.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              <div className="flex-1 mb-6">
                <p className="text-stone-600 text-sm mb-1">Item Solicitado:</p>
                <p className="text-2xl font-bold text-stone-800">
                  {req.quantidade}x {req.item_requested}
                </p>
              </div>

              <Button 
                onClick={() => handleComplete(req.id)} 
                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-5 h-5" />
                Concluído
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaiterTab;