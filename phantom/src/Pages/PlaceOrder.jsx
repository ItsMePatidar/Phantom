import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ItemModal from '../Components/ItemModal';
import { useOrders } from '../context/OrderContext';
import { createOrder } from '../api/api';
import '../Styles/AdminOrder.css'; // Changed from home.css to AdminOrder.css

function PlaceOrder() {
    const [placeOrderList, setPlaceOrderList] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState();
    const { addOrder, currentDealer } = useOrders();
    const navigate = useNavigate();
    const location = useLocation();
    const [deliveryType, setDeliveryType] = useState('self');
    const [address, setAddress] = useState(currentDealer?.address || '');
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        address: '',
        phone: ''
    });

    const customerFields = [
        { 
            key: 'name', 
            label: 'Name', 
            type: 'text', 
            required: true,
            placeholder: 'Enter customer name'
        },
        // { 
        //     key: 'phone', 
        //     label: 'Phone', 
        //     type: 'text', 
        //     required: false,
        //     placeholder: 'Enter customer phone'
        // },
        { 
            key: 'address', 
            label: 'Address', 
            type: 'textarea', 
            required: false,
            placeholder: 'Enter customer address'
        }
    ];

    useEffect(() => {
        if (location.state?.viewOrder) {
            setPlaceOrderList(location.state.viewOrder.items);
        }
    }, [location]);

    useEffect(() => {
        if (currentDealer?.address) {
            setAddress(currentDealer.address);
        }
    }, [currentDealer]);

    const handleAddItem = () => {
        setIsModalOpen(true);
        setSelectedItem({
            id: '',
            type: '',
            Fabric1: '',
            Fabric2: '',
            Profile: '',
            Height: '',
            Width: '',
            Quantity: '',
            Price: '',
            calculatedDimension: '',
            tax: ''
        });
    };

    const handleSaveItem = (newItem) => {
        if (newItem.id && placeOrderList.some(item => item.id === newItem.id)) {
            setPlaceOrderList(placeOrderList.map(item => 
                item.id === newItem.id ? newItem : item
            ));
        } else {
            setPlaceOrderList([...placeOrderList, newItem]);
        }
        setSelectedItem({
            id: '',
            type: '',
            Fabric1: '',
            Fabric2: '',
            Profile: '',
            Height: '',
            Width: '',
            Quantity: '',
            Price: '',
            calculatedDimension: '',
            tax: ''
        });
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (itemId) => {
        setPlaceOrderList(placeOrderList.filter(item => item.id !== itemId));
    };

    const calculateSubTotal = () => {
        return placeOrderList.reduce((total, order) => {
            return total + (order.Price * (order.calculatedDimension || 1));
        }, 0);
    };

    const calculateGSTByRate = () => {
        const gstRates = {};
        placeOrderList.forEach(order => {
            if (order.tax) {
                const amount = order.Price * (order.calculatedDimension || 1);
                gstRates[order.tax] = (gstRates[order.tax] || 0) + (amount * order.tax / 100);
            }
        });
        return gstRates;
    };

    const calculateTotal = () => {
        return calculateSubTotal() + Object.values(calculateGSTByRate()).reduce((a, b) => a + b, 0);
    };

    const calculateTotalQuantity = () => {
        return placeOrderList.reduce((total, order) => {
            return total + Number(order.Quantity);
        }, 0);
    };

    const handlePlaceOrder = async () => {
        try {
            const orderData = {
                dealerId: currentDealer.id,
                orderNumber: `ORD-${Date.now()}`,
                totalAmount: calculateTotal(),
                isCashPayment: false,
                items: placeOrderList,
                shippingAddress: {
                    type: deliveryType,
                    address: deliveryType !== 'self' ? address : currentDealer.address
                },
                customerDetails: customerDetails,
                status: {
                    place: 'Waiting for Approval',
                    payment: 'Payment Pending',
                    delivery: 'Not Started',
                    final: 'Waiting for Approval',
                    startProduction: false,
                    startCredit: false,
                    dispatch_details: ''
                },
                paymentDetails: {
                    subTotal: calculateSubTotal(),
                    gst: calculateGSTByRate(),
                    total: calculateTotal(),
                    requiredAmount: calculateTotal(),
                }
            };

            const newOrder = await createOrder(orderData);
            alert('Order placed successfully!');
            navigate('/order-history');
        } catch (error) {
            console.error('Failed to create order:', error);
            alert('Failed to place order. Please try again.');
        }
    };

    return (
        <div className="admin-order">
            <div className="top-section-container">
                {/* Dealer Info Section */}
                {/* <div className="dealer-info">
                    <div className="section-header">
                        <h2>Dealer Info</h2>
                    </div>
                    <p><strong>Name:</strong> {currentDealer.name}</p>
                    <p><strong>Ph:</strong> {currentDealer.phone}</p>
                    <p><strong>GST:</strong> {currentDealer.gst_no}</p>
                    <p><strong>Address:</strong> {currentDealer.address}</p>
                </div> */}

                {/* Delivery Section */}
                <div className="delivery-section">
                    <div className="section-header">
                        <h2>Delivery Details</h2>
                    </div>
                    <div className="delivery-options-row">
                        <label className="delivery-option">
                            <input
                                type="radio"
                                name="delivery"
                                value="self"
                                checked={deliveryType === 'self'}
                                onChange={(e) => setDeliveryType(e.target.value)}
                            />
                            Self
                        </label>
                        <label className="delivery-option">
                            <input
                                type="radio"
                                name="delivery"
                                value="local"
                                checked={deliveryType === 'local'}
                                onChange={(e) => setDeliveryType(e.target.value)}
                            />
                            Local
                        </label>
                        <label className="delivery-option">
                            <input
                                type="radio"
                                name="delivery"
                                value="courier"
                                checked={deliveryType === 'courier'}
                                onChange={(e) => setDeliveryType(e.target.value)}
                            />
                            Courier
                        </label>
                    </div>
                    {deliveryType !== 'self' && (
                        <div className="address-input-container">
                            <textarea
                                className="enhanced-address-input scrollable"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter delivery address..."
                                required={deliveryType !== 'self'}
                                rows="4"
                            />
                        </div>
                    )}
                </div>

                {/* Customer Details Section */}
                <div className="customer-details-section">
                    <div className="section-header">
                        <h2>Customer Details</h2>
                    </div>
                    <div className="customer-edit-form">
                        {customerFields.map(field => (
                            <div key={field.key} className="form-field">
                                <label className="customer-field-label">
                                    {field.label}
                                    {field.required && <span className="required">*</span>}:
                                </label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        value={customerDetails[field.key] || ''}
                                        onChange={(e) => setCustomerDetails(prev => ({
                                            ...prev,
                                            [field.key]: e.target.value
                                        }))}
                                        className="customer-input"
                                        placeholder={field.placeholder}
                                        rows="1"
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        value={customerDetails[field.key] || ''}
                                        onChange={(e) => setCustomerDetails(prev => ({
                                            ...prev,
                                            [field.key]: e.target.value
                                        }))}
                                        className="customer-input"
                                        placeholder={field.placeholder}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Items Section */}
            <div className="header-container">
                <h1 className="order-title">New Order</h1>
                <button className="place-order-btn" onClick={handleAddItem}>
                    Add Item
                </button>
            </div>

            <table className="order-table">
                {placeOrderList.length > 0 && (<thead>
                    <tr>
                        <th>Type</th>
                        <th>Fabric</th>
                        <th>Profile</th>
                        <th>Dimension</th>
                        <th style = {{textAlign:'center'}}>Quantity</th>
                        <th style = {{textAlign:'center'}}>Calculated Size</th>
                        <th style = {{textAlign:'right'}}>Price</th>
                        <th style = {{textAlign:'right'}}>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>)}
                <tbody>
                    {placeOrderList && placeOrderList.map(order => (
                        <tr key={order.id}>
                            <td>{order.type}</td>
                            <td>{order.Fabric1} {order.Fabric2 ? `- ${order.Fabric2}` : ''}</td>
                            <td>{order.Profile}</td>
                            <td>
                                {(order.Width && order.Length) ? 
                                    `W ${order.Width}cm / L ${order.Length}cm` : 
                                    ''}
                            </td>
                            <td style = {{textAlign:'center'}}>{order.Quantity}</td>
                            <td style={{textAlign:'center'}}>
                                {order.calculatedDimension && order.calculatedDimension !== 0 
                                    ? `${order.calculatedDimension.toFixed(2)} Sq. mtr.` 
                                    : ''}
                            </td>
                            <td style = {{textAlign:'right'}}>₹{order.Price}</td>
                            <td style = {{textAlign:'right'}}>₹{(order.Price * (order.calculatedDimension || 1)).toFixed(2)}</td>
                            <td>
                                <div className="action-buttons">
                                    <button 
                                        className="edit-btn"
                                        onClick={() => handleEdit(order)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="delete-btn"
                                        onClick={() => handleDelete(order.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {placeOrderList.length > 0 && (
                        <>
                            <tr className="total-row quantity-total">
                                <td colSpan="3"></td>
                                <td className="text-right">
                                    <strong>Total Quantity: </strong>
                                </td>
                                <td style = {{textAlign:'center'}}>
                                    <strong>{calculateTotalQuantity()}</strong>
                                </td>
                                <td colSpan="1"></td>
                                <td className="text-right"><strong>Subtotal</strong></td>
                                <td style = {{textAlign:'right'}}><strong>₹{calculateSubTotal().toFixed(2)}</strong></td>
                                <td></td>
                            </tr>
                            {Object.entries(calculateGSTByRate()).map(([rate, amount]) => (
                                <tr key={rate} className="total-row gst">
                                    <td colSpan="6"></td>
                                    <td className="text-right"><strong>GST @{rate}%</strong></td>
                                    <td style = {{textAlign:'right'}}><strong>₹{amount.toFixed(2)}</strong></td>
                                    <td></td>
                                </tr>
                            ))}
                            <tr className="total-row grand-total">
                                <td colSpan="6"></td>
                                <td className="text-right"><strong>Total</strong></td>
                                <td style = {{textAlign:'right'}}><strong>₹{calculateTotal().toFixed(2)}</strong></td>
                                <td></td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>

            <ItemModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                isEditing={!!selectedItem?.id}
            />

            {placeOrderList.length > 0 && (
                <div className="place-order-container">
                    <button 
                        className="place-order-btn confirm-order"
                        onClick={handlePlaceOrder}
                    >
                        Place Order
                    </button>
                </div>
            )}
        </div>
    );
}

export default PlaceOrder;
