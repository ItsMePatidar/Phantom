import { useOrders } from '../context/OrderContext';
import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import '../Styles/AdminDashboard.css';  // We'll reuse some admin dashboard styles

function DealerDashboard() {
    const { currentDealer } = useOrders();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!currentDealer) {
            navigate('/');
        }
    }, [currentDealer, navigate]);
    
    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome, {currentDealer?.name}</h1>
            </div>
            
            <div className="dealer-actions">
                <button 
                    className="place-order-btn"
                    onClick={() => navigate('/order-history')}
                >
                    View Order History
                </button>
                <button 
                    className="place-order-btn"
                    onClick={() => navigate('/place-order')}
                >
                    Place New Order
                </button>
                <button 
                    className="place-order-btn"
                    onClick={() => navigate('/dealer-ledger')}
                >
                    View Ledger
                </button>
            </div>
        </div>
    );
}

export default DealerDashboard;