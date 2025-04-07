import React from 'react';

function ItemModal({ isOpen, onClose, onSave, selectedItem, setSelectedItem, isEditing }) {
    if (!isOpen) return null;

    const specification = {
        'Honeycomb Skylight': {
            fabric_selection: 'dropdown',
            fabric_count: 1,
            fabric_options: ['SL01', 'SL02', 'SL03', 'SL04', 'SL05', 'SL06', 'SL07', 'Other'],
            profiles: ['White', 'Dark Gray', 'Customised'],
            min_fabric: 'area',
            min_fabric_value: 2.5,
            tax: 12
        },
        'Bottom Up Blinds': {
            fabric_selection: 'dropdown',
            fabric_count: 1,
            fabric_options: ['RD01', 'RD02', 'RD03', 'RD04', 'RD05', 'RD06', 'RD07', 'RD08', 'LF01', 'LF02', 'LF03', 'LF04', 'LF05', 'LF06', 'LF07', 'SH01', 'SH02', 'Other'],
            profiles: ['White', 'Gray', 'Brown', 'Customised'],
            min_fabric: 'length',
            min_fabric_value: 1,
            tax: 18
        },
        'Day Night Blinds': {
            fabric_selection: 'manual',
            fabric_count: 2,
            profiles: ['White', 'Customised'],
            min_fabric: 'length',
            min_fabric_value: 1,
        },
    };

    // Render fabric inputs based on selected type
    const renderFabricInputs = () => {
        if (!selectedItem.type) return null;

        const itemSpec = specification[selectedItem.type];
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const itemSpec = specification[selectedItem.type];
        let calculatedDimension;
        
        if (itemSpec.min_fabric === 'area') {
            calculatedDimension = Math.max(itemSpec.min_fabric_value, (selectedItem.Width * selectedItem.Length) / 10000) * selectedItem.Quantity;
        } else {
            calculatedDimension = (Math.max(itemSpec.min_fabric_value, selectedItem.Width/100)) * (Math.max(itemSpec.min_fabric_value, selectedItem.Length/100)) * selectedItem.Quantity;
        }

        onSave({
            ...selectedItem,
            id: selectedItem.id || Date.now(), // Keep existing ID when editing
            Price: 100,
            tax: itemSpec.tax || 0, // Get tax rate from specification
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
                            {Object.keys(specification).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    {renderFabricInputs()}
                    <div className="form-group">
                        <label>Profile:</label>
                        <select name="Profile" value={selectedItem.Profile} onChange={handleChange} required>
                            <option value="">Select Profile</option>
                            {(specification[selectedItem.type]?.profiles || []).map(profile => (
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
