import React, { createContext, useState, useContext } from 'react';

const OrderContext = createContext();

export function OrderProvider({ children }) {
    const [orderHistory, setOrderHistory] = useState([]);
    const [currentDealer, setCurrentDealer] = useState({
        id: 1, 
        name: 'Aakash Patidar', 
        address: 'Azad Chowk Bonli', 
        phone: '9540293140', 
        email: ''
    });

    const dealerList = [
        {id: 1, name: 'Aakash Patidar', address: 'Azad Chowk Bonli', phone: '9540293140', email: ''},
        {id: 2, name: 'Priyansh Patidar', address: 'Pune', phone: '9001551209', email: 'p.patidar@gmail.com'},
        {id: 3, name: 'Kunj Bihari Patidar', address: 'Tehsil Road Azad Chowk Bonli', phone: '9785364368', email: ''}
    ];

    const addOrder = (order) => {
        const existingOrderIndex = orderHistory.findIndex(o => o.id === order.id);
        
        if (existingOrderIndex !== -1) {
            // When updating an order, preserve the original dealer
            const updatedOrder = {
                ...order,
                dealer: orderHistory[existingOrderIndex].dealer // Keep original dealer
            };
            setOrderHistory(orderHistory.map(o => 
                o.id === order.id ? updatedOrder : o
            ));
        } else {
            // Only add dealer info for new orders
            const newOrder = {
                ...order,
                dealer: currentDealer
            };
            setOrderHistory([...orderHistory, newOrder]);
        }
    };

    return (
        <OrderContext.Provider value={{ 
            orderHistory, 
            addOrder, 
            dealerList,
            currentDealer,
            setCurrentDealer 
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export const useOrders = () => useContext(OrderContext);
