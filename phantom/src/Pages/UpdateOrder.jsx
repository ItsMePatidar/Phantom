import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import ItemModal from '../Components/ItemModal';
import qrCode from '../Components/qr_code.png';
import '../Styles/AdminOrder.css';

function UpdateOrder() {
    const location = useLocation();
    const navigate = useNavigate();
    const { updateOrderById } = useOrders();
    const originalOrder = location.state?.viewOrder;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [placeOrderList, setPlaceOrderList] = useState(originalOrder?.items || []);
    const [customerDetails, setCustomerDetails] = useState(originalOrder?.customer_details || {
        name: '',
        address: ''
    });
    const [isCashPayment, setIsCashPayment] = useState(originalOrder?.is_cash_payment || false);
    const [deliveryType, setDeliveryType] = useState(originalOrder?.shipping_address?.type || 'self');
    const [address, setAddress] = useState(originalOrder?.shipping_address?.address || '');
    const [productionStatus, setProductionStatus] = useState(originalOrder?.status?.delivery || '');
    const [dispatchDetails, setDispatchDetails] = useState(originalOrder?.status?.dispatch_details || '');
    const [transactions, setTransactions] = useState(originalOrder.payment_details?.payments || []);
    const [requiredAmount, setRequiredAmount] = useState(originalOrder.payment_details?.requiredAmount || 0);
    const [startProduction, setStartProduction] = useState(originalOrder?.status?.startProduction || false);
    const [startCredit, setStartCredit] = useState(originalOrder?.status?.startCredit || false);

    const customerFields = [
        { 
            key: 'name', 
            label: 'Name', 
            type: 'text', 
            required: true,
            placeholder: 'Enter customer name'
        },
        { 
            key: 'address', 
            label: 'Address', 
            type: 'textarea', 
            required: false,
            placeholder: 'Enter customer address'
        }
    ];

    const calculateTotalPaid = () => {
        return originalOrder?.payment_details?.payments?.reduce((sum, txn) => sum + txn.amount, 0) || 0;
    };

    const calculateDueAmount = () => {
        const totalPaid = calculateTotalPaid();
        const required = parseFloat(originalOrder?.payment_details?.requiredAmount || 0);
        return Math.max(0, calculateTotal() - totalPaid);
    };

    useEffect(() => {
                setRequiredAmount(String(calculateTotal()));
        }, [placeOrderList, isCashPayment]);

    const handleAddItem = () => {
        setIsModalOpen(true);
        setSelectedItem({
            id: '',
            type: '',
            Fabric1: '',
            Fabric2: '',
            Profile: '',
            Length: '',
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
        setIsModalOpen(false);
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

    const calculateTotalQuantity = () => {
        return placeOrderList.reduce((total, order) => {
            return total + Number(order.Quantity);
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
        const subtotal = calculateSubTotal();
        if (isCashPayment) {
            return subtotal; // Return only subtotal for cash payments
        }
        return subtotal + Object.values(calculateGSTByRate()).reduce((a, b) => a + b, 0);
    };

    const calculatePaymentStatus = (payments, required) => {
        const totalPaid = payments.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
        const reqAmount = parseFloat(required) || calculateTotal();

        console.log('Total Paid:', totalPaid);
        console.log('Required Amount:', reqAmount);
        console.log('Total Amount:', calculateTotal());
        console.log('Start Production:', startProduction);
        console.log('Start Credit:', startCredit);

        if (totalPaid >= calculateTotal()) return 'Payment Received';
        if (totalPaid < reqAmount && reqAmount < calculateTotal() && startProduction === true && startCredit === false) return 'Advance Due for Dispatch';
        if (totalPaid < reqAmount && reqAmount < calculateTotal() && startProduction === false && startCredit === false) return 'Advance Due for Production';
        if ((startProduction === true || totalPaid >= reqAmount) && startCredit === false) return 'Payment Due for Dispatch';
        if (startProduction === false && startCredit === false) return 'Payment Due for Production';
        if (startProduction === true && startCredit === true) return 'Payment Due';
        return 'Payment Pending';
    };

    const calculateFinalStatus = (orderStatus, paymentStatus, productionStatus) => {
        if (orderStatus != 'Accepted') return orderStatus;
        if (paymentStatus.endsWith('for Production')) return 'Payment Due';
        console.log();
        
        return productionStatus;
    }

    const handleUpdateOrder = async () => {
        try {
            const updatedOrderData = {
                totalAmount: calculateTotal(),
                isCashPayment: isCashPayment,
                items: placeOrderList,
                shippingAddress: {
                    type: deliveryType,
                    address: deliveryType !== 'self' ? address : null
                },
                customerDetails: customerDetails,
                status: {
                    ...originalOrder.status,
                    place: 'Waiting for Approval',
                    final: calculateFinalStatus('Waiting for Approval', calculatePaymentStatus(transactions, requiredAmount), productionStatus),
                    delivery: productionStatus,
                    dispatch_details: productionStatus === 'Dispatched' ? dispatchDetails : ''
                },
                paymentDetails: {
                    requiredAmount: parseFloat(requiredAmount),
                    payments: transactions
                }
            };

            await updateOrderById(originalOrder.id, updatedOrderData);
            alert('Order updated successfully!');
            navigate('/order-history');
        } catch (error) {
            console.error('Failed to update order:', error);
            alert('Failed to update order. Please try again.');
        }
    };

    const handleStatusChange = (newStatus) => {
        setProductionStatus(newStatus);
    };

    const getProductionStatusDisplay = () => {
        if (originalOrder.status?.delivery) return originalOrder.status?.delivery;
        return 'Payment Pending';
    };

    const handleCopyUPI = () => {
        navigator.clipboard.writeText('your.upi@bank')
            .then(() => alert('UPI ID copied!'))
            .catch(err => console.error('Failed to copy:', err));
    };

    if (!originalOrder) {
        return <div>No order details available</div>;
    }

    return (
        <div className="admin-order">
            <div className="top-section-container">
                {/* Status Section with both order and production status */}
                <div className="status-section">
                    <div className="section-header">
                        <h2>Status</h2>
                    </div>
                    <div className="status-group">
                        <div className="status-row">
                            <span className="status-label">Order:</span>
                            <div className="current-status" data-status={originalOrder.status?.place}>
                                {originalOrder.status?.place}
                            </div>
                        </div>
                        <div className="status-row">
                            <span className="status-label">Production:</span>
                            <div className="current-status production-status" data-status={getProductionStatusDisplay()}>
                                {getProductionStatusDisplay() || 'Pending Approval'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Updated Delivery Section */}
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

                {/* Updated Customer Details Section */}
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
                <h1 className="order-title">Order #{originalOrder?.id}</h1>
                <div className="header-actions">
                    <button className="place-order-btn" onClick={handleAddItem}>
                        Add Item
                    </button>
                </div>
            </div>

            <table className="order-table">
                {placeOrderList.length > 0 && (
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Fabric</th>
                            <th>Profile</th>
                            <th>Dimension</th>
                            <th style={{ textAlign: 'center' }}>Quantity</th>
                            <th style={{ textAlign: 'center' }}>Calculated Size</th>
                            <th style={{ textAlign: 'right' }}>Price</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                )}
                <tbody>
                    {placeOrderList.map(order => (
                        <tr key={order.id}>
                            <td>{order.type}</td>
                            <td>{order.Fabric1} {order.Fabric2 ? `- ${order.Fabric2}` : ''}</td>
                            <td>{order.Profile}</td>
                            <td>W {order.Width}cm / L {order.Length}cm</td>
                            <td style={{ textAlign: 'center' }}>{order.Quantity}</td>
                            <td style={{ textAlign: 'center' }}>{order.calculatedDimension.toFixed(2)} Sq. mtr.</td>
                            <td style={{ textAlign: 'right' }}>₹{order.Price}</td>
                            <td style={{ textAlign: 'right' }}>₹{(order.Price * order.calculatedDimension).toFixed(2)}</td>
                            <td>
                                <div className="action-buttons">
                                    <button className="edit-btn" onClick={() => handleEdit(order)}>
                                        Edit
                                    </button>
                                    <button className="delete-btn" onClick={() => handleDelete(order.id)}>
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
                                <td style={{ textAlign: 'center' }}>
                                    <strong>{calculateTotalQuantity()}</strong>
                                </td>
                                <td colSpan="1"></td>
                                <td className="text-right"><strong>Subtotal</strong></td>
                                <td style={{ textAlign: 'right' }}><strong>₹{calculateSubTotal().toFixed(2)}</strong></td>
                                <td></td>
                            </tr>
                            {!isCashPayment && Object.entries(calculateGSTByRate()).map(([rate, amount]) => (
                                <tr key={rate} className="total-row gst">
                                    <td colSpan="6"></td>
                                    <td className="text-right"><strong>GST @{rate}%</strong></td>
                                    <td style={{ textAlign: 'right' }}><strong>₹{amount.toFixed(2)}</strong></td>
                                    <td></td>
                                </tr>
                            ))}
                            <tr className="total-row grand-total">
                                <td colSpan="6"></td>
                                <td className="text-right"><strong>Total</strong></td>
                                <td style={{ textAlign: 'right' }}><strong>₹{calculateTotal().toFixed(2)}</strong></td>
                                <td></td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>

            {/* Updated Payment Section */}
            <div className="payment-section">
                <h2>Payment Details</h2>
                <div className="payment-details-container">
                    <div className="payment-info-left">
                        <div className="payment-summary-container">
                            <div className="payment-summary-box">
                                <div className="summary-item">
                                    <strong>Required Amount:</strong>
                                    <span>₹{requiredAmount}</span>
                                </div>
                                <div className="summary-item">
                                    <strong>Total Received:</strong>
                                    <span>₹{calculateTotalPaid()}</span>
                                </div>
                                <div className="summary-item">
                                    <strong>Due Amount:</strong>
                                    <span>₹{calculateDueAmount()}</span>
                                </div>
                            </div>

                            {calculateDueAmount() > 0 && (
                                <div className="payment-instructions-box">
                                    <div className="instructions-content">
                                        <div className="account-details">
                                            <h4>Bank Account Details</h4>
                                            <p>Account Name: Aakash Patidar</p>
                                            <p>Account Number: XXXXXXXXXXXXX</p>
                                            <p>IFSC Code: XXXXXXXXX</p>
                                        </div>
                                        <div className="upi-details">
                                            <h4>UPI Payment</h4>
                                            <div className="qr-code">
                                                <img 
                                                    src={qrCode}
                                                    alt="Payment QR Code"
                                                    style={{ width: '150px', height: '150px' }}
                                                />
                                                <div className="upi-id-container">
                                                    <span className="upi-id">1010101010@ybl</span>
                                                    <button 
                                                        className="copy-button"
                                                        onClick={handleCopyUPI}
                                                        title="Copy UPI ID"
                                                    >
                                                        📋
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {originalOrder.payment_details?.payments?.length > 0 && (
                        <div className="payment-history-right">
                            <h3>Payment History</h3>
                            <div className="transaction-list">
                                {originalOrder.payment_details.payments.map(txn => (
                                    <div key={txn.id} className="transaction-item">
                                        <span>{new Date(txn.date).toLocaleDateString()}</span>
                                        <span>{txn.method}</span>
                                        <span>₹{txn.amount}</span>
                                        {txn.notes && <span>Notes: {txn.notes}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Production Status Section */}
            {originalOrder.status?.place === 'Accepted' && 
             (originalOrder.status?.startCredit === true || 
              originalOrder.status?.startProduction === true || 
              calculateTotalPaid() >= originalOrder.payment_details?.requiredAmount) && (
                <div className="production-section">
                    <h2>Production Status</h2>
                    <div className="status-options">
                        <label className="status-option">
                            <input
                                type="radio"
                                name="production_status"
                                value="Under Process"
                                checked={productionStatus === 'Under Process'}
                                onChange={(e) => handleStatusChange(e.target.value)}
                            />
                            Under Process
                        </label>
                        <label className="status-option">
                            <input
                                type="radio"
                                name="production_status"
                                value="Ready to Dispatch"
                                checked={productionStatus === 'Ready to Dispatch'}
                                onChange={(e) => handleStatusChange(e.target.value)}
                            />
                            Ready to Dispatch
                        </label>
                        {(calculateTotalPaid() >= calculateTotal() || originalOrder.status?.startCredit === true) && (
                            <label className="status-option">
                                <input
                                    type="radio"
                                    name="production_status"
                                    value="Dispatched"
                                    checked={productionStatus === 'Dispatched'}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                />
                                Dispatched
                            </label>
                        )}
                    </div>
                    {productionStatus === 'Dispatched' && (
                        <div className="address-input-container">
                            <label>Dispatch Details</label>
                            <input
                                type="text"
                                className="enhanced-address-input"
                                value={dispatchDetails}
                                onChange={(e) => setDispatchDetails(e.target.value)}
                                placeholder="Enter Dispatch Details"
                            />
                        </div>
                    )}
                </div>
            )}

            <ItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                isEditing={!!selectedItem?.id}
            />

            {/* Add Update Order Button */}
            <div className="place-order-container">
                <button
                    className="place-order-btn confirm-order"
                    onClick={handleUpdateOrder}
                >
                    Update Order
                </button>
            </div>
        </div>
    );
}

export default UpdateOrder;