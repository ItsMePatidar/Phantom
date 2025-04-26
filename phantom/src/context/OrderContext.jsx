import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
    getOrders, 
    getOrdersByDealer, 
    createOrder, 
    updateOrder, 
    deleteOrder, 
    getDealers, 
    searchDealer as searchDealerApi,
    getSpecifications,
    createSpecification,
    updateSpecification,
    deleteSpecification,
    createDealer,
    updateDealerById,
    deleteDealerById
} from '../api/api';

const OrderContext = createContext();

export function OrderProvider({ children }) {
    // Global state variables
    const [orders, setOrders] = useState([]);     // Stores all orders
    const [dealers, setDealers] = useState([]); // Stores all dealers
    const [loading, setLoading] = useState(false); // Loading state
    const [currentDealer, setCurrentDealer] = useState(null); // Currently selected dealer
    const [specifications, setSpecifications] = useState([]); // Stores all specifications

    useEffect(() => {
        // Store dealer selection in localStorage when it changes
        if (currentDealer) {
            localStorage.setItem('currentDealer', JSON.stringify(currentDealer));
        }
    }, [currentDealer]);

    useEffect(() => {
        // Load stored dealer on initial mount
        const storedDealer = localStorage.getItem('currentDealer');
        if (storedDealer) {
            setCurrentDealer(JSON.parse(storedDealer));
        }
    }, []);

    const isAdmin = (dealer) => {
        console.log('role is - ', dealer?.role);
        return dealer?.role === 'admin';
    };

    const fetchDealers = async () => {
        try {
            const response = await getDealers();
            if (response && response) {
                setDealers(response);
            }
        } catch (error) {
            console.error('Failed to fetch dealers:', error);
            setDealers([]);
        }
    };

    // Add getDealerPrice helper function
    const getDealerPrice = (dealerId, specificationId) => {
        const dealer = dealers.find(d => d.id === dealerId);
        return dealer?.pricing?.[specificationId] || 400; // Default price if not set
    };

    // Modify fetchOrders to include dealer pricing
    const fetchOrders = async () => {
        if (!currentDealer) return;

        try {
            setLoading(true);
            let ordersData;

            console.log('Fetching orders for role:', currentDealer.role);

            if (currentDealer.role === 'admin') {
                ordersData = await getOrders();
            } else {
                ordersData = await getOrdersByDealer(currentDealer.id);
                // Update items with dealer-specific pricing
                if (ordersData) {
                    ordersData = ordersData.map(order => ({
                        ...order,
                        items: order.items.map(item => ({
                            ...item,
                            Price: currentDealer.pricing?.[specifications.find(s => s.type_name === item.type)?.id] || item.Price
                        }))
                    }));
                }
            }

            console.log('Received orders data:', ordersData);

            if (ordersData && Array.isArray(ordersData)) {
                setOrders(ordersData);
            } else {
                console.warn('Invalid orders data received:', ordersData);
                setOrders([]);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Update addOrder to handle dealer pricing
    const addOrder = async (orderData) => {
        try {
            // Update item prices with dealer-specific pricing if not admin
            if (!isAdmin(currentDealer)) {
                orderData.items = orderData.items.map(item => ({
                    ...item,
                    Price: currentDealer.pricing?.[specifications.find(s => s.type_name === item.type)?.id] || item.Price
                }));
            }

            const newOrder = await createOrder(orderData);
            setOrders(prev => [newOrder, ...prev]);
            return newOrder;
        } catch (error) {
            console.error("Failed to add order:", error);
            throw error;
        }
    };

    // Update updateOrderById to handle dealer pricing
    const updateOrderById = async (orderId, updateData) => {
        try {
            setLoading(true);
            
            // Update item prices with dealer-specific pricing if not admin
            if (!isAdmin(currentDealer)) {
                updateData.items = updateData.items.map(item => ({
                    ...item,
                    Price: currentDealer.pricing?.[specifications.find(s => s.type_name === item.type)?.id] || item.Price
                }));
            }

            const updatedOrder = await updateOrder(orderId, updateData);
            setOrders(prev => prev.map(order => 
                order.id === orderId ? updatedOrder : order
            ));
            return updatedOrder;
        } catch (error) {
            console.error("Failed to update order:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteOrderById = async (orderId) => {
        try {
            await deleteOrder(orderId);
            setOrders(prev => prev.filter(order => order.id !== orderId));
        } catch (error) {
            console.error("Failed to delete order:", error);
            throw error;
        }
    };

    const searchDealer = async (dealerName, password) => {
        try {
            setLoading(true);
            const dealer = await searchDealerApi(dealerName, password);
            return dealer;
        } catch (error) {
            console.error("Failed to search dealer:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const fetchSpecifications = async () => {
        try {
            const result = await getSpecifications();
            if (result) {
                setSpecifications(result);
            }
        } catch (error) {
            console.error('Failed to fetch specifications:', error);
            setSpecifications([]);
        }
    };

    const addSpecification = async (specData) => {
        try {
            if (!specData) {
                throw new Error('Specification data is required');
            }
            
            // Ensure all required fields are present
            const validatedData = {
                type_name: specData.type_name,
                product_type: specData.product_type || 'SQM', // Add default product_type
                fabric_selection: specData.fabric_selection || 'dropdown',
                fabric_count: parseInt(specData.fabric_count) || 0,
                fabric_options: Array.isArray(specData.fabric_options) ? specData.fabric_options : [],
                profiles: Array.isArray(specData.profiles) ? specData.profiles : [],
                min_fabric: specData.min_fabric || 'area',
                min_fabric_value: parseFloat(specData.min_fabric_value) || 1,
                tax: parseFloat(specData.tax) || 0
            };

            console.log('Validated specification data:', validatedData);
            const newSpec = await createSpecification(validatedData);
            
            if (!newSpec) {
                throw new Error('Failed to create specification');
            }
            
            setSpecifications(prev => [...prev, newSpec]);
            return newSpec;
        } catch (error) {
            console.error('Failed to add specification:', error);
            throw error;
        }
    };

    const updateSpecificationById = async (id, specData) => {
        try {
            if (!specData) {
                throw new Error('Specification data is required');
            }
            
            // Ensure all required fields are present
            const validatedData = {
                type_name: specData.type_name,
                product_type: specData.product_type || 'SQM', // Add default product_type
                fabric_selection: specData.fabric_selection || 'dropdown',
                fabric_count: parseInt(specData.fabric_count) || 0,
                fabric_options: Array.isArray(specData.fabric_options) ? specData.fabric_options : [],
                profiles: Array.isArray(specData.profiles) ? specData.profiles : [],
                min_fabric: specData.min_fabric || 'area',
                min_fabric_value: parseFloat(specData.min_fabric_value) || 1,
                tax: parseFloat(specData.tax) || 0
            };

            console.log('Validated specification data:', validatedData);
            const updatedSpec = await updateSpecification(id, validatedData);
            setSpecifications(prev => 
                prev.map(spec => spec.id === id ? updatedSpec : spec)
            );
            return updatedSpec;
        } catch (error) {
            console.error('Failed to update specification:', error);
            throw error;
        }
    };

    const deleteSpecificationById = async (id) => {
        try {
            await deleteSpecification(id);
            setSpecifications(prev => 
                prev.filter(spec => spec.id !== id)
            );
        } catch (error) {
            console.error('Failed to delete specification:', error);
            throw error;
        }
    };

    const addDealer = async (dealerData) => {
        try {
            const newDealer = await createDealer(dealerData);
            setDealers(prev => [...prev, newDealer]);
            return newDealer;
        } catch (error) {
            console.error("Failed to add dealer:", error);
            throw error;
        }
    };

    const updateDealer = async (dealerId, updateData) => {
        try {
            const updatedDealer = await updateDealerById(dealerId, updateData);
            setDealers(prev => prev.map(dealer => 
                dealer.id === dealerId ? updatedDealer : dealer
            ));
            return updatedDealer;
        } catch (error) {
            console.error("Failed to update dealer:", error);
            throw error;
        }
    };

    const deleteDealer = async (dealerId) => {
        try {
            await deleteDealerById(dealerId);
            setDealers(prev => prev.filter(dealer => dealer.id !== dealerId));
        } catch (error) {
            console.error("Failed to delete dealer:", error);
            throw error;
        }
    };

    return (
        <OrderContext.Provider value={{ 
            orders,
            dealers,
            loading,
            currentDealer,
            setCurrentDealer,
            isAdmin,
            addOrder,
            updateOrderById,
            deleteOrderById,
            fetchOrders,
            fetchDealers,
            searchDealer,
            specifications,
            fetchSpecifications,
            addSpecification,
            updateSpecificationById,
            deleteSpecificationById,
            addDealer,
            updateDealer,
            deleteDealer,
            getDealerPrice // Add the new helper function
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export const useOrders = () => useContext(OrderContext);
