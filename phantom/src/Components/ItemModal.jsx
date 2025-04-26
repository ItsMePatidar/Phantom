import React, { useEffect } from 'react';
import { useOrders } from '../context/OrderContext';

function ItemModal({ isOpen, onClose, onSave, selectedItem, setSelectedItem, isEditing }) {
    const { specifications, fetchSpecifications, isAdmin, currentDealer } = useOrders();

    useEffect(() => {
        fetchSpecifications();
    }, []);

    if (!isOpen) return null;

    // Convert specifications array to object format for easier access
    const specificationsMap = specifications.reduce((acc, spec) => {
        acc[spec.type_name] = {
            fabric_selection: spec.fabric_selection,
            fabric_count: spec.fabric_count,
            fabric_options: spec.fabric_options,
            profiles: spec.profiles,
            min_fabric: spec.min_fabric,
            min_fabric_value: spec.min_fabric_value,
            tax: spec.tax,
            product_type: spec.product_type
        };
        return acc;
    }, {});

    // Render fabric inputs based on selected type
    const renderFabricInputs = () => {
        if (!selectedItem.type) return null;

        const itemSpec = specificationsMap[selectedItem.type];
        if (!itemSpec) return null;

        return (
            <div className="fabrics-container">
                {Array.from({ length: itemSpec.fabric_count }).map((_, i) => {
                    const fabricKey = `Fabric${i + 1}`;
                    return (
                        <div className="form-group fabric-input" key={fabricKey}>
                            <label>{`Fabric ${i + 1}:`}</label>
                            {itemSpec.fabric_selection === 'manual' ? (
                                <input 
                                    type="text" 
                                    name={fabricKey}
                                    value={selectedItem[fabricKey] || ''}
                                    onChange={handleChange}
                                    placeholder="Enter fabric code"
                                    required
                                />
                            ) : (
                                <select 
                                    name={fabricKey}
                                    value={selectedItem[fabricKey] || ''}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Fabric</option>
                                    {itemSpec.fabric_options.map(fabric => (
                                        <option key={fabric} value={fabric}>{fabric}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Update renderProductTypeFields function
    const renderProductTypeFields = () => {
        if (!selectedItem.type) return null;
        
        const itemSpec = specificationsMap[selectedItem.type];
        if (!itemSpec) return null;

        switch (itemSpec.product_type) {
            case 'SQM':
                return (
                    <>
                        <div className="form-group">
                            <label>Profile:</label>
                            <select name="Profile" value={selectedItem.Profile} onChange={handleChange} required>
                                <option value="">Select Profile</option>
                                {(itemSpec.profiles || []).map(profile => (
                                    <option key={profile} value={profile}>{profile}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Length (cm):</label>
                            <input 
                                type="number" 
                                name="Length" 
                                value={selectedItem.Length} 
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Width (cm):</label>
                            <input 
                                type="number" 
                                name="Width" 
                                value={selectedItem.Width} 
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </>
                );
            case 'PCS':
                return (
                    <>
                        <div className="form-group">
                            <label>Quantity:</label>
                            <input 
                                type="number" 
                                name="Quantity" 
                                value={selectedItem.Quantity} 
                                onChange={handleChange}
                                required
                                min="1"
                            />
                        </div>
                    </>
                );
            case 'UNT':
                return (
                    <>
                        <div className="form-group">
                            <label>Amount:</label>
                            <input 
                                type="number" 
                                name="Amount" 
                                value={selectedItem.Amount} 
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const itemSpec = specificationsMap[selectedItem.type];
        let calculatedDimension;
        
        if (itemSpec.min_fabric === 'area') {
            calculatedDimension = Math.max(itemSpec.min_fabric_value, (selectedItem.Width * selectedItem.Length) / 10000) * selectedItem.Quantity;
        } else {
            calculatedDimension = (Math.max(itemSpec.min_fabric_value, selectedItem.Width/100)) * (Math.max(itemSpec.min_fabric_value, selectedItem.Length/100)) * selectedItem.Quantity;
        }

        // Find the specification ID for the selected type
        const specId = specifications.find(spec => spec.type_name === selectedItem.type)?.id;
        const dealerPrice = currentDealer?.pricing?.[specId];

        // Check if price is configured
        if (!dealerPrice && !isAdmin(currentDealer)) {
            alert('Price not configured for this product. Please contact admin to set up pricing.');
            return;
        }

        onSave({
            ...selectedItem,
            id: selectedItem.id || Date.now(),
            Price: isAdmin(currentDealer) ? (selectedItem.Price || dealerPrice) : dealerPrice,
            tax: itemSpec.tax || 0,
            calculatedDimension
        });
        onClose();
    };

    const handleChange = (e) => {
        setSelectedItem({
            ...selectedItem,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{isEditing ? 'Edit Item' : 'Add New Item'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Type:</label>
                        <select name="type" value={selectedItem.type} onChange={handleChange} required>
                            <option value="">Select Type</option>
                            {specifications.map(spec => (
                                <option key={spec.type_name} value={spec.type_name}>
                                    {spec.type_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {renderFabricInputs()}
                    {renderProductTypeFields()}
                    {selectedItem.type && specificationsMap[selectedItem.type]?.product_type !== 'PCS' && (
                        <div className="form-group">
                            <label>Quantity:</label>
                            <input 
                                type="number" 
                                name="Quantity" 
                                value={selectedItem.Quantity} 
                                onChange={handleChange}
                                required
                                min="1"
                            />
                        </div>
                    )}
                    {isAdmin(currentDealer) && (
                        <div className="form-group">
                            <label>Price per Unit:</label>
                            <input 
                                type="number" 
                                name="Price" 
                                value={selectedItem.Price || ''} 
                                onChange={handleChange}
                                placeholder="Enter price per unit"
                                min="0"
                            />
                        </div>
                    )}
                    {isAdmin(currentDealer) && <div className="form-group">
                        <label>Discount:</label>
                        <input 
                            type="number" 
                            name="Discount" 
                            value={selectedItem.Discount} 
                            onChange={handleChange}
                            required
                            min="0"
                        />
                    </div>}
                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ItemModal;
