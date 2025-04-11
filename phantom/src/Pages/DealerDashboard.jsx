import { useOrders } from '../context/OrderContext';
import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';

function DealerDashboard() {
    const { currentDealer, orders, fetchOrders } = useOrders();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!currentDealer) {
            navigate('/');
        } else {
            fetchOrders();
        }
    }, [currentDealer, navigate]);

    const dealerOrders = orders || [];

    const statusCounts = {
        overall: dealerOrders.length || 0,
        waitingForApproval: dealerOrders.filter(order =>
            order.status?.final === 'Waiting for Approval'
        ).length || 0,
        waitingForChange: dealerOrders.filter(order =>
            order.status?.final === 'Waiting for Change'
        ).length || 0,
        rejected: dealerOrders.filter(order =>
            order.status?.final === 'Rejected'
        ).length || 0,
        paymentDue: dealerOrders.filter(order =>
            order.status?.final === 'Payment Due'
        ).length || 0,
        underProcess: dealerOrders.filter(order =>
            order.status?.final === 'Under Process'
        ).length || 0,
        readyToDispatch: dealerOrders.filter(order =>
            order.status?.final === 'Ready to Dispatch'
        ).length || 0,
        dispatched: dealerOrders.filter(order =>
            order.status?.final === 'Dispatched'
        ).length || 0
    };

    const handleBoxClick = (status) => {
        navigate('/order-history', { state: { filterStatus: status } });
    };

    const statusBoxes = [
        {
            status: 'Overall',
            label: 'Overall Orders',
            count: statusCounts.overall,
            className: 'b1',
            alwaysShow: true  // Always show overall count
        },
        {
            status: 'Waiting for Approval',
            label: 'Pending Approval',
            count: statusCounts.waitingForApproval,
            className: 'b2'
        },
        {
            status: 'Waiting for Change',
            label: 'Changes Requested',
            count: statusCounts.waitingForChange,
            className: 'b3'
        },
        {
            status: 'Rejected',
            label: 'Rejected',
            count: statusCounts.rejected,
            className: 'b4'
        },
        {
            status: 'Payment Due',
            label: 'Payment Due',
            count: statusCounts.paymentDue,
            className: 'b5'
        },
        {
            status: 'Under Process',
            label: 'Under Process',
            count: statusCounts.underProcess,
            className: 'b6'
        },
        {
            status: 'Ready to Dispatch',
            label: 'Ready to Dispatch',
            count: statusCounts.readyToDispatch,
            className: 'b7'
        },
        {
            status: 'Dispatched',
            label: 'Dispatched',
            count: statusCounts.dispatched,
            className: 'b8'
        }
    ];
    
    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome, {currentDealer?.name}</h1>
            </div>

            <div className="status-boxes">
                {statusBoxes
                    .filter(box => box.alwaysShow || box.count > 0)
                    .map(box => (
                        <div 
                            key={box.status}
                            className={`status-box ${box.className}`}
                            onClick={() => handleBoxClick(box.status)}
                        >
                            <h3>{box.label}</h3>
                            <div className="count">{box.count}</div>
                        </div>
                    ))
                }
            </div>
            
            <div className="dealer-actions">
                <button 
                    className="manage-specs-btn"
                    onClick={() => navigate('/order-history')}
                >
                    View Order History
                </button>
                <button 
                    className="manage-specs-btn"
                    onClick={() => navigate('/place-order')}
                >
                    Place New Order
                </button>
                <button 
                    className="manage-specs-btn"
                    onClick={() => navigate('/dealer-ledger')}
                >
                    View Ledger
                </button>
            </div>
        </div>
    );
}

export default DealerDashboard;