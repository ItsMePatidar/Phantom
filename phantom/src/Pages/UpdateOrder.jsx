import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ItemModal from '../Components/ItemModal';
import { useOrders } from '../context/OrderContext';
import '../Styles/home.css';

function UpdateOrder() {
    const [placeOrderList, setPlaceOrderList] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState();
    const { addOrder, currentDealer } = useOrders();
    const navigate = useNavigate();
    const location = useLocation();
    const originalOrder = location.state?.viewOrder;
    const [deliveryType, setDeliveryType] = useState('self');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (originalOrder) {
            setPlaceOrderList(originalOrder.items);
            setDeliveryType(originalOrder.delivery?.type || 'self');
            setAddress(originalOrder.delivery?.address || currentDealer?.address || '');
        } else if (currentDealer?.address) {
            setAddress(currentDealer.address);
        }
    }, [originalOrder, currentDealer]);

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
        setSelectedItem(null);
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
            return total + (order.Price * order.calculatedDimension);
        }, 0);
    };

    const calculateGSTByRate = () => {
        const gstRates = {};
        placeOrderList.forEach(order => {
            if (order.tax) {
                const amount = order.Price * order.calculatedDimension;
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

    const handleUpdateOrder = () => {
        const updatedOrder = {
            id: originalOrder.id,
            date: originalOrder.date,
            items: placeOrderList,
            total: calculateTotal(),
            status: {
                place: 'Waiting for Approval',
                payment: originalOrder.status.payment,
                delivery: originalOrder.status.delivery,
                final: ''
            },
            delivery: {
                type: deliveryType,
                address: deliveryType !== 'self' ? address : null
            }
        };
        
        addOrder(updatedOrder);
        alert('Order updated successfully!');
        navigate('/order-history');
    };

    return (
        <>
            <div className="home">
                <div className="header-container">
                    <h1 className="order-title">Update Order #{originalOrder?.id}</h1>
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
                            <th style={{textAlign:'center'}}>Quantity</th>
                            <th style={{textAlign:'center'}}>Calculated Size</th>
                            <th style={{textAlign:'right'}}>Price</th>
                            <th style={{textAlign:'right'}}>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>)}
                    <tbody>
                        {placeOrderList && placeOrderList.map(order => (
                            <tr key={order.id}>
                                <td>{order.type}</td>
                                <td>{order.Fabric1} {order.Fabric2 ? `- ${order.Fabric2}` : ''}</td>
                                <td>{order.Profile}</td>
                                <td>W {order.Width}cm / H {order.Height}cm</td>
                                <td style={{textAlign:'center'}}>{order.Quantity}</td>
                                <td style={{textAlign:'center'}}>{order.calculatedDimension.toFixed(2)} Sq. mtr.</td>
                                <td style={{textAlign:'right'}}>₹{order.Price}</td>
                                <td style={{textAlign:'right'}}>₹{(order.Price * order.calculatedDimension).toFixed(2)}</td>
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
                                    <td style={{textAlign:'center'}}>
                                        <strong>{calculateTotalQuantity()}</strong>
                                    </td>
                                    <td colSpan="1"></td>
                                    <td className="text-right"><strong>Subtotal</strong></td>
                                    <td style={{textAlign:'right'}}><strong>₹{calculateSubTotal().toFixed(2)}</strong></td>
                                    <td></td>
                                </tr>
                                {Object.entries(calculateGSTByRate()).map(([rate, amount]) => (
                                    <tr key={rate} className="total-row gst">
                                        <td colSpan="6"></td>
                                        <td className="text-right"><strong>GST @{rate}%</strong></td>
                                        <td style={{textAlign:'right'}}><strong>₹{amount.toFixed(2)}</strong></td>
                                        <td></td>
                                    </tr>
                                ))}
                                <tr className="total-row grand-total">
                                    <td colSpan="6"></td>
                                    <td className="text-right"><strong>Total</strong></td>
                                    <td style={{textAlign:'right'}}><strong>₹{calculateTotal().toFixed(2)}</strong></td>
                                    <td></td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
                {placeOrderList.length > 0 && (
                    <>
                        <div className="delivery-section">
                            <h2>Delivery Details</h2>
                            <div className="delivery-options">
                                <label className="delivery-option">
                                    <input
                                        type="radio"
                                        name="delivery"
                                        value="self"
                                        checked={deliveryType === 'self'}
                                        onChange={(e) => setDeliveryType(e.target.value)}
                                    />
                                    Self Pickup
                                </label>
                                <label className="delivery-option">
                                    <input
                                        type="radio"
                                        name="delivery"
                                        value="local"
                                        checked={deliveryType === 'local'}
                                        onChange={(e) => setDeliveryType(e.target.value)}
                                    />
                                    Local Transport
                                </label>
                                <label className="delivery-option">
                                    <input
                                        type="radio"
                                        name="delivery"
                                        value="courier"
                                        checked={deliveryType === 'courier'}
                                        onChange={(e) => setDeliveryType(e.target.value)}
                                    />
                                    Courier Service
                                </label>
                            </div>
                            <div className={`address-field ${deliveryType !== 'self' ? 'visible' : ''}`}>
                                <textarea
                                    className="address-input"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter delivery address..."
                                    required={deliveryType !== 'self'}
                                />
                            </div>
                        </div>

                        <div className="place-order-container">
                        <button 
                            className="place-order-btn confirm-order"
                            onClick={handleUpdateOrder}
                        >
                            Update Order
                        </button>
                    </div>
                    </>
                )}

            </div>
            <ItemModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                isEditing={!!selectedItem?.id}
            />
        </>
    );
}

export default UpdateOrder;
