import React, { useState, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import '../Styles/manage-prices.css';

function ManagePrices() {
    const { dealers, specifications, fetchDealers, fetchSpecifications, updateDealer } = useOrders();
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [pricing, setPricing] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDealers();
        fetchSpecifications();
    }, []);

    useEffect(() => {
        if (selectedDealer) {
            setPricing(selectedDealer.pricing || {});
        }
    }, [selectedDealer]);

    const handleDealerSelect = (dealer) => {
        setSelectedDealer(dealer);
        setPricing(dealer.pricing || {});
    };

    const handlePriceChange = (specId, value) => {
        setPricing(prev => ({
            ...prev,
            [specId]: parseFloat(value) || 0
        }));
    };

    const handleSavePricing = async () => {
        if (!selectedDealer) return;

        setLoading(true);
        try {
            await updateDealer(selectedDealer.id, {
                ...selectedDealer,
                pricing
            });
            alert('Pricing updated successfully!');
        } catch (error) {
            console.error('Error updating pricing:', error);
            alert('Failed to update pricing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="manage-prices">
            <h2>Manage Product Prices</h2>
            
            <div className="dealer-selection">
                <h3>Select Dealer</h3>
                <select 
                    onChange={(e) => handleDealerSelect(dealers[e.target.value])}
                    value={dealers.findIndex(d => d.id === selectedDealer?.id) || ''}
                >
                    <option value="">Select a dealer</option>
                    {dealers.map((dealer, index) => (
                        dealer.role !== 'admin' && (
                            <option key={dealer.id} value={index}>
                                {dealer.name}
                            </option>
                        )
                    ))}
                </select>
            </div>

            {selectedDealer && (
                <div className="pricing-table">
                    <h3>Set Prices for {selectedDealer.name}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Product Type</th>
                                <th>Price per Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {specifications.map(spec => (
                                <tr key={spec.id}>
                                    <td>{spec.type_name}</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={pricing[spec.id] || ''}
                                            onChange={(e) => handlePriceChange(spec.id, e.target.value)}
                                            placeholder="Enter price"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button 
                        className="save-button"
                        onClick={handleSavePricing}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Prices'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default ManagePrices;
