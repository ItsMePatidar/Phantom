import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { OrderProvider, useOrders } from './context/OrderContext';
import logo from './Components/logo.png';
import './Styles/home.css';
import OrderHistory from './Pages/OrderHistory';
import PlaceOrder from './Pages/PlaceOrder';
import ViewOrder from './Pages/ViewOrder';
import UpdateOrder from './Pages/UpdateOrder';
import AdminOrder from './Pages/AdminOrder';
import Dashboard from './Pages/AdminDashboard';

function TopBar() {
  const { dealerList, setCurrentDealer } = useOrders();
  const [userType, setUserType] = React.useState(dealerList[0].name);

  return (
    <div className="top-bar">
      <div className="logo-section">
        <img src={logo} alt="Company Logo" className="logo" />
      </div>
      <div className="user-section">
        <select 
          className="user-type-select"
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value);
            const dealer = dealerList.find(d => d.name === e.target.value);
            setCurrentDealer(dealer);
          }}
        >
          {dealerList.map(dealer => (
            <option key={dealer.id} value={dealer.name}>
              {dealer.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function App() {
  return (
    <OrderProvider>
      <div className="app-container">
        <TopBar />
        <div className="main-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/place-order" element={<PlaceOrder />} />
            <Route path="/view-order" element={<ViewOrder />} />
            <Route path="/update-order" element={<UpdateOrder />} />
            <Route path="/admin-order" element={<AdminOrder />} />
          </Routes>
        </div>
      </div>
    </OrderProvider>
  );
}

export default App;
