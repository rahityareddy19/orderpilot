import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, Loader2, RefreshCw, X, CheckCircle2, AlertCircle, Edit2, Trash2, Phone, MapPin } from 'lucide-react';
import api from '../../api';
import { useApp } from '../../context/AppContext';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function OwnerOrders() {
  const { fetchPartners } = useApp();
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal State for New Order
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // New order form – phone-based
  const [orderForm, setOrderForm] = useState({
    id: '',
    phoneNumber: '',
    customerName: '',
    customerAddress: '',
    customerLookupStatus: null, // null | 'found' | 'not-found' | 'loading'
    items: '',
    amount: '',
    priority: 'normal',
    estimatedDelivery: '',
    partnerId: ''
  });

  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');
  const phoneInputRef = useRef(null);
  const lookupTimeout = useRef(null);

  const resetForm = () => {
    setOrderForm({
      id: '', phoneNumber: '', customerName: '', customerAddress: '',
      customerLookupStatus: null, items: '', amount: '', priority: 'normal',
      estimatedDelivery: '', partnerId: ''
    });
    setModalError('');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, partnersList] = await Promise.all([
        api.get('/orders'),
        fetchPartners()
      ]);
      setOrders(ordersRes.data?.orders || []);
      setPartners(partnersList || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Phone number lookup – fires 600ms after user stops typing
  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    setOrderForm(f => ({ ...f, phoneNumber: phone, customerName: '', customerAddress: '', customerLookupStatus: null }));

    clearTimeout(lookupTimeout.current);
    if (phone.length >= 10) {
      setOrderForm(f => ({ ...f, customerLookupStatus: 'loading' }));
      lookupTimeout.current = setTimeout(async () => {
        try {
          const res = await api.get(`/auth/customer-lookup?phone=${encodeURIComponent(phone.trim())}`);
          const match = res.data?.customer;
          if (match) {
            setOrderForm(f => ({
              ...f,
              customerName: match.name,
              customerAddress: match.address || '',
              customerLookupStatus: 'found'
            }));
          } else {
            setOrderForm(f => ({ ...f, customerName: '', customerAddress: '', customerLookupStatus: 'not-found' }));
          }
        } catch (err) {
          // 404 means customer not found; any other error also shows not-found UI
          setOrderForm(f => ({ ...f, customerName: '', customerAddress: '', customerLookupStatus: 'not-found' }));
        }
      }, 600);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.phoneNumber || !orderForm.items || !orderForm.amount) {
      setModalError('Please fill in all required fields.');
      return;
    }
    if (orderForm.customerLookupStatus === 'not-found') {
      setModalError('No registered customer found for this phone number. Please ask the customer to register first.');
      return;
    }
    if (orderForm.customerLookupStatus !== 'found' && !isEditing) {
      setModalError('Please enter a valid phone number and wait for the customer lookup.');
      return;
    }

    setModalError('');
    setCreating(true);

    try {
      const payload = {
        id: orderForm.id ? orderForm.id.trim().toUpperCase() : undefined,
        phoneNumber: orderForm.phoneNumber.trim(),
        items: orderForm.items.split(',').map(s => s.trim()).filter(Boolean),
        amount: parseFloat(orderForm.amount),
        priority: orderForm.priority,
        partner_id: orderForm.partnerId ? parseInt(orderForm.partnerId, 10) : null,
        ...(orderForm.estimatedDelivery && { estimated_delivery: orderForm.estimatedDelivery })
      };

      if (isEditing) {
        const res = await api.put(`/orders/${orderForm.id}`, payload);
        if (res.data?.order) {
          setOrders(orders.map(o => o.id === res.data.order.id ? res.data.order : o));
          setShowModal(false);
          resetForm();
          setIsEditing(false);
          setSuccessMessage('Order updated successfully!');
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      } else {
        const res = await api.post('/orders', payload);
        if (res.data?.order) {
          setOrders([res.data.order, ...orders]);
          setShowModal(false);
          resetForm();
          setSuccessMessage('Order created successfully! AI assignment workflow has been triggered.');
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
    setOrderForm({
      id: order.id,
      phoneNumber: order.customerPhone || '',
      customerName: order.customer || '',
      customerAddress: order.address || '',
      customerLookupStatus: order.customerPhone ? 'found' : null,
      items: Array.isArray(order.items) ? order.items.join(', ') : (order.items || ''),
      amount: order.amount || '',
      priority: order.priority || 'normal',
      estimatedDelivery: order.estimated_delivery || '',
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
        (order.customer || '').toLowerCase().includes(query.toLowerCase()) ||
        (order.customerPhone || '').includes(query);
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const statuses = ['all', 'processing', 'in-transit', 'delayed', 'delivered', 'cancelled'];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const shortAddress = (addr) => {
    if (!addr) return '—';
    const parts = addr.split(',');
    return parts.length > 2 ? parts.slice(0, 2).join(',').trim() + '…' : addr;
  };

  return (
    <div>
      <Header
        title="Orders"
        description="View, search, and manage all delivery orders"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 bg-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Button icon={Plus} size="sm" onClick={() => { setIsEditing(false); resetForm(); setShowModal(true); }}>
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
                placeholder="Search by order ID, customer name, or phone..."
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
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Address</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Items</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => {
                  const itemsList = Array.isArray(order.items) ? order.items : [];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{order.id}</td>
                      <td className="px-5 py-3.5 text-slate-700">{order.customer || '—'}</td>
                      <td className="px-5 py-3.5">
                        {order.customerPhone ? (
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {order.customerPhone}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[160px]">
                        <span className="flex items-start gap-1" title={order.address}>
                          <MapPin className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                          {shortAddress(order.address)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-[180px] truncate">{itemsList.join(', ')}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-3.5"><PriorityBadge priority={order.priority} /></td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {formatDate(order.estimated_delivery || order.estimatedDelivery)}
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

      {/* Add / Edit Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">{isEditing ? 'Edit Order' : 'Create New Order'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Order ID (optional) */}
              {!isEditing && (
                <Input
                  label="Order ID (Optional, e.g. ORD-2025)"
                  placeholder="Leave blank to auto-generate"
                  value={orderForm.id}
                  onChange={(e) => setOrderForm(f => ({ ...f, id: e.target.value }))}
                />
              )}

              {/* Phone Number – primary customer identifier */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Customer Phone Number *
                </label>
                <div className="relative">
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    placeholder="Enter customer's 10-digit phone number"
                    value={orderForm.phoneNumber}
                    onChange={handlePhoneChange}
                    disabled={isEditing}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    required
                  />
                  {orderForm.customerLookupStatus === 'loading' && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
                  )}
                </div>

                {/* Lookup feedback */}
                {orderForm.customerLookupStatus === 'found' && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Customer found: <span className="font-bold">{orderForm.customerName}</span>
                    </div>
                    {orderForm.customerAddress && (
                      <div className="flex items-start gap-1.5 mt-1.5 text-xs text-emerald-600">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>Address copied: {orderForm.customerAddress}</span>
                      </div>
                    )}
                    <p className="text-xs text-emerald-500 mt-1">Delivery address will be automatically copied from this customer's profile.</p>
                  </div>
                )}

                {orderForm.customerLookupStatus === 'not-found' && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      No registered customer found for this phone number.
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      Please ask the customer to register at <strong>/register</strong> first with their phone number and address. Orders can only be created for registered customers.
                    </p>
                  </div>
                )}
              </div>

              {/* Items */}
              <Input
                label="Items (Comma separated) *"
                placeholder="e.g. Wireless Headset, Mouse Pad"
                value={orderForm.items}
                onChange={(e) => setOrderForm(f => ({ ...f, items: e.target.value }))}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                {/* Amount */}
                <Input
                  label="Amount (₹) *"
                  type="number"
                  placeholder="e.g. 1499"
                  value={orderForm.amount}
                  onChange={(e) => setOrderForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                  <select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Estimated Delivery */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Estimated Delivery Date</label>
                <input
                  type="date"
                  value={orderForm.estimatedDelivery}
                  onChange={(e) => setOrderForm(f => ({ ...f, estimatedDelivery: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Assign Partner */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign Delivery Partner</label>
                <select
                  value={orderForm.partnerId}
                  onChange={(e) => setOrderForm(f => ({ ...f, partnerId: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned (AI will auto-assign)</option>
                  {partners.map((p) => (
                    <option key={p.id || p.userId} value={p.id || p.userId}>
                      {p.name} ({p.phone_number || p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="secondary" size="sm" type="button" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={creating || (!isEditing && orderForm.customerLookupStatus !== 'found')}
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                  {isEditing ? 'Save Changes' : 'Save Order'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
