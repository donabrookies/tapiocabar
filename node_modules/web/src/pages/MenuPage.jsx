import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Header from '@/components/Header.jsx';
import TableSelectionModal from '@/components/TableSelectionModal.jsx';
import ShoppingCart from '@/components/ShoppingCart.jsx';
import RequestToWaiter from '@/components/RequestToWaiter.jsx';
import OrderCheckoutModal from '@/components/OrderCheckoutModal.jsx';
import { ShoppingCart as CartIcon, Bell, Plus, MapPinOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const MenuPage = () => {
  const [tableNumber, setTableNumber] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [waiterRequestOpen, setWaiterRequestOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOutsideArea, setIsOutsideArea] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);
  const [locationError, setLocationError] = useState('');
  const { toast } = useToast();

  const categories = ['Todos', 'Carnes', 'Bebidas', 'Sobremesas', 'Entradas', 'Acompanhamentos'];

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        checkLocationRestriction(),
        fetchProducts()
      ]);
      
      const params = new URLSearchParams(window.location.search);
      const mesaParam = params.get('mesa');
      
      if (mesaParam) {
        const num = parseInt(mesaParam);
        if (!isNaN(num) && num > 0) {
          handleTableDetected(num);
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      }

      const savedTable = localStorage.getItem('tableNumber');
      if (savedTable) {
        setTableNumber(parseInt(savedTable));
      } else {
        setIsTableModalOpen(true);
      }
    };

    init();
  }, []);

  const checkLocationRestriction = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // Se não houver configurações ou restrição desativada, libera
      if (!data || !data.restricao_ativa) {
        setIsOutsideArea(false);
        setLocationChecked(true);
        return;
      }

      // Se tiver restrição ativa mas sem coordenadas, libera (configuração incompleta)
      if (!data.latitude || !data.longitude) {
        setIsOutsideArea(false);
        setLocationChecked(true);
        return;
      }

      // Verifica geolocalização
      if (!navigator.geolocation) {
        setLocationError('Geolocalização não é suportada pelo seu navegador.');
        setIsOutsideArea(true);
        setLocationChecked(true);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const distance = getDistanceInMeters(
            userLat, 
            userLon, 
            data.latitude, 
            data.longitude
          );
          
          setIsOutsideArea(distance > (data.raio_metros || 100));
          setLocationChecked(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError(
            error.code === 1 
              ? 'Permissão negada. Permita o acesso à localização para fazer pedidos.'
              : 'Erro ao obter localização. Tente novamente.'
          );
          setIsOutsideArea(true);
          setLocationChecked(true);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    } catch (error) {
      console.error('Error checking config:', error);
      setLocationChecked(true);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTableDetected = (number) => {
    setTableNumber(number);
    localStorage.setItem('tableNumber', number.toString());
    setIsTableModalOpen(false);
    toast({
      title: "Mesa identificada!",
      description: `Você está na mesa ${number}`,
    });
  };

  const addToCart = (product) => {
    if (isOutsideArea) {
      toast({
        title: "Fora da área de atendimento",
        description: "Você não está no estabelecimento no momento.",
        variant: "destructive"
      });
      return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast({
      title: "Adicionado ao carrinho!",
      description: `${product.name} foi adicionado`,
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos",
    });
  };

  const handleInitiateCheckout = () => {
    if (isOutsideArea) {
      toast({
        title: "Fora da área de atendimento",
        description: "Você não está no estabelecimento no momento.",
        variant: "destructive"
      });
      return;
    }
    if (!tableNumber) {
      toast({
        title: "Erro",
        description: "Número da mesa não identificado",
        variant: "destructive"
      });
      setIsTableModalOpen(true);
      return;
    }
    setCartOpen(false);
    setCheckoutModalOpen(true);
  };

  const handleCheckoutSuccess = () => {
    setCart([]);
  };

  if (loading || !locationChecked) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{tableNumber ? `Cardápio - Mesa ${tableNumber}` : 'Cardápio Digital'}</title>
        <meta name="description" content="Navegue pelo nosso cardápio e faça seus pedidos" />
      </Helmet>

      <div className="min-h-screen bg-stone-50">
        <Header />

        <div className="container mx-auto px-4 py-8">
          {isOutsideArea && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
              <MapPinOff className="h-5 w-5" />
              <AlertTitle className="text-lg font-bold">Fora da área de atendimento</AlertTitle>
              <AlertDescription>
                {locationError || "Você não está no estabelecimento. Os pedidos estão bloqueados."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              {tableNumber ? (
                <Badge 
                  variant="secondary" 
                  className="text-lg px-4 py-2 mb-2 cursor-pointer hover:bg-stone-200 transition-colors" 
                  onClick={() => setIsTableModalOpen(true)}
                >
                  Mesa {tableNumber} (Alterar)
                </Badge>
              ) : (
                <Badge 
                  variant="outline" 
                  className="text-lg px-4 py-2 mb-2 text-amber-600 border-amber-600 cursor-pointer hover:bg-amber-50 transition-colors"
                  onClick={() => setIsTableModalOpen(true)}
                >
                  Identificar Mesa
                </Badge>
              )}
              <h1 className="text-4xl font-bold text-stone-800">Nosso Cardápio</h1>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setWaiterRequestOpen(true)} 
                variant="outline" 
                className="gap-2" 
                disabled={!tableNumber || isOutsideArea}
              >
                <Bell className="w-5 h-5" />
                <span className="hidden sm:inline">Chamar Garçom</span>
              </Button>
              <Button 
                onClick={() => setCartOpen(true)} 
                className="gap-2 relative" 
                disabled={!tableNumber || isOutsideArea}
              >
                <CartIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Carrinho</span>
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500">
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="Todos" className="w-full">
            <TabsList className="flex flex-wrap w-full justify-start mb-8 h-auto gap-2 bg-transparent">
              {categories.map(category => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="data-[state=active]:bg-amber-600 data-[state=active]:text-white bg-white border border-stone-200"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map(category => (
              <TabsContent key={category} value={category}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products
                    .filter(p => category === 'Todos' || p.category === category)
                    .map(product => {
                      const imageUrl = product.image_path 
                        ? supabase.storage.from('product-images').getPublicUrl(product.image_path).data.publicUrl
                        : 'https://images.unsplash.com/photo-1700952633119-fb79919833f6';
                      
                      return (
                        <div
                          key={product.id}
                          className={`bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden transition-all flex flex-col ${isOutsideArea ? 'opacity-75 grayscale-[0.5]' : 'hover:shadow-xl'}`}
                        >
                          <div className="aspect-video bg-stone-200 overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-xl font-bold text-stone-800">
                                {product.name}
                              </h3>
                              {category === 'Todos' && (
                                <Badge variant="outline" className="text-xs text-stone-500">
                                  {product.category}
                                </Badge>
                              )}
                            </div>
                            {product.description && (
                              <p className="text-stone-600 text-sm mb-4 line-clamp-2 flex-1">
                                {product.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-100">
                              <span className="text-2xl font-bold text-amber-600">
                                R$ {product.price?.toFixed(2)}
                              </span>
                              <Button 
                                onClick={() => addToCart(product)} 
                                className="gap-2"
                                disabled={!tableNumber || isOutsideArea}
                              >
                                <Plus className="w-4 h-4" />
                                Adicionar
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                {products.filter(p => category === 'Todos' || p.category === category).length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-stone-500 text-lg">
                      Nenhum produto disponível nesta categoria
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <TableSelectionModal 
          isOpen={isTableModalOpen} 
          onSelectTable={handleTableDetected} 
        />

        <ShoppingCart
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onCheckout={handleInitiateCheckout}
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
        />

        <OrderCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          cart={cart}
          tableNumber={tableNumber}
          onSuccess={handleCheckoutSuccess}
        />

        <RequestToWaiter
          tableNumber={tableNumber}
          isOpen={waiterRequestOpen}
          onClose={() => setWaiterRequestOpen(false)}
        />
      </div>
    </>
  );
};

export default MenuPage;