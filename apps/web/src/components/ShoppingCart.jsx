import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart as CartIcon, Trash2, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ShoppingCart = ({ cart, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout, isOpen, onClose }) => {
  const { toast } = useToast();

  const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de fazer o pedido",
        variant: "destructive"
      });
      return;
    }
    onCheckout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CartIcon className="w-6 h-6 text-amber-600" />
            Seu Carrinho
          </DialogTitle>
        </DialogHeader>

        {cart.length === 0 ? (
          <div className="py-12 text-center">
            <CartIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 text-lg">Seu carrinho está vazio</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex-1">
                  <h4 className="font-semibold text-stone-800">{item.name}</h4>
                  <p className="text-sm text-stone-600 mt-1">R$ {item.price.toFixed(2)} cada</p>
                  <div className="flex items-center gap-3 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold text-lg w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-amber-600">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRemoveItem(item.id)}
                    className="mt-2 gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </Button>
                </div>
              </div>
            ))}

            <div className="border-t border-stone-300 pt-4 mt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-stone-800">Total:</span>
                <span className="text-amber-600">R$ {totalValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button variant="outline" onClick={onClearCart} disabled={cart.length === 0} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Limpar Carrinho
          </Button>
          <Button onClick={handleCheckoutClick} disabled={cart.length === 0} size="lg" className="gap-2">
            <CartIcon className="w-5 h-5" />
            Fazer Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShoppingCart;