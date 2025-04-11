import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import SpecificationModal from '../Components/SpecificationModal';

function AdminDashboard() {
    const navigate = useNavigate();
    const { orders, loading, fetchOrders, specifications, fetchSpecifications } = useOrders();
    const [paymentType, setPaymentType] = useState('all');
    const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
    const [selectedSpec, setSelectedSpec] = useState(null);

    // Fetch orders when component mounts
    useEffect(() => {
        fetchOrders();
        fetchSpecifications();
    }, []);

    if (loading || !orders) {
        return <div>Loading...</div>;
    }

    // Filter orders based on payment type
    const filteredOrders = (orders || []).filter(order => {
        if (!order || !order.status) return false;
        if (paymentType === 'all') return true;
        if (paymentType === 'cash') return order.is_cash_payment;
        return !order.is_cash_payment;
    });

    const statusCounts = {
        overall: filteredOrders.length || 0,
        waitingForApproval: filteredOrders.filter(order =>
            order.status?.final === 'Waiting for Approval'
        ).length || 0,
        waitingForChange: filteredOrders.filter(order =>
            order.status?.final === 'Waiting for Change'
        ).length || 0,
        rejected: filteredOrders.filter(order =>
            order.status?.final === 'Rejected'
        ).length || 0,
        payemntDue: filteredOrders.filter(order =>
            order.status?.final === 'Payment Due'
        ).length || 0,
        underProcess: filteredOrders.filter(order =>
            order.status?.final === 'Under Process'
        ).length || 0,
        readyToDispatch: filteredOrders.filter(order =>
            order.status?.final === 'Ready to Dispatch'
        ).length || 0,
        dispatched: filteredOrders.filter(order =>
            order.status?.final === 'Dispatched'
        ).length || 0,


        // advanceDueForProduction: filteredOrders.filter(order =>
        //     order.status?.payment === 'Advance Due for Production'
        // ).length || 0,
        // advandeDueForDispatch: filteredOrders.filter(order =>
        //     order.status?.payment === 'Advance Due for Dispatch'
        // ).length || 0,
        // paymentDueForProduction: filteredOrders.filter(order =>
        //     order.status?.payment === 'Payment Due for Production'
        // ).length || 0,
        // paymentDueForDispatch: filteredOrders.filter(order =>
        //     order.status?.payment === 'Payment Due for Dispatch'
        // ).length || 0,
        // paymentDue: filteredOrders.filter(order =>
        //     order.status?.payment === 'Payment Due'
        // ).length || 0,
        // underProcess: filteredOrders.filter(order =>
        //     order.status?.final === 'Under Process'
        // ).length || 0,




        // waitingApproval: filteredOrders.filter(order => 
        //     order.status?.place === 'Waiting for Approval'
        // ).length || 0,
        // waitingPayment: filteredOrders.filter(order => 
        //     order.status?.place === 'Accepted' && order.status?.payment === 'Payment Pending'
        // ).length || 0,
        // pendingPayment: filteredOrders.filter(order => 
        //     order.status?.place === 'Accepted' && order.status?.payment === 'Partial Payment Received'
        // ).length || 0,
        // pendingPaymentStartProd: filteredOrders.filter(order => 
        //     order.status?.place === 'Accepted' && order.status?.payment === 'Partial Payment Received - For Production'
        // ).length || 0,
        // underProcess: filteredOrders.filter(order => 
        //     order.status?.delivery === 'Under Process'
        // ).length || 0,
        // readyToDispatch: filteredOrders.filter(order => 
        //     order.status?.delivery === 'Ready to Dispatch'
        // ).length || 0
    };

    const handleBoxClick = (status) => {
        navigate('/order-history', { state: { filterStatus: status, paymentType } });
    };

    const handleEditSpec = (spec) => {
        setSelectedSpec(spec);
        setIsSpecModalOpen(true);
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
                <div className="status-box b1" onClick={() => handleBoxClick('Overall')}>
                    <h3>Overall</h3>
                    <div className="count">{statusCounts.overall}</div>
                </div>
                <div className="status-box b2" onClick={() => handleBoxClick('Waiting for Approval')}>
                    <h3>Approval Pending</h3>
                    <div className="count">{statusCounts.waitingForApproval}</div>
                </div>
                <div className="status-box b3" onClick={() => handleBoxClick('Waiting for Change')}>
                    <h3>Waiting for Changes</h3>
                    <div className="count">{statusCounts.waitingForChange}</div>
                </div>
                <div className="status-box b4" onClick={() => handleBoxClick('Rejected')}>
                    <h3>Rejected</h3>
                    <div className="count">{statusCounts.rejected}</div>
                </div>
                <div className="status-box b5" onClick={() => handleBoxClick('Payment Due')}>
                    <h3>Payment Due</h3>
                    <div className="count">{statusCounts.payemntDue}</div>
                </div>
                <div className="status-box b6" onClick={() => handleBoxClick('Under Process')}>
                    <h3>Under Process</h3>
                    <div className="count">{statusCounts.underProcess}</div>
                </div>
                <div className="status-box b7" onClick={() => handleBoxClick('Ready to Dispatch')}>
                    <h3>Ready to Dispatch</h3>
                    <div className="count">{statusCounts.readyToDispatch}</div>
                </div>
                <div className="status-box b8" onClick={() => handleBoxClick('Dispatched')}>
                    <h3>Dispatched</h3>
                    <div className="count">{statusCounts.dispatched}</div>
                </div>



                {/* <div className="status-box waiting" onClick={() => handleBoxClick('Waiting for Approval')}>
                    <h3>Waiting for Approval</h3>
                    <div className="count">{statusCounts.waitingApproval}</div>
                </div>
                <div className="status-box pending" onClick={() => handleBoxClick('Payment Pending')}>
                    <h3>Waiting for Payment</h3>
                    <div className="count">{statusCounts.waitingPayment}</div>
                </div>
                <div className="status-box pending" onClick={() => handleBoxClick('Payment Pending')}>
                    <h3>Payment Pending - Start Prod</h3>
                    <div className="count">{statusCounts.pendingPaymentStartProd}</div>
                </div>
                <div className="status-box process" onClick={() => handleBoxClick('Under Process')}>
                    <h3>Under Process</h3>
                    <div className="count">{statusCounts.underProcess}</div>
                </div>
                <div className="status-box pending" onClick={() => handleBoxClick('Payment Pending')}>
                    <h3>Payment Pending</h3>
                    <div className="count">{statusCounts.pendingPayment}</div>
                </div>
                
                <div className="status-box ready" onClick={() => handleBoxClick('Ready to Dispatch')}>
                    <h3>Ready to Dispatch</h3>
                    <div className="count">{statusCounts.readyToDispatch}</div>
                </div> */}
            </div>

            <div className="admin-actions">
                <button
                    className="manage-specs-btn"
                    onClick={() => navigate('/specifications')}
                >
                    Manage Product Specifications
                </button>
                <button
                    className="manage-specs-btn"
                    onClick={() => navigate('/admin-ledger')}
                >
                    Get Ledger
                </button>
                <button
                    className="manage-specs-btn"
                    onClick={() => navigate('/manage-dealers')}
                >
                    Manage Dealers
                </button>
            </div>

            {isSpecModalOpen && (
                <SpecificationModal
                    isOpen={isSpecModalOpen}
                    onClose={() => setIsSpecModalOpen(false)}
                    specification={selectedSpec}
                    onSave={selectedSpec ? updateSpecificationById : addSpecification}
                />
            )}
        </div>
    );
}

export default AdminDashboard;