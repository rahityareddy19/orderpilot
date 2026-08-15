import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Loader2, RefreshCw, X, CheckCircle2, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import api from '../../api';
import { useApp } from '../../context/AppContext';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function OwnerOrders() {
  const { fetchPartners, fetchCustomers } = useApp();
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal State for New Order
  const [showModal, setShowModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    id: '',
    customerId: '',
    address: '',
    items: '',
    amount: '',
    priority: 'normal',
    partnerId: ''
  });
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const loadOrdersAndPartners = async () => {
    setLoading(true);
    try {
      const [ordersRes, partnersList, customersList] = await Promise.all([
        api.get('/orders'),
        fetchPartners(),
        fetchCustomers()
      ]);
      setOrders(ordersRes.data?.orders || []);
      setPartners(partnersList || []);
      setCustomers(customersList || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdersAndPartners();
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.customerId || !newOrder.address || !newOrder.items || !newOrder.amount) {
      setModalError('Please fill in all required fields.');
      return;
    }

    setModalError('');
    setCreating(true);

    try {
      const payload = {
        id: newOrder.id ? newOrder.id.trim().toUpperCase() : undefined,
        customerId: parseInt(newOrder.customerId, 10),
        address: newOrder.address.trim(),
        items: newOrder.items.split(',').map(s => s.trim()).filter(Boolean),
        amount: parseFloat(newOrder.amount),
        priority: newOrder.priority,
        partner_id: newOrder.partnerId ? parseInt(newOrder.partnerId, 10) : null
      };

      if (isEditing) {
        const res = await api.put(`/orders/${payload.id}`, payload);
        if (res.data?.order) {
          setOrders(orders.map(o => o.id === res.data.order.id ? res.data.order : o));
          setShowModal(false);
          setNewOrder({ id: '', customerId: '', address: '', items: '', amount: '', priority: 'normal', partnerId: '' });
          setIsEditing(false);
          setSuccessMessage('Order updated successfully!');
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      } else {
        const res = await api.post('/orders', payload);
        if (res.data?.order) {
          setOrders([res.data.order, ...orders]);
          setShowModal(false);
          setNewOrder({ id: '', customerId: '', address: '', items: '', amount: '', priority: 'normal', partnerId: '' });
          setSuccessMessage('Order created successfully! The AI assignment workflow has been triggered.');
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      }
    } catch (err) {
      setModalError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} order.`);
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (order) => {
    setNewOrder({
      id: order.id,
      customerId: order.customerId || order.customer_id || '',
      address: order.address || '',
      items: Array.isArray(order.items) ? order.items.join(', ') : order.items,
      amount: order.amount,
      priority: order.priority || 'normal',
      partnerId: order.partner_id || order.delivery_partner_id || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders(orders.filter(o => o.id !== orderId));
      setSuccessMessage('Order deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesQuery =
        !query ||
        order.id.toLowerCase().includes(query.toLowerCase()) ||
        order.customer.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const statuses = ['all', 'processing', 'in-transit', 'delayed', 'delivered', 'cancelled'];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div>
      <Header
        title="Orders"
        description="View, search, and manage all delivery orders"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadOrdersAndPartners}
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 bg-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Button icon={Plus} size="sm" onClick={() => { setIsEditing(false); setNewOrder({ id: '', customerId: '', address: '', items: '', amount: '', priority: 'normal', partnerId: '' }); setShowModal(true); }}>
              Add Order
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by order ID or customer name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => {
                  const itemsList = Array.isArray(order.items) ? order.items : [];
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {order.id}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {order.customer}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate">
                        {itemsList.join(', ')}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={order.priority} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {order.partner || order.partner_name || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {formatDate(order.placedAt || order.placed_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-900 font-medium">
                        ₹{(order.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button onClick={() => handleEditClick(order)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit Order">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(order.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors ml-1" title="Delete Order">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && !loading && (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">No orders match your search.</p>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading orders...</p>
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-400 text-right">
          Showing {filtered.length} of {orders.length} orders
        </p>
      </div>

      {/* Add Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">{isEditing ? 'Edit Order' : 'Create New Order'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-3.5">
              <Input
                label="Order ID (Optional, e.g. ORD-1025)"
                placeholder="Leave blank to auto-generate"
                value={newOrder.id}
                onChange={(e) => setNewOrder({ ...newOrder, id: e.target.value })}
                disabled={isEditing}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Name *</label>
                <select
                  value={newOrder.customerId}
                  onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((c) => (
                    <option key={c.id || c.userId} value={c.id || c.userId}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Delivery Address *"
                placeholder="e.g. 12, Indiranagar 100ft Road, Bangalore"
                value={newOrder.address}
                onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                required
              />

              <Input
                label="Items (Comma separated) *"
                placeholder="e.g. Wireless Headset, Mouse Pad"
                value={newOrder.items}
                onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount (₹) *"
                  type="number"
                  placeholder="e.g. 1499"
                  value={newOrder.amount}
                  onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign Delivery Partner</label>
                <select
                  value={newOrder.partnerId}
                  onChange={(e) => setNewOrder({ ...newOrder, partnerId: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Unassigned</option>
                  {partners.map((p) => (
                    <option key={p.id || p.userId} value={p.id || p.userId}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />} {isEditing ? 'Save Changes' : 'Save Order'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
