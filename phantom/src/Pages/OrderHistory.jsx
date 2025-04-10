import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import '../Styles/home.css';

function Home() {
    const navigate = useNavigate();
    const { orders, dealers, currentDealer, setCurrentDealer, loading, isAdmin, fetchOrders } = useOrders();

    useEffect(() => {
        if (currentDealer) {
            console.log('Fetching orders for dealer:', currentDealer);
            fetchOrders();
        }
    }, [currentDealer]);

    if (loading) {
        return <div>Loading orders...</div>;
    }

    if (!orders || orders.length === 0) {
        console.log('orders ', orders);
        return (
            <div className="home">
                <div className="header-container">
                    <h1 className="order-title">Order History</h1>
                    <button className="place-order-btn" onClick={() => navigate('/place-order')}>
                        Place New Order
                    </button>
                </div>
                <p>No orders found.</p>
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
                <h1 className="order-title">Order History</h1>
                <div className="header-actions">
                    {isAdmin(currentDealer) && (
                        <button 
                            className="dashboard-btn" 
                            onClick={() => navigate('/dashboard')}
                        >
                            View Dashboard
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
                        {currentDealer.name === dealers[0]?.name && <th>Dealer</th>}                   
                        <th>Date</th>
                        <th>Price</th>
                        <th>Payment Status</th>
                        <th>Delivery Status</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr 
                            key={order.id} 
                            onClick={() => handleOrderClick(order)}
                            className="order-row"
                        >
                            <td>{order.id}</td>
                            {currentDealer.name === dealers[0]?.name && (
                                <td>{order.dealer_name || 'N/A'}</td>
                            )}
                            <td>{formatDateTime(order.created_at)}</td>
                            <td>₹{parseFloat(order.total_amount).toFixed(2)}</td>
                            <td>{order.status?.payment}</td>
                            <td>{order.status?.delivery}</td>
                            {/* {
                                (() => {
                                    try {
                                        
                                        if (order.status?.place != 'Accepted') {
                                            return <td>{order.status?.place}</td>
                                        } else if (order.status?.payment === 'Payment Pending') {
                                            return <td>{order.status?.payment}</td>
                                        } else if (order.status?.delivery != 'Dispatched') {
                                            return <td>{order.status?.delivery}</td>
                                        }
                                    } catch (error) {
                                        console.error('Error accessing order status:', order);
                                        // return <td>{order.status?.place}</td>
                                    }
                                })()
                            } */}
                            <td>{order.status?.final}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Home;