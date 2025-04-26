import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ItemModal from '../Components/ItemModal';
import { useOrders } from '../context/OrderContext';
// import '../Styles/home.css';
import '../Styles/AdminOrder.css';

function AdminOrder() {
    const [placeOrderList, setPlaceOrderList] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState();
    const { updateOrderById } = useOrders();
    const navigate = useNavigate();
    const location = useLocation();
    const originalOrder = location.state?.viewOrder;
    const { dealer } = location.state;
    const [deliveryType, setDeliveryType] = useState(originalOrder.shipping_address?.type);
    const [address, setAddress] = useState(originalOrder.shipping_address?.address);
    const [requiredAmount, setRequiredAmount] = useState('');
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionNote, setTransactionNote] = useState('');
    const [transactions, setTransactions] = useState(originalOrder.payment_details?.payments || []);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState({
        method: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '' // Add notes field
    });
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [productionStatus, setProductionStatus] = useState(originalOrder?.status?.delivery || '');
    const [dispatchDetails, setDispatchDetails] = useState(originalOrder?.status?.dispatch_details || '');
    const [isCashPayment, setIsCashPayment] = useState(originalOrder?.is_cash_payment || false);
    const [orderStatus, setOrderStatus] = useState(originalOrder?.status?.place || 'Waiting for Approval');
    const [startProduction, setStartProduction] = useState(originalOrder?.status?.startProduction || false);
    const [startCredit, setStartCredit] = useState(originalOrder?.status?.startCredit || false);
    const [customerDetails, setCustomerDetails] = useState(originalOrder?.customer_details || {
        name: '',
        address: '',
        phone: ''
    });
    const [isCustomerExpanded, setIsCustomerExpanded] = useState(false);

    useEffect(() => {
        if (originalOrder) {
            console.log('originalOrder', originalOrder);

            setPlaceOrderList(originalOrder.items);
            setDeliveryType(originalOrder.shipping_address?.type || 'self');
            setAddress(originalOrder.shipping_address?.address || dealer?.address || '');
            // Update this line to correctly get the required amount from payment_details
            setRequiredAmount(originalOrder.payment_details?.requiredAmount?.toString() || String(originalOrder.total_amount));
            setTransactions(originalOrder.payment_details?.payments || []);
            setIsCashPayment(originalOrder.is_cash_payment || false);
        } else if (dealer?.address) {
            setAddress(dealer.address);
        }
    }, [originalOrder, dealer]);

    // Comment out or remove this useEffect as it's overriding the required amount from database
    // useEffect(() => {
    //     setRequiredAmount(String(calculateTotal()));
    // }, [placeOrderList, isCashPayment]);

    const handleAddItem = () => {
        setIsModalOpen(true);
        setSelectedItem({
            id: '',
            type: '',
            Fabric1: '',
            Fabric2: '',
            Profile: '',
            Length: '',  // Changed from Height
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
        const subtotal = calculateSubTotal();
        if (isCashPayment) {
            return subtotal; // Return only subtotal for cash payments
        }
        return subtotal + Object.values(calculateGSTByRate()).reduce((a, b) => a + b, 0);
    };

    const calculateTotalQuantity = () => {
        return placeOrderList.reduce((total, order) => {
            return total + Number(order.Quantity);
        }, 0);
    };

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
                customerDetails: {
                    name: customerDetails.name,
                    address: customerDetails.address,
                    phone: customerDetails.phone
                },
                status: {
                    place: orderStatus,
                    payment: calculatePaymentStatus(transactions, requiredAmount),
                    delivery: productionStatus,
                    final: calculateFinalStatus(orderStatus, calculatePaymentStatus(transactions, requiredAmount), productionStatus),
                    startProduction: startProduction,
                    startCredit: startCredit,
                    dispatch_details: productionStatus === 'Dispatched' ? dispatchDetails : ''
                },
                paymentDetails: {
                    requiredAmount: parseFloat(requiredAmount),
                    payments: transactions
                },
            };

            await updateOrderById(originalOrder.id, updatedOrderData);
            alert('Order updated successfully!');
            navigate('/order-history');
        } catch (error) {
            console.error('Failed to update order:', error);
            alert('Failed to update order. Please try again.');
        }
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        let updatedTransactions;

        if (editingTransaction) {
            updatedTransactions = transactions.map(t =>
                t.id === editingTransaction.id
                    ? {
                        ...t,
                        method: paymentDetails.method,
                        amount: parseFloat(paymentDetails.amount),
                        date: new Date(paymentDetails.date).toISOString(),
                        notes: paymentDetails.notes // Include notes in updated transaction
                    }
                    : t
            );
        } else {
            updatedTransactions = [...transactions, {
                id: Date.now(),
                amount: parseFloat(paymentDetails.amount),
                date: new Date(paymentDetails.date).toISOString(),
                method: paymentDetails.method,
                notes: paymentDetails.notes // Include notes in new transaction
            }];
        }

        setTransactions(updatedTransactions);

        // Reset form and close modal
        setPaymentDetails({
            method: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            notes: '' // Reset notes field
        });
        setEditingTransaction(null);
        setIsPaymentModalOpen(false);
    };

    const handleEditTransaction = (transaction) => {
        setEditingTransaction(transaction);
        setPaymentDetails({
            method: transaction.method,
            amount: transaction.amount,
            date: new Date(transaction.date).toISOString().split('T')[0],
            notes: transaction.notes || '' // Populate notes field
        });
        setIsPaymentModalOpen(true);
    };

    const handleDeleteTransaction = (transactionId) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            const updatedTransactions = transactions.filter(t => t.id !== transactionId);
            setTransactions(updatedTransactions);
        }
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
        return productionStatus;
    }

    const calculateTotalPaid = () => {
        return transactions.reduce((sum, txn) => sum + txn.amount, 0);
    };

    const handleStatusChange = (newStatus) => {
        setProductionStatus(newStatus);
    };

    const handleStatusClick = (status) => {
        setOrderStatus(status);
    };

    return (
        <>
            <div className="home">
                <div className="top-section-container">
                    <div className="dealer-info">
                        <h3>Dealer Info</h3>
                        <p><strong>Name:</strong> {dealer.name}</p>
                        <p><strong>Ph:</strong> {dealer.phone}</p>
                        <p><strong>GST:</strong> {dealer.gst_no}</p>
                        <p><strong>Address:</strong> {dealer.address}</p>
                    </div>
                    
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
                        {deliveryType !== 'self' && (
                            <div className="address-input-container">
                                <input
                                    type="text"
                                    className="enhanced-address-input"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter delivery address..."
                                    required={deliveryType !== 'self'}
                                />
                            </div>
                        )}
                    </div>

                    <div className="customer-details-section">
                        <h2>Customer Details</h2>
                        <div className="customer-details-content">
                            <ul className="customer-info-list">
                                <li className="customer-info-item">
                                    <span className="customer-info-label">Name:</span>
                                    <span>{customerDetails.name || 'Not provided'}</span>
                                </li>
                                <li className="customer-info-item">
                                    <span className="customer-info-label">Phone:</span>
                                    <span>{customerDetails.phone || 'Not provided'}</span>
                                </li>
                                <li className="customer-info-item">
                                    <span className="customer-info-label">Address:</span>
                                    <span>{customerDetails.address || 'Not provided'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {placeOrderList.length > 0 && (
                    <div className="order-status-section">
                        <div className="status-header">
                            <h2>Order Status</h2>
                            <div className="current-status" data-status={orderStatus}>
                                {orderStatus}
                            </div>
                        </div>
                        <div className="status-buttons">
                            <button
                                className={`status-button accepted ${orderStatus === 'Accepted' ? 'selected' : ''}`}
                                onClick={() => handleStatusClick('Accepted')}
                            >
                                Accept
                            </button>
                            <button
                                className={`status-button rejected ${orderStatus === 'Rejected' ? 'selected' : ''}`}
                                onClick={() => handleStatusClick('Rejected')}
                            >
                                Reject
                            </button>
                            <button
                                className={`status-button waiting ${orderStatus === 'Waiting for Change' ? 'selected' : ''}`}
                                onClick={() => handleStatusClick('Waiting for Change')}
                            >
                                Request Changes
                            </button>
                        </div>
                    </div>
                )}

                <div className="header-container">
                    <h1 className="order-title">Update Order #{originalOrder?.id}</h1>
                    <div className="header-actions">
                        <label className="cash-toggle">
                            <input
                                type="checkbox"
                                checked={isCashPayment}
                                onChange={(e) => setIsCashPayment(e.target.checked)}
                            />
                            Cash Payment (No GST)
                        </label>
                        <button className="place-order-btn" onClick={handleAddItem}>
                            Add Item
                        </button>
                    </div>
                </div>

                <table className="order-table">
                    {placeOrderList.length > 0 && (<thead>
                        <tr>
                            <th>Type</th>
                            <th>Fabric</th>
                            <th>Profile</th>
                            <th>Dimension</th>
                            <th style={{ textAlign: 'center' }}>Quantity</th>
                            <th style={{ textAlign: 'center' }}>Calculated Size</th>
                            <th style={{ textAlign: 'right' }}>Price</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                            {/* <th style={{ textAlign: 'right' }}>Discount</th> */}
                            <th>Actions</th>
                        </tr>
                    </thead>)}
                    <tbody>
                        {placeOrderList && placeOrderList.map(order => (
                            <tr key={order.id}>
                                <td>{order.type}</td>
                                <td>{order.Fabric1} {order.Fabric2 ? `- ${order.Fabric2}` : ''}</td>
                                <td>{order.Profile}</td>
                                <td>W {order.Width}cm / L {order.Length}cm</td>
                                <td style={{ textAlign: 'center' }}>{order.Quantity}</td>
                                <td style={{ textAlign: 'center' }}>{order.calculatedDimension.toFixed(2)} Sq. mtr.</td>
                                <td style={{ textAlign: 'right' }}>₹{order.Price}</td>
                                <td style={{ textAlign: 'right' }}>₹{(order.Price * order.calculatedDimension).toFixed(2)}</td>
                                {/* <th style={{ textAlign: 'right' }}>₹{order.Discount}</th> */}
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

                <div className="payment-section">
                    <h2>Payment Details</h2>
                    <div className="payment-details-container">
                        <div className="payment-info-left">
                            <div className="payment-summary-box">
                                <div className="summary-item">
                                    <label>Required Amount (₹):</label>
                                    <input
                                        type="number"
                                        value={requiredAmount}
                                        onChange={(e) => setRequiredAmount(e.target.value)}
                                        placeholder="Enter required amount"
                                        className="payment-input"
                                    />
                                </div>
                                <div className="production-options">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={startProduction}
                                            onChange={(e) => setStartProduction(e.target.checked)}
                                        />
                                        Start Production
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={startCredit}
                                            onChange={(e) => setStartCredit(e.target.checked)}
                                        />
                                        Credit
                                    </label>
                                </div>
                                <button
                                    className="place-order-btn"
                                    onClick={() => setIsPaymentModalOpen(true)}
                                >
                                    Add Payment
                                </button>
                                <div className="payment-status">
                                    <p><strong>Total Received:</strong> ₹{calculateTotalPaid()}</p>
                                    <p><strong>Status:</strong> {originalOrder.status?.payment || 'Pending'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="payment-history-right">
                            <h3>Payment History</h3>
                            <div className="transaction-list">
                                {transactions.map(txn => (
                                    <div key={txn.id} className="transaction-item">
                                        <span>{new Date(txn.date).toLocaleDateString()}</span>
                                        <span>{txn.method}</span>
                                        <span>₹{txn.amount}</span>
                                        {txn.notes && <span>Notes: {txn.notes}</span>} {/* Display notes if available */}
                                        <div className="transaction-actions">
                                            <button
                                                className="edit-btn small"
                                                onClick={() => handleEditTransaction(txn)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="delete-btn small"
                                                onClick={() => handleDeleteTransaction(txn.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {isPaymentModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>{editingTransaction ? 'Edit Payment' : 'Add Payment'}</h2>
                            <form onSubmit={handlePaymentSubmit}>
                                <div className="form-group">
                                    <label>Payment Method:</label>
                                    <select
                                        value={paymentDetails.method}
                                        onChange={(e) => setPaymentDetails({
                                            ...paymentDetails,
                                            method: e.target.value
                                        })}
                                        required
                                    >
                                        <option value="">Select Method</option>
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount:</label>
                                    <input
                                        type="number"
                                        value={paymentDetails.amount}
                                        onChange={(e) => setPaymentDetails({
                                            ...paymentDetails,
                                            amount: e.target.value
                                        })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date:</label>
                                    <input
                                        type="date"
                                        value={paymentDetails.date}
                                        onChange={(e) => setPaymentDetails({
                                            ...paymentDetails,
                                            date: e.target.value
                                        })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Notes:</label>
                                    <textarea
                                        value={paymentDetails.notes}
                                        onChange={(e) => setPaymentDetails({
                                            ...paymentDetails,
                                            notes: e.target.value
                                        })}
                                        placeholder="Add payment notes (optional)"
                                        rows="3"
                                        className="payment-notes"
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setIsPaymentModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit">
                                        {editingTransaction ? 'Update Payment' : 'Add Payment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {orderStatus === 'Accepted' && (startCredit === true || startProduction === true || calculateTotalPaid() >= requiredAmount) && <div className="production-section">
                    <h2>Production Status</h2>
                    <div className="status-options">
                    <label className="status-option">
                            <input
                                type="radio"
                                name="production_status"
                                value="Not Started"
                                checked={productionStatus === 'Not Started'}
                                onChange={(e) => handleStatusChange(e.target.value)}
                            />
                            Not Started
                        </label>
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
                        {(calculateTotalPaid() >= calculateSubTotal() || startCredit === true) && <label className="status-option">
                            <input
                                type="radio"
                                name="production_status"
                                value="Dispatched"
                                checked={productionStatus === 'Dispatched'}
                                onChange={(e) => handleStatusChange(e.target.value)}
                            />
                            Dispatched
                        </label>}
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
                </div>}

                <div className="place-order-container">
                    <button
                        className="place-order-btn confirm-order"
                        onClick={handleUpdateOrder}
                    >
                        Update Order
                    </button>
                </div>
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

export default AdminOrder;
