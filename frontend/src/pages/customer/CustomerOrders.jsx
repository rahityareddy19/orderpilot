import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, RefreshCw, Loader2, MapPin, Edit2, X, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import api from '../../api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Input from '../../components/Input';

const EDITABLE_STATUSES = ['processing', 'pending', 'confirmed'];
const LOCKED_STATUSES = ['in-transit', 'delayed', 'delivered', 'cancelled'];

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Address edit state
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editAddress, setEditAddress] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState(null);
  const [lockedMessage, setLockedMessage] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data?.orders || []);
    } catch (err) {
      console.error('Error loading customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleEditAddressClick = (order) => {
    if (LOCKED_STATUSES.includes(order.status)) {
      setLockedMessage({ orderId: order.id, text: 'This order is already being delivered or completed, so its address can no longer be changed.' });
      setTimeout(() => setLockedMessage(null), 5000);
      return;
    }
    setEditingOrderId(order.id);
    setEditAddress(order.address || '');
    setAddressMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setEditAddress('');
    setAddressMessage(null);
  };

  const handleSaveAddress = async (orderId) => {
    if (!editAddress.trim() || editAddress.trim().length < 5) {
      setAddressMessage({ type: 'error', text: 'Address must be at least 5 characters.' });
      return;
    }
    setSavingAddress(true);
    setAddressMessage(null);
    try {
      const res = await api.patch(`/orders/${orderId}/address`, { address: editAddress.trim() });
      setOrders(orders.map(o => o.id === orderId ? { ...o, address: res.data?.order?.address || editAddress.trim() } : o));
      setAddressMessage({ type: 'success', text: 'Delivery address updated successfully!' });
      setTimeout(() => {
        setEditingOrderId(null);
        setAddressMessage(null);
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update address.';
      setAddressMessage({ type: 'error', text: msg });
    } finally {
      setSavingAddress(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const isEditable = (status) => EDITABLE_STATUSES.includes(status);

  return (
    <div>
      <Header
        title="My Orders"
        description="View all your past and active order shipments"
        actions={
          <button
            onClick={fetchOrders}
            className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 bg-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {lockedMessage && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-sm text-amber-800">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{lockedMessage.text}</span>
            <button onClick={() => setLockedMessage(null)} className="ml-auto text-amber-400 hover:text-amber-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {orders.length === 0 && !loading ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-500 text-sm">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            No orders found in your account history.
          </div>
        ) : loading ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" />
            Loading orders...
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const itemsList = Array.isArray(o.items) ? o.items : [];
              const editable = isEditable(o.status);
              const isEditing = editingOrderId === o.id;

              return (
                <div key={o.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Order Header */}
                  <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">{o.id}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Placed: {formatDate(o.placedAt || o.placed_at)}</span>
                      <span>Est. Delivery: {formatDate(o.estimatedDelivery || o.estimated_delivery)}</span>
                      <span className="font-semibold text-slate-700">₹{(o.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="px-5 py-4 grid sm:grid-cols-2 gap-4">
                    {/* Items */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Items</p>
                      <p className="text-sm text-slate-800">{itemsList.join(', ') || 'Item parcel'}</p>
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Delivery Address
                        {editable && !isEditing && (
                          <button
                            onClick={() => handleEditAddressClick(o)}
                            className="ml-auto flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
                            title="Edit delivery address"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}
                        {!editable && (
                          <span className="ml-auto flex items-center gap-1 text-slate-400 text-xs">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </p>

                      {isEditing ? (
                        <div className="space-y-2">
                          {addressMessage && (
                            <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${addressMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                              {addressMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                              <span>{addressMessage.text}</span>
                            </div>
                          )}
                          <Input
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="Enter new delivery address"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveAddress(o.id)} disabled={savingAddress}>
                              {savingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                              Save
                            </Button>
                            <Button size="sm" variant="secondary" onClick={handleCancelEdit} disabled={savingAddress}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700">{o.address || '—'}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <Link to={`/track-order/${o.id}`}>
                      <Button size="sm" variant="secondary" icon={Search}>
                        Track Order
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
