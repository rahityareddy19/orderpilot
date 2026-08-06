import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import TrackOrder from './pages/TrackOrder';
import OrderDetails from './pages/OrderDetails';
import ReportIssue from './pages/ReportIssue';
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerComplaints from './pages/customer/CustomerComplaints';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerOrders from './pages/owner/OwnerOrders';
import OwnerComplaints from './pages/owner/OwnerComplaints';
import OwnerTasks from './pages/owner/OwnerTasks';
import AIInsights from './pages/owner/AIInsights';
import ActivityTimeline from './pages/owner/ActivityTimeline';

// Delivery Partner Pages
import PartnerDashboard from './pages/partner/PartnerDashboard';

// Shared Pages
import Profile from './pages/shared/Profile';
import Settings from './pages/shared/Settings';
import NotFound from './pages/shared/NotFound';

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
          <Route path="/submit-complaint" element={<ReportIssue />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute allowedRole="customer" />}>
            <Route path="/customer" element={<DashboardLayout />}>
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="orders" element={<CustomerOrders />} />
              <Route path="complaints" element={<CustomerComplaints />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Protected Owner Routes */}
          <Route element={<ProtectedRoute allowedRole="owner" />}>
            <Route path="/owner" element={<DashboardLayout />}>
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="orders" element={<OwnerOrders />} />
              <Route path="complaints" element={<OwnerComplaints />} />
              <Route path="tasks" element={<OwnerTasks />} />
              <Route path="insights" element={<AIInsights />} />
              <Route path="activity" element={<ActivityTimeline />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Protected Partner Routes */}
          <Route element={<ProtectedRoute allowedRole="delivery_partner" />}>
            <Route path="/partner" element={<DashboardLayout />}>
              <Route path="dashboard" element={<PartnerDashboard />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
