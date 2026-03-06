import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Wine, Utensils, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const RequestToWaiter = ({ tableNumber, isOpen, onClose }) => {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestItems = [
    { name: 'Copo', icon: Wine },
    { name: 'Garfo', icon: Utensils },
    { name: 'Faca', icon: UtensilsCrossed },
    { name: 'Prato', icon: Utensils },
    { name: 'Colher', icon: Utensils },
    { name: 'Guardanapo', icon: Utensils },
    { name: 'Sal', icon: Utensils },
    { name: 'Pimenta', icon: Utensils },
    { name: 'Açúcar', icon: Utensils },
    { name: 'Gelo', icon: Wine }
  ];

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setQuantity(1);
  };

  const handleBack = () => {
    setSelectedItem(null);
  };

  const handleRequest = async () => {
    if (!selectedItem || quantity < 1) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('waiter_requests').insert([
        {
          table_number: tableNumber,
          item_requested: selectedItem.name,
          quantidade: quantity
        }
      ]);

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: `Solicitação de ${quantity}x ${selectedItem.name} enviada ao garçom`,
      });
      
      setSelectedItem(null);
      onClose();
    } catch (error) {
      console.error('Error creating waiter request:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedItem(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Bell className="w-6 h-6 text-amber-600" />
            Chamar Garçom
          </DialogTitle>
        </DialogHeader>

        {!selectedItem ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4">
              {requestItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    onClick={() => handleItemClick(item)}
                    variant="outline"
                    className="h-24 flex flex-col gap-2 hover:bg-amber-50 hover:border-amber-600 transition-all"
                  >
                    <Icon className="w-8 h-8 text-amber-600" />
                    <span className="font-medium">{item.name}</span>
                  </Button>
                );
              })}
            </div>
            <p className="text-sm text-stone-600 text-center">
              Clique no item que você precisa e o garçom será notificado
            </p>
          </>
        ) : (
          <div className="py-6 space-y-6">
            <div className="flex items-center gap-4 justify-center mb-6">
              <selectedItem.icon className="w-12 h-12 text-amber-600" />
              <h3 className="text-2xl font-bold text-stone-800">{selectedItem.name}</h3>
            </div>
            
            <div className="space-y-3 max-w-xs mx-auto">
              <Label htmlFor="quantity" className="text-center block text-lg">Quantidade</Label>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >-</Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="text-center text-lg font-bold"
                />
                <Button 
                  variant="outline" 
                  onClick={() => setQuantity(quantity + 1)}
                >+</Button>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-between mt-8">
              <Button variant="ghost" onClick={handleBack} disabled={isSubmitting} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <Button onClick={handleRequest} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                {isSubmitting ? 'Enviando...' : 'Confirmar Solicitação'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestToWaiter;