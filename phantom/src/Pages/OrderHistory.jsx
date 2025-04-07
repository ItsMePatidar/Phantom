import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import logo from '../Components/logo.png'; // Add this import
import '../Styles/home.css';

function Home() {
    const navigate = useNavigate();
    const { orderHistory, dealerList, setCurrentDealer } = useOrders();
    const [userType, setUserType] = useState(dealerList[0].name);

    // Filter orders based on selected dealer
    const filteredOrders = orderHistory.filter(order => {
        if (userType === 'Aakash Patidar') {
            return true; // Admin sees all orders
        }
        return order.dealer?.name === userType;
    });

    // Update navigation handlers to include dealer info
    const handlePlaceOrder = () => {
        const dealer = dealerList.find(d => d.name === userType);
        setCurrentDealer(dealer);
        navigate('/place-order');
    };

    const handleOrderClick = (order) => {
        const dealer = dealerList.find(d => d.name === userType);
        setCurrentDealer(dealer);
        if (userType === 'Aakash Patidar') {
            navigate('/admin-order', { state: { viewOrder: order, dealer } });
        } else if ((isWithinOneMinute(order.date) && order.status.place == 'Waiting for Approval') || order.status.place == 'Waiting for Change') {
            navigate('/update-order', { state: { viewOrder: order, dealer } });
        } else {
            navigate('/view-order', { state: { viewOrder: order, dealer } });
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

    // console.log('orderHistory',orderHistory);
    

    return (
        <>
            
            <div className="home">
                <div className="header-container">
                    <h1 className="order-title">Order History</h1>
                    <button className="place-order-btn" onClick={handlePlaceOrder}>
                        Place New Order
                    </button>
                </div>
                <table className="order-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>     
                            {userType === 'Aakash Patidar' && <th>Dealer</th>}                   
                            <th>Date</th>
                            <th>Price</th>
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
                                {userType === 'Aakash Patidar' && (
                                    <td>{order.dealer?.name || 'N/A'}</td>
                                )}
                                <td>{formatDateTime(order.date)}</td>
                                <td>₹{order.total.toFixed(2)}</td>
                                {
                                    (() => {
                                        // console.log('statuses',order.status);
                                        
                                        if (order.status.place != 'Accepted') {
                                            return <td>{order.status.place}</td>
                                        } else if (order.status.payment != 'Partial Payment Received' && order.status.payment != 'Full Payment Received') {
                                            return <td>{order.status.payment}</td>
                                        } else if (order.status.delivery != 'Dispatched') {
                                            return <td>{order.status.delivery}</td>
                                        }
                                    })()
                                }
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default Home;