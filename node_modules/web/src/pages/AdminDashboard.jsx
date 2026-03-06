import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header.jsx';
import ProductForm from '@/components/ProductForm.jsx';
import TableManagementTab from '@/components/TableManagementTab.jsx';
import FinancialTab from '@/components/FinancialTab.jsx';
import WaiterTab from '@/components/WaiterTab.jsx';
import ConfiguracoesTab from '@/components/ConfiguracoesTab.jsx';
import PaymentModal from '@/components/PaymentModal.jsx';
import { Plus, Edit, Trash2, Check, X, CreditCard, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useNotificationSound } from '@/hooks/useNotificationSound.js';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [viewComandaOpen, setViewComandaOpen] = useState(false);
  const [selectedComandaDetails, setSelectedComandaDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { playNotificationSound } = useNotificationSound();

  useEffect(() => {
    fetchAllData();

    const ordersSubscription = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new, ...prev]);
            playNotificationSound();
            toast({
              title: "Novo Pedido!",
              description: `Mesa ${payload.new.table_number} - ${payload.new.customer_name}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? payload.new : o))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const comandasSubscription = supabase
      .channel('comandas_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comandas' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchComandaDetails(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.paid) {
              setComandas((prev) => prev.filter((c) => c.id !== payload.new.id));
            } else {
              fetchComandaDetails(payload.new);
            }
          } else if (payload.eventType === 'DELETE') {
            setComandas((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      comandasSubscription.unsubscribe();
    };
  }, [playNotificationSound, toast]);

  const fetchComandaDetails = async (comanda) => {
    try {
      // Buscar os pedidos desta comanda
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .in('id', comanda.orders_ids || []);

      if (error) throw error;

      const comandaCompleta = {
        ...comanda,
        orders: ordersData || []
      };

      setComandas((prev) => {
        const filtered = prev.filter(c => c.id !== comanda.id);
        return [comandaCompleta, ...filtered];
      });
    } catch (error) {
      console.error('Error fetching comanda details:', error);
    }
  };

  const fetchAllData = async () => {
    try {
      const [productsData, ordersData, comandasData] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('comandas').select('*').eq('paid', false),
      ]);

      if (productsData.error) throw productsData.error;
      if (ordersData.error) throw ordersData.error;
      if (comandasData.error) throw comandasData.error;

      setProducts(productsData.data || []);
      setOrders(ordersData.data || []);

      // Buscar detalhes de cada comanda
      const comandasComDetalhes = await Promise.all(
        (comandasData.data || []).map(async (comanda) => {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('*')
            .in('id', comanda.orders_ids || []);
          return {
            ...comanda,
            orders: ordersData || []
          };
        })
      );

      setComandas(comandasComDetalhes);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('image_path')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      if (product?.image_path) {
        await supabase.storage.from('product-images').remove([product.image_path]);
      }

      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;

      toast({
        title: "Produto excluído!",
        description: "O produto foi removido do cardápio",
      });
      fetchAllData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive"
      });
    }
  };

  const handleAcceptOrder = async (order) => {
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'aceito' })
        .eq('id', order.id);
      if (updateError) throw updateError;

      const { data: existingComandas, error: fetchError } = await supabase
        .from('comandas')
        .select('*')
        .eq('table_number', order.table_number)
        .eq('paid', false);

      if (fetchError) throw fetchError;

      if (existingComandas && existingComandas.length > 0) {
        const comanda = existingComandas[0];
        const newOrdersIds = [...(comanda.orders_ids || []), order.id];
        const newTotal = (comanda.total_value || 0) + order.total_value;

        const { error: updateComandaError } = await supabase
          .from('comandas')
          .update({
            orders_ids: newOrdersIds,
            total_value: newTotal,
          })
          .eq('id', comanda.id);
        if (updateComandaError) throw updateComandaError;
      } else {
        const { error: insertError } = await supabase.from('comandas').insert([
          {
            table_number: order.table_number,
            orders_ids: [order.id],
            total_value: order.total_value,
            paid: false,
          },
        ]);
        if (insertError) throw insertError;
      }

      toast({
        title: "Pedido aceito!",
        description: "O pedido foi adicionado à comanda",
      });
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o pedido",
        variant: "destructive"
      });
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!window.confirm('Tem certeza que deseja rejeitar este pedido?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'rejeitado' })
        .eq('id', orderId);
      if (error) throw error;
      toast({
        title: "Pedido rejeitado",
        description: "O pedido foi marcado como rejeitado",
      });
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o pedido",
        variant: "destructive"
      });
    }
  };

  const openPaymentModal = (comanda) => {
    setSelectedComanda(comanda);
    setPaymentModalOpen(true);
  };

  const viewComandaDetails = (comanda) => {
    setSelectedComandaDetails(comanda);
    setViewComandaOpen(true);
  };

  // Função para agrupar itens iguais
  const agruparItens = (orders) => {
    const itensAgrupados = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        const chave = `${item.name}`;
        if (itensAgrupados[chave]) {
          itensAgrupados[chave].quantidade += item.quantity;
          itensAgrupados[chave].total += item.price * item.quantity;
        } else {
          itensAgrupados[chave] = {
            nome: item.name,
            quantidade: item.quantity,
            precoUnitario: item.price,
            total: item.price * item.quantity
          };
        }
      });
    });

    return Object.values(itensAgrupados);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Painel Administrativo - Restaurante</title>
        <meta name="description" content="Gerencie produtos, pedidos e comandas do restaurante" />
      </Helmet>

      <div className="min-h-screen bg-stone-50">
        <Header />

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-stone-800 mb-8">Painel Administrativo</h1>

          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="flex flex-wrap w-full justify-start mb-8 h-auto gap-2">
              <TabsTrigger value="orders">
                Pedidos
                {orders.filter(o => o.status === 'pendente').length > 0 && (
                  <Badge className="ml-2 bg-red-500 animate-pulse">
                    {orders.filter(o => o.status === 'pendente').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="comandas">Comandas</TabsTrigger>
              <TabsTrigger value="waiter">Chamados</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="tables">Mesas</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
                <h2 className="text-2xl font-bold text-stone-800 mb-6">Pedidos Recebidos</h2>

                <div className="space-y-4">
                  {orders.filter(o => o.status === 'pendente').map(order => (
                    <div key={order.id} className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="secondary" className="mb-2 text-lg px-3 py-1">Mesa {order.table_number}</Badge>
                          <h3 className="font-bold text-xl text-stone-800">{order.customer_name}</h3>
                          {order.number_of_people && (
                            <p className="text-sm text-stone-600 font-medium">Pessoas: {order.number_of_people}</p>
                          )}
                          <p className="text-sm text-stone-500">
                            {new Date(order.created_at).toLocaleString('pt-BR')}
                          </p>
                          {order.notes && (
                            <div className="mt-2 p-2 bg-white/60 rounded border border-amber-100 text-sm text-stone-700">
                              <span className="font-semibold">Obs:</span> {order.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-600">
                            R$ {order.total_value?.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold text-stone-700 mb-2">Itens:</h4>
                        <ul className="space-y-1 bg-white/50 p-3 rounded-md">
                          {order.items?.map((item, idx) => (
                            <li key={idx} className="text-stone-800 font-medium flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-stone-500 font-normal">R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={() => handleAcceptOrder(order)} className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white">
                          <Check className="w-5 h-5" />
                          Aceitar Pedido
                        </Button>
                        <Button onClick={() => handleRejectOrder(order.id)} variant="destructive" className="flex-1 gap-2">
                          <X className="w-5 h-5" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))}

                  {orders.filter(o => o.status === 'pendente').length === 0 && (
                    <div className="text-center py-16 bg-stone-50 rounded-lg border border-dashed border-stone-300">
                      <p className="text-stone-500 text-lg">Nenhum pedido pendente no momento.</p>
                      <p className="text-stone-400 text-sm mt-2">Aguardando novos pedidos...</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comandas">
              <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
                <h2 className="text-2xl font-bold text-stone-800 mb-6">Comandas Ativas por Mesa</h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comandas.filter(c => !c.paid).map(comanda => {
                    const itensAgrupados = agruparItens(comanda.orders || []);
                    const clientes = [...new Set((comanda.orders || []).map(o => o.customer_name))].join(', ');
                    
                    return (
                      <div key={comanda.id} className="p-5 bg-stone-50 rounded-xl border border-stone-200 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <Badge className="text-lg px-3 py-1 bg-stone-800">Mesa {comanda.table_number}</Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewComandaDetails(comanda)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <p className="text-sm font-medium text-stone-500">
                              {comanda.orders?.length || 0} pedido(s)
                            </p>
                          </div>
                        </div>
                        
                        {clientes && (
                          <p className="text-sm text-stone-600 mb-2">
                            <span className="font-semibold">Cliente(s):</span> {clientes}
                          </p>
                        )}

                        <div className="mb-4 flex-1 max-h-32 overflow-y-auto">
                          <p className="text-sm font-semibold text-stone-700 mb-1">Itens:</p>
                          <ul className="text-sm space-y-1">
                            {itensAgrupados.map((item, idx) => (
                              <li key={idx} className="flex justify-between text-stone-600">
                                <span>{item.quantidade}x {item.nome}</span>
                                <span className="font-medium text-stone-800">R$ {item.total.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-stone-500 mb-1">Total da Comanda</p>
                          <p className="text-3xl font-bold text-amber-600">
                            R$ {comanda.total_value?.toFixed(2)}
                          </p>
                        </div>

                        <Button onClick={() => openPaymentModal(comanda)} className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                          <CreditCard className="w-4 h-4" />
                          Marcar como Pago
                        </Button>
                      </div>
                    );
                  })}

                  {comandas.filter(c => !c.paid).length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <p className="text-stone-500 text-lg">Nenhuma comanda ativa no momento.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="waiter">
              <WaiterTab />
            </TabsContent>

            <TabsContent value="products">
              <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-stone-800">Gerenciar Produtos</h2>
                  <Button onClick={() => { setEditingProduct(null); setProductFormOpen(true); }} className="gap-2">
                    <Plus className="w-5 h-5" />
                    Adicionar Produto
                  </Button>
                </div>

                <div className="space-y-4">
                  {products.map(product => {
                    const imageUrl = product.image_path 
                      ? supabase.storage.from('product-images').getPublicUrl(product.image_path).data.publicUrl
                      : null;
                    
                    return (
                      <div key={product.id} className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
                        <div className="w-20 h-20 bg-stone-200 rounded-lg overflow-hidden flex-shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              Sem imagem
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-stone-800">{product.name}</h3>
                          <p className="text-sm text-stone-600">{product.category}</p>
                          <p className="text-amber-600 font-semibold mt-1">R$ {product.price?.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingProduct(product); setProductFormOpen(true); }}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tables">
              <TableManagementTab />
            </TabsContent>

            <TabsContent value="financeiro">
              <FinancialTab />
            </TabsContent>

            <TabsContent value="configuracoes">
              <ConfiguracoesTab />
            </TabsContent>
          </Tabs>
        </div>

        <ProductForm
          isOpen={productFormOpen}
          onClose={() => setProductFormOpen(false)}
          product={editingProduct}
          onSuccess={fetchAllData}
        />

        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          comanda={selectedComanda}
          onSuccess={fetchAllData}
        />

        {/* Modal de Detalhes da Comanda */}
        <Dialog open={viewComandaOpen} onOpenChange={setViewComandaOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-stone-800">
                Detalhes da Comanda - Mesa {selectedComandaDetails?.table_number}
              </DialogTitle>
            </DialogHeader>

            {selectedComandaDetails && (
              <div className="space-y-6">
                {/* Informações dos clientes */}
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <h3 className="font-semibold text-stone-800 mb-3">Clientes na Mesa:</h3>
                  <div className="space-y-2">
                    {selectedComandaDetails.orders?.map((order, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-stone-700">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        <span className="font-medium">{order.customer_name}</span>
                        <span className="text-xs text-stone-500">
                          {new Date(order.created_at).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lista de itens agrupados */}
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                  <h3 className="font-semibold text-stone-800 mb-3">Itens Pedidos:</h3>
                  <div className="space-y-2">
                    {agruparItens(selectedComandaDetails.orders || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-stone-200 last:border-0">
                        <div>
                          <span className="font-bold text-lg text-stone-800">{item.quantidade}x</span>
                          <span className="ml-2 text-stone-700">{item.nome}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-stone-500 block">R$ {item.precoUnitario.toFixed(2)} cada</span>
                          <span className="font-semibold text-amber-600">R$ {item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-stone-800">Total da Comanda:</span>
                    <span className="text-2xl font-bold text-amber-600">
                      R$ {selectedComandaDetails.total_value?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Observações */}
                {selectedComandaDetails.orders?.some(o => o.notes) && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Observações:</h3>
                    {selectedComandaDetails.orders.map((order, idx) => (
                      order.notes && (
                        <div key={idx} className="text-sm text-blue-700 mb-1">
                          <span className="font-medium">{order.customer_name}:</span> {order.notes}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default AdminDashboard;