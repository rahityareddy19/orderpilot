import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, RefreshCw, Loader2 } from 'lucide-react';
import api from '../../api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => {
                  const itemsList = Array.isArray(o.items) ? o.items : [];
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{o.id}</td>
                      <td className="px-5 py-3.5 text-slate-600">{itemsList.join(', ') || 'Item parcel'}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{o.current_location || o.address}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/track-order/${o.id}`}>
                          <Button size="sm" variant="secondary" icon={Search}>
                            Track Order
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-500 text-sm">
              No orders found in your account history.
            </div>
          )}

          {loading && (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" /> Loading orders...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
