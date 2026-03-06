import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle2, Loader2 } from 'lucide-react';

const OrderCheckoutModal = ({ isOpen, onClose, cart, tableNumber, onSuccess }) => {
  const [customerName, setCustomerName] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome para o pedido.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const items = cart.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const { error } = await supabase.from('orders').insert([
        {
          table_number: tableNumber,
          customer_name: customerName,
          items: items,
          total_value: totalValue,
          status: 'pendente',
          notes: notes,
          number_of_people: numberOfPeople ? parseInt(numberOfPeople) : null
        }
      ]);

      if (error) throw error;

      toast({
        title: "Pedido Confirmado!",
        description: "Seu pedido foi enviado para a cozinha com sucesso.",
      });

      setCustomerName('');
      setNumberOfPeople('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erro ao enviar pedido",
        description: "Ocorreu um erro. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-stone-800">Finalizar Pedido</DialogTitle>
        </DialogHeader>

        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 mb-4">
          <h4 className="font-semibold text-stone-700 mb-3">Resumo do Pedido (Mesa {tableNumber})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-stone-600">{item.quantity}x {item.name}</span>
                <span className="font-medium text-stone-800">R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-200 mt-3 pt-3 flex justify-between items-center font-bold text-lg">
            <span className="text-stone-800">Total:</span>
            <span className="text-amber-600">R$ {totalValue.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nome do Cliente *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Como devemos chamar você?"
              required
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numberOfPeople">Quantas Pessoas? (Opcional)</Label>
            <Input
              id="numberOfPeople"
              type="number"
              min="1"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(e.target.value)}
              placeholder="Ex: 2"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (Opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Sem cebola, carne bem passada..."
              className="resize-none h-20"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Voltar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirmar Pedido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderCheckoutModal;