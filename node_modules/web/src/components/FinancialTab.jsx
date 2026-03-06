import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

const FinancialTab = () => {
  const [comandas, setComandas] = useState([]);
  const [orders, setOrders] = useState({}); // Mapa de orderId -> order
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('hoje');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('todos');
  const { toast } = useToast();

  useEffect(() => {
    fetchComandas();
  }, [filterType, customStartDate, customEndDate, paymentFilter]);

  const fetchComandas = async () => {
    setLoading(true);
    try {
      let query = supabase.from('comandas').select('*').eq('paid', true);

      const now = new Date();
      let start = new Date();
      let end = new Date();

      if (filterType === 'hoje') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (filterType === 'mes') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (filterType === 'custom' && customStartDate && customEndDate) {
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
      }

      if (filterType !== 'custom' || (customStartDate && customEndDate)) {
        query = query.gte('data_pagamento', start.toISOString()).lte('data_pagamento', end.toISOString());
      }

      if (paymentFilter !== 'todos') {
        query = query.eq('forma_pagamento', paymentFilter);
      }

      const { data: comandasData, error: comandasError } = await query.order('data_pagamento', { ascending: false });

      if (comandasError) throw comandasError;

      // Buscar todos os pedidos relacionados
      const allOrderIds = comandasData?.flatMap(c => c.orders_ids || []) || [];
      if (allOrderIds.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('id', allOrderIds);
        if (ordersError) throw ordersError;

        const ordersMap = {};
        ordersData?.forEach(order => {
          ordersMap[order.id] = order;
        });
        setOrders(ordersMap);
      } else {
        setOrders({});
      }

      setComandas(comandasData || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados financeiros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = comandas.reduce((sum, c) => sum + (c.total_value || 0), 0);
    const orderCount = comandas.length;
    const averageTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

    return { totalRevenue, orderCount, averageTicket };
  }, [comandas]);

  // Função para formatar itens de pedido de forma legível
  const formatOrderItems = (order) => {
    if (!order || !order.items) return '';
    // Agrupar por nome para evitar repetição
    const itemMap = {};
    order.items.forEach(item => {
      const key = item.name;
      if (itemMap[key]) {
        itemMap[key] += item.quantity;
      } else {
        itemMap[key] = item.quantity;
      }
    });
    return Object.entries(itemMap)
      .map(([name, qty]) => `${qty} ${name}${qty > 1 ? 's' : ''}`)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Filters (igual) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-wrap items-end gap-4">
        <div className="space-y-1 min-w-[200px]">
          <Label>Período</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="custom">Período Customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filterType === 'custom' && (
          <>
            <div className="space-y-1">
              <Label>Data Inicial</Label>
              <Input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Data Final</Label>
              <Input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="space-y-1 min-w-[200px]">
          <Label>Forma de Pagamento</Label>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
              <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
              <SelectItem value="Dinheiro">Dinheiro</SelectItem>
              <SelectItem value="PIX">PIX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-500">Carregando dados financeiros...</div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-600">Receita Total</p>
                  <p className="text-2xl font-bold text-stone-800">
                    R$ {stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-600">Comandas Pagas</p>
                  <p className="text-2xl font-bold text-stone-800">
                    {stats.orderCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-stone-800">
                    R$ {stats.averageTicket.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de comandas com detalhes */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-800">Histórico de Comandas Pagas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Data Pagamento</th>
                    <th className="px-6 py-3 font-medium">Mesa</th>
                    <th className="px-6 py-3 font-medium">Cliente(s)</th>
                    <th className="px-6 py-3 font-medium">Itens</th>
                    <th className="px-6 py-3 font-medium">Forma de Pagamento</th>
                    <th className="px-6 py-3 font-medium text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {comandas.length > 0 ? (
                    comandas.map((comanda) => {
                      // Obter os pedidos desta comanda
                      const comandaOrders = (comanda.orders_ids || [])
                        .map(id => orders[id])
                        .filter(Boolean);

                      // Nomes dos clientes (único por pedido)
                      const customerNames = [...new Set(comandaOrders.map(o => o.customer_name))].join(', ');

                      // Itens agregados
                      const itemsSummary = {};
                      comandaOrders.forEach(order => {
                        order.items?.forEach(item => {
                          const key = item.name;
                          if (itemsSummary[key]) {
                            itemsSummary[key] += item.quantity;
                          } else {
                            itemsSummary[key] = item.quantity;
                          }
                        });
                      });
                      const itemsList = Object.entries(itemsSummary)
                        .map(([name, qty]) => `${qty} ${name}${qty > 1 ? 's' : ''}`)
                        .join(', ');

                      return (
                        <tr key={comanda.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4 text-stone-600">
                            {comanda.data_pagamento ? new Date(comanda.data_pagamento).toLocaleString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                              {comanda.table_number}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-stone-800">
                            {customerNames || '-'}
                          </td>
                          <td className="px-6 py-4 text-stone-600 max-w-xs truncate" title={itemsList}>
                            {itemsList || '-'}
                          </td>
                          <td className="px-6 py-4 text-stone-600">
                            {comanda.forma_pagamento || '-'}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-stone-800">
                            R$ {comanda.total_value?.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-stone-500">
                        Nenhuma comanda paga encontrada neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialTab;