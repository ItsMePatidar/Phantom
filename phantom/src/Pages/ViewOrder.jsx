import React from 'react';
import { useLocation } from 'react-router-dom';
import qrCode from '../Components/qr_code.png'; // Add your QR code image
import '../Styles/home.css';

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

    const PAYMENT_DETAILS = {
        UPI_ID: '9001551209-2@ybl',
        ACCOUNT_NAME: 'Aakash Patidar',
        ACCOUNT_NUMBER: '910010028690177',
        IFSC_CODE: 'UTIB0000043'
    };

    const handleCopyText = (text, label) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
    };

    if (!order) return <div>No order found</div>;

    return (
        <div className="home">
            <h1 className="order-title">Order Details #{order?.id}</h1>
            
            {/* Item Details Table */}
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
                    {Object.entries(calculateGSTByRate()).map(([rate, amount]) => (
                        <tr key={rate} className="total-row gst">
                            <td colSpan="6"></td>
                            <td className="text-right"><strong>GST @{rate}%</strong></td>
                            <td style={{textAlign:'right'}}><strong>₹{amount.toFixed(2)}</strong></td>
                        </tr>
                    ))}
                    <tr className="total-row grand-total">
                        <td colSpan="6"></td>
                        <td className="text-right"><strong>Total</strong></td>
                        <td style={{textAlign:'right'}}><strong>₹{order.total.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>

            {/* Delivery Details */}
            <div className="delivery-section">
                <h2>Delivery Details</h2>
                <div className="delivery-info">
                    <p><strong>Delivery Type:</strong> {
                        order.delivery?.type === 'self' ? 'Self Pickup' :
                        order.delivery?.type === 'local' ? 'Local Transport' :
                        'Courier Service'
                    }</p>
                    {order.delivery?.address && (
                        <p><strong>Delivery Address:</strong> {order.delivery.address}</p>
                    )}
                </div>
            </div>

            {/* Payment Details */}
            <div className="payment-section">
                <h2>Payment Details</h2>
                {order.isCashPayment && (
                    <p><strong>Payment Type:</strong> Cash Payment (No GST)</p>
                )}
                <div className="payment-info">
                    <p><strong>Required Amount:</strong> ₹{order.requiredAmount || order.total}</p>
                    {order.payments && order.payments.length > 0 && (
                        <div className="payment-history">
                            <h3>Payment History</h3>
                            <div className="transaction-list">
                                {order.payments.map(txn => (
                                    <div key={txn.id} className="transaction-item">
                                        <span>{new Date(txn.date).toLocaleDateString()}</span>
                                        <span>{txn.method}</span>
                                        <span>₹{txn.amount}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="payment-summary">
                                <p><strong>Total Paid:</strong> ₹{order.payments.reduce((sum, txn) => sum + txn.amount, 0)}</p>
                                <p><strong>Status:</strong> {order.status?.payment || 'Pending'}</p>
                            </div>
                        </div>
                    )}
                </div>
                {order.status?.payment !== 'Full Payment Received' && (
                    <div className="payment-info-box">
                        <h3>Make Payment</h3>
                        <div className="payment-methods">
                            <div className="upi-section">
                                <img src={qrCode} alt="Payment QR Code" className="payment-qr" />
                                <p>Scan QR code or use UPI ID:</p>
                                <div className="payment-detail" onClick={() => handleCopyText(PAYMENT_DETAILS.UPI_ID, 'UPI ID')}>
                                    <span>{PAYMENT_DETAILS.UPI_ID}</span>
                                    <button className="copy-button">Copy</button>
                                </div>
                            </div>
                            <div className="bank-section">
                                <h4>Bank Account Details</h4>
                                <div className="payment-detail" onClick={() => handleCopyText(PAYMENT_DETAILS.ACCOUNT_NAME, 'Account Name')}>
                                    <span><strong>Account Holder:</strong> {PAYMENT_DETAILS.ACCOUNT_NAME}</span>
                                    <button className="copy-button">Copy</button>
                                </div>
                                <div className="payment-detail" onClick={() => handleCopyText(PAYMENT_DETAILS.ACCOUNT_NUMBER, 'Account Number')}>
                                    <span><strong>Account Number:</strong> {PAYMENT_DETAILS.ACCOUNT_NUMBER}</span>
                                    <button className="copy-button">Copy</button>
                                </div>
                                <div className="payment-detail" onClick={() => handleCopyText(PAYMENT_DETAILS.IFSC_CODE, 'IFSC Code')}>
                                    <span><strong>IFSC Code:</strong> {PAYMENT_DETAILS.IFSC_CODE}</span>
                                    <button className="copy-button">Copy</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Production Status */}
            <div className="production-section">
                <h2>Production Status</h2>
                <p><strong>Current Status:</strong> {
                    order.status?.delivery === 'Under Process' ? 'Under Process' :
                    order.status?.delivery === 'Ready to Dispatch' ? 'Ready to Dispatch' :
                    order.status?.delivery === 'Dispatched' ? 'Dispatched' :
                    order.status?.delivery === 'Delivered' ? 'Delivered' :
                    'Under Process'
                }</p>
            </div>
        </div>
    );
}

export default ViewOrder;
