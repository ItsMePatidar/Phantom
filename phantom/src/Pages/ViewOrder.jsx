import React from 'react';
import { useLocation } from 'react-router-dom';
import qrCode from '../Components/qr_code.png';
import '../Styles/ViewOrder.css';

function ViewOrder() {
    const location = useLocation();
    const order = location.state?.viewOrder;

    const calculateSubTotal = () => {
        return order.items.reduce((total, item) => {
            return total + (item.Price * item.calculatedDimension);
        }, 0);
    };

    const calculateGSTByRate = () => {
        const gstRates = {};
        order.items.forEach(item => {
            if (item.tax) {
                const amount = item.Price * item.calculatedDimension;
                gstRates[item.tax] = (gstRates[item.tax] || 0) + (amount * item.tax / 100);
            }
        });
        return gstRates;
    };

    const calculateTotalQuantity = () => {
        return order.items.reduce((total, item) => {
            return total + Number(item.Quantity);
        }, 0);
    };

    const handleCopyUPI = () => {
        navigator.clipboard.writeText('your.upi@bank')
            .then(() => alert('UPI ID copied!'))
            .catch(err => console.error('Failed to copy:', err));
    };

    if (!order) return <div>No order found</div>;

    return (
        <div className="view-order">
            <div className="top-section-container">
                {/* Status Section */}
                <div className="status-section">
                    <div className="section-header">
                        <h2>Status</h2>
                    </div>
                    <div className="status-group">
                        <div className="status-row">
                            <span className="status-label">Order:</span>
                            <div className="current-status" data-status={order.status?.place}>
                                {order.status?.place}
                            </div>
                        </div>
                        <div className="status-row">
                            <span className="status-label">Production:</span>
                            <div className="current-status production-status" data-status={order.status?.delivery || 'Pending'}>
                                {order.status?.delivery || 'Pending'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery Section */}
                <div className="delivery-section">
                    <div className="section-header">
                        <h2>Delivery Details</h2>
                    </div>
                    <div className="delivery-info">
                        <p><strong>Delivery Type:</strong> {
                            order.shipping_address?.type === 'self' ? 'Self Pickup' :
                            order.shipping_address?.type === 'local' ? 'Local Transport' :
                            'Courier Service'
                        }</p>
                        {order.shipping_address?.address && (
                            <p><strong>Delivery Address:</strong> {order.shipping_address.address}</p>
                        )}
                    </div>
                </div>

                {/* Customer Details Section */}
                <div className="customer-details-section">
                    <div className="section-header">
                        <h2>Customer Details</h2>
                    </div>
                    <div className="customer-info-list">
                        <div className="customer-info-item">
                            <span className="customer-info-label">Name:</span>
                            <span>{order.customer_details?.name || 'Not provided'}</span>
                        </div>
                        <div className="customer-info-item">
                            <span className="customer-info-label">Address:</span>
                            <span>{order.customer_details?.address || 'Not provided'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="order-details">
                <h1 className="order-title">Order #{order?.id}</h1>
                
                {/* Items Table */}
                <table className="order-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Fabric</th>
                            <th>Profile</th>
                            <th>Dimension</th>
                            <th style={{textAlign:'center'}}>Quantity</th>
                            <th style={{textAlign:'center'}}>Calculated Size</th>
                            <th style={{textAlign:'right'}}>Price</th>
                            <th style={{textAlign:'right'}}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map(item => (
                            <tr key={item.id}>
                                <td>{item.type}</td>
                                <td>{item.Fabric1} {item.Fabric2 ? `- ${item.Fabric2}` : ''}</td>
                                <td>{item.Profile}</td>
                                <td>W {item.Width}cm / L {item.Length}cm</td>
                                <td style={{textAlign:'center'}}>{item.Quantity}</td>
                                <td style={{textAlign:'center'}}>{item.calculatedDimension.toFixed(2)} Sq. mtr.</td>
                                <td style={{textAlign:'right'}}>₹{item.Price}</td>
                                <td style={{textAlign:'right'}}>₹{(item.Price * item.calculatedDimension).toFixed(2)}</td>
                            </tr>
                        ))}
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
                        </tr>
                        {!order.is_cash_payment && Object.entries(calculateGSTByRate()).map(([rate, amount]) => (
                            <tr key={rate} className="total-row gst">
                                <td colSpan="6"></td>
                                <td className="text-right"><strong>GST @{rate}%</strong></td>
                                <td style={{textAlign:'right'}}><strong>₹{amount.toFixed(2)}</strong></td>
                            </tr>
                        ))}
                        <tr className="total-row grand-total">
                            <td colSpan="6"></td>
                            <td className="text-right"><strong>Total</strong></td>
                            <td style={{textAlign:'right'}}><strong>₹{parseFloat(order.total_amount).toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Payment Section */}
            <div className="payment-section">
                <h2>Payment Details</h2>
                <div className="payment-details-container">
                    <div className="payment-info-left">
                        <div className="payment-summary-container">
                            <div className="payment-summary-box">
                                {order.is_cash_payment && (
                                    <div className="summary-item">
                                        <strong>Payment Type:</strong> Cash Payment (No GST)
                                    </div>
                                )}
                                <div className="summary-item">
                                    <strong>Required Amount:</strong>
                                    <span>₹{order.payment_details?.requiredAmount}</span>
                                </div>
                                <div className="summary-item">
                                    <strong>Total Received:</strong>
                                    <span>₹{order.payment_details.payments?.reduce((sum, txn) => sum + txn.amount, 0) || 0}</span>
                                </div>
                                <div className="summary-item">
                                    <strong>Due Amount:</strong>
                                    <span>₹{order.total_amount - (order.payment_details.payments?.reduce((sum, txn) => sum + txn.amount, 0) || 0)}</span>
                                </div>
                            </div>

                            {order.status?.payment !== 'Payment Received' && (
                                <div className="payment-instructions-box">
                                    <div className="instructions-content">
                                        <div className="account-details">
                                            <h4>Bank Account Details</h4>
                                            <p>Account Name: Your Company Name</p>
                                            <p>Account Number: XXXXXXXXXXXXX</p>
                                            <p>IFSC Code: XXXXXXXXX</p>
                                            <p>Bank: Bank Name</p>
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

                    {order.payment_details?.payments?.length > 0 && (
                        <div className="payment-history-right">
                            <h3>Payment History</h3>
                            <div className="transaction-list">
                                {order.payment_details.payments.map(txn => (
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
            {/* {order.status?.delivery && (
                <div className="production-section">
                    <h2>Production Status</h2>
                    <div className="production-info">
                        <p><strong>Current Status:</strong> {order.status.delivery}</p>
                        {order.status.dispatch_details && (
                            <p><strong>Dispatch Details:</strong> {order.status.dispatch_details}</p>
                        )}
                    </div>
                </div>
            )} */}
        </div>
    );
}

export default ViewOrder;
