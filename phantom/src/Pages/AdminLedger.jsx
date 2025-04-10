import React, { useState, useEffect } from 'react';
import { getAdminLedger } from '../api/api';
import '../styles/AdminLedger.css';

function AdminLedger() {
    const [ledgerList, setLedgerList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAdminLedger = async () => {
            try {
                setLoading(true);
                const data = await getAdminLedger();
                setLedgerList(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminLedger();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '-');
    };

    const calculateClosingBalance = () => {
        return ledgerList.reduce((balance, entry) => {
            return balance + (parseFloat(entry.credit || 0) - parseFloat(entry.debit || 0));
        }, 0);
    };

    const calculateTotalDebit = () => {
        return ledgerList.reduce((total, entry) => {
            return total + parseFloat(entry.debit || 0);
        }, 0);
    };

    const calculateTotalCredit = () => {
        return ledgerList.reduce((total, entry) => {
            return total + parseFloat(entry.credit || 0);
        }, 0);
    };

    if (loading) return <div>Loading ledger data...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="admin-ledger">
            <h1>Admin Ledger</h1>
            <div className="ledger-table">
                {ledgerList.length === 0 ? (
                    <p>No ledger entries found.</p>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Dealer Name</th>
                                    <th>Order Number</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerList.map((entry, index) => (
                                    <tr key={index}>
                                        <td>{formatDate(entry.date)}</td>
                                        <td>{entry.dealer_name}</td>
                                        <td>{entry.order_number}</td>
                                        <td className="amount debit">
                                            {entry.debit ? `₹${parseFloat(entry.debit).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="amount credit">
                                            {entry.credit ? `₹${parseFloat(entry.credit).toFixed(2)}` : '-'}
                                        </td>
                                        <td>{entry.note}</td>
                                    </tr>
                                ))}
                                <tr className="summary-row totals">
                                    <td colSpan="3"><strong>Totals</strong></td>
                                    <td className="amount debit">
                                        <strong>₹{calculateTotalDebit().toFixed(2)}</strong>
                                    </td>
                                    <td className="amount credit">
                                        <strong>₹{calculateTotalCredit().toFixed(2)}</strong>
                                    </td>
                                    <td></td>
                                </tr>
                                <tr className="summary-row">
                                    <td colSpan="3"><strong>Closing Balance</strong></td>
                                    <td colSpan="2" className="closing-balance">
                                        ₹{calculateClosingBalance().toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminLedger;