import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import DashboardLayout from './components/DashboardLayout';
import Landing from './pages/Landing';
import TrackOrder from './pages/TrackOrder';
import OrderDetails from './pages/OrderDetails';
import ReportIssue from './pages/ReportIssue';
import Login from './pages/Login';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerOrders from './pages/owner/OwnerOrders';
import OwnerComplaints from './pages/owner/OwnerComplaints';
import PartnerDashboard from './pages/partner/PartnerDashboard';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/track-order/:orderId" element={<OrderDetails />} />
          <Route path="/report-issue" element={<ReportIssue />} />
          <Route path="/login" element={<Login />} />

          {/* Owner Routes */}
          <Route path="/owner" element={<DashboardLayout />}>
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="orders" element={<OwnerOrders />} />
            <Route path="complaints" element={<OwnerComplaints />} />
          </Route>

          {/* Partner Routes */}
          <Route path="/partner" element={<DashboardLayout />}>
            <Route path="dashboard" element={<PartnerDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
