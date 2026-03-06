import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle2, Loader2 } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, comanda, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentMethod) {
      toast({
        title: "Forma de pagamento obrigatória",
        description: "Por favor, selecione uma forma de pagamento.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('comandas')
        .update({
          paid: true,
          forma_pagamento: paymentMethod,
          data_pagamento: new Date().toISOString()
        })
        .eq('id', comanda.id);

      if (error) throw error;

      toast({
        title: "Pagamento Confirmado!",
        description: "A comanda foi marcada como paga com sucesso.",
      });

      setPaymentMethod('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating comanda:', error);
      toast({
        title: "Erro ao confirmar pagamento",
        description: "Ocorreu um erro. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!comanda) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-stone-800">Confirmar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-stone-600">Mesa:</span>
            <span className="font-bold text-stone-800">{comanda.table_number}</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-stone-800 font-semibold">Total a Pagar:</span>
            <span className="font-bold text-amber-600">R$ {comanda.total_value?.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;