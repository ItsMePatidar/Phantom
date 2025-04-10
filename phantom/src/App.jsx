import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { OrderProvider, useOrders } from './context/OrderContext';
import logo from './Components/logo.png';
import './Styles/home.css';
import OrderHistory from './Pages/OrderHistory';
import PlaceOrder from './Pages/PlaceOrder';
import ViewOrder from './Pages/ViewOrder';
import UpdateOrder from './Pages/UpdateOrder';
import AdminOrder from './Pages/AdminOrder';
import AdminDashboard from './Pages/AdminDashboard';
import DealerSelect from './Pages/DealerSelect';
import Specifications from './Pages/Specifications';
import DealerDashboard from './Pages/DealerDashboard';
import AdminLedger from './Pages/AdminLedger';
import DealerLedger from './Pages/DealerLedger';

function ProtectedRoute({ children }) {
  const { currentDealer } = useOrders();

  if (!currentDealer) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function DealerRouteHandler({ children }) {
  const { currentDealer } = useOrders();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentDealer?.role === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [currentDealer, navigate]);

  return children;
}

function AdminRouteHandler({ children }) {
  const { currentDealer } = useOrders();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentDealer?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [currentDealer, navigate]);

  return children;
}

function App() {
  console.log('App component rendered');
  console.log('import.meta.env.VITE_AUTH_URL', import.meta.env.VITE_AUTH_URL);
  return (
    <OrderProvider>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<DealerSelect />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <>
                <div className="top-bar">
                  <div className="logo-section">
                    <img src={logo} alt="Company Logo" className="logo" />
                  </div>
                </div>
                <div className="main-content">
                  <Routes>
                    <Route path="/dashboard" element={
                      <DealerRouteHandler>
                        <DealerDashboard />
                      </DealerRouteHandler>
                    } />
                    <Route path="/admin-dashboard" element={
                      <AdminRouteHandler>
                        <AdminDashboard />
                      </AdminRouteHandler>
                    } />
                    <Route path="/order-history" element={<OrderHistory />} />
                    <Route path="/place-order" element={<PlaceOrder />} />
                    <Route path="/view-order" element={<ViewOrder />} />
                    <Route path="/update-order" element={<UpdateOrder />} />
                    <Route path="/admin-order" element={<AdminOrder />} />
                    <Route path="/specifications" element={<Specifications />} />
                    <Route path="/admin-ledger" element={<AdminLedger />} />
                    <Route path="/dealer-ledger" element={<DealerLedger />} />
                  </Routes>
                </div>
              </>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </OrderProvider>
  );
}

export default App;
