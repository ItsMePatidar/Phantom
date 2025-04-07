import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';

function Dashboard() {
    const { orderHistory } = useOrders();
    const navigate = useNavigate();
    const [paymentType, setPaymentType] = useState('all'); // 'all', 'cash', 'noncash'

    // Filter orders based on payment type
    const filteredOrders = orderHistory.filter(order => {
        if (paymentType === 'all') return true;
        if (paymentType === 'cash') return order.isCashPayment;
        return !order.isCashPayment;
    });

    const statusCounts = {
        waitingApproval: filteredOrders.filter(order => order.status.place === 'Waiting for Approval').length,
        paymentPending: filteredOrders.filter(order => order.status.payment === 'Payment Pending').length,
        underProcess: filteredOrders.filter(order => order.status.delivery === 'Under Process').length,
        readyToDispatch: filteredOrders.filter(order => order.status.delivery === 'Ready to Dispatch').length
    };

    const handleBoxClick = (status) => {
        navigate('/order-history', { state: { filterStatus: status, paymentType } });
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <div className="payment-filter">
                    <label>Payment Type:</label>
                    <select 
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="payment-type-select"
                    >
                        <option value="all">All Orders</option>
                        <option value="cash">Cash Orders</option>
                        <option value="noncash">Non-Cash Orders</option>
                    </select>
                </div>
            </div>
            <div className="status-boxes">
                <div className="status-box waiting" onClick={() => handleBoxClick('Waiting for Approval')}>
                    <h3>Waiting for Approval</h3>
                    <div className="count">{statusCounts.waitingApproval}</div>
                </div>
                <div className="status-box pending" onClick={() => handleBoxClick('Payment Pending')}>
                    <h3>Payment Pending</h3>
                    <div className="count">{statusCounts.paymentPending}</div>
                </div>
                <div className="status-box process" onClick={() => handleBoxClick('Under Process')}>
                    <h3>Under Process</h3>
                    <div className="count">{statusCounts.underProcess}</div>
                </div>
                <div className="status-box ready" onClick={() => handleBoxClick('Ready to Dispatch')}>
                    <h3>Ready to Dispatch</h3>
                    <div className="count">{statusCounts.readyToDispatch}</div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;