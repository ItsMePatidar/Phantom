import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import '../Styles/home.css';

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const { orders, dealers, currentDealer, setCurrentDealer, loading, isAdmin, fetchOrders } = useOrders();
    const [filteredOrders, setFilteredOrders] = useState([]);

    // Get the filter status from navigation state
    const filterStatus = location.state?.filterStatus || 'Overall';

    useEffect(() => {
        if (currentDealer) {
            console.log('Fetching orders for dealer:', currentDealer);
            fetchOrders();
        }
    }, [currentDealer]);

    // Filter orders based on status when orders or filterStatus changes
    useEffect(() => {
        if (!orders) return;

        if (filterStatus === 'Overall') {
            setFilteredOrders(orders);
            return;
        }

        const filtered = orders.filter(order => {
            return order.status?.final === filterStatus;
        });
        setFilteredOrders(filtered);
    }, [orders, filterStatus]);

    if (loading) {
        return <div>Loading orders...</div>;
    }

    if (!filteredOrders || filteredOrders.length === 0) {
        console.log('filteredOrders ', filteredOrders);
        return (
            <div className="home">
                <div className="header-container">
                    <h1 className="order-title">
                        {filterStatus === 'Overall' ? 'Order History' : `${filterStatus} Orders`}
                    </h1>
                    <div className="header-actions">
                        {isAdmin(currentDealer) && (
                            <button 
                                className="dashboard-btn" 
                                onClick={() => navigate('/admin-dashboard')}
                            >
                                Back to Dashboard
                            </button>
                        )}
                        <button className="place-order-btn" onClick={() => navigate('/place-order')}>
                            Place New Order
                        </button>
                    </div>
                </div>
                <p>No orders found for status: {filterStatus}</p>
            </div>
        );
    }

    const handlePlaceOrder = () => {
        navigate('/place-order');
    };

    const handleOrderClick = (order) => {
        if (currentDealer.name === 'Aakash Patidar') {
            navigate('/admin-order', { state: { viewOrder: order, dealer: currentDealer } });
        } else if ((isWithinOneMinute(order.date) && order.status.place == 'Waiting for Approval') || order.status.place == 'Waiting for Change') {
            navigate('/update-order', { state: { viewOrder: order, dealer: currentDealer } });
        } else {
            navigate('/view-order', { state: { viewOrder: order, dealer: currentDealer } });
        }
    };

    const isWithinOneMinute = (orderDate) => {
        const orderTime = new Date(orderDate).getTime();
        const currentTime = new Date().getTime();
        const diffInMinutes = (currentTime - orderTime) / (1000 * 60);
        return diffInMinutes <= 1;
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="home">
            <div className="header-container">
                <h1 className="order-title">
                    {filterStatus === 'Overall' ? 'Order History' : `${filterStatus} Orders`}
                </h1>
                <div className="header-actions">
                    {isAdmin(currentDealer) && (
                        <button 
                            className="dashboard-btn" 
                            onClick={() => navigate('/admin-dashboard')}
                        >
                            Back to Dashboard
                        </button>
                    )}
                    <button className="place-order-btn" onClick={handlePlaceOrder}>
                        Place New Order
                    </button>
                </div>
            </div>
            <table className="order-table">
                <thead>
                    <tr>
                        <th>Order ID</th>     
                        {isAdmin === true && <th>Dealer</th>}                   
                        <th>Date</th>
                        <th>Price</th>
                        <th>Payment Status</th>
                        <th>Delivery Status</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map(order => (
                        <tr 
                            key={order.id} 
                            onClick={() => handleOrderClick(order)}
                            className="order-row"
                        >
                            <td>{order.id}</td>
                            {isAdmin === true && (
                                <td>{order.dealer_name || 'N/A'}</td>
                            )}
                            <td>{formatDateTime(order.created_at)}</td>
                            <td>₹{parseFloat(order.total_amount).toFixed(2)}</td>
                            <td>{order.status?.payment}</td>
                            <td>{order.status?.delivery}</td>
                            <td>{order.status?.final}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Home;