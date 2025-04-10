import React, { useState, useEffect } from 'react';
import '../Styles/SpecificationModal.css'; // Assuming you have a CSS file for styling

function SpecificationModal({ isOpen, onClose, specification, onSave }) {
    const [formData, setFormData] = useState({
        type_name: '',
        fabric_selection: 'dropdown',
        fabric_count: 1,
        fabric_options: [],
        profiles: [],
        min_fabric: 'area',
        min_fabric_value: 1,
        tax: 0
    });

    const [fabricOption, setFabricOption] = useState('');
    const [profile, setProfile] = useState('');

    useEffect(() => {
        if (specification) {
            setFormData(specification);
        }
    }, [specification]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'fabric_count' || name === 'min_fabric_value' || name === 'tax'
                ? Number(value)
                : value
        }));
    };

    const addFabricOption = () => {
        if (fabricOption && !formData.fabric_options.includes(fabricOption)) {
            setFormData(prev => ({
                ...prev,
                fabric_options: [...prev.fabric_options, fabricOption]
            }));
            setFabricOption('');
        }
    };

    const addProfile = () => {
        if (profile && !formData.profiles.includes(profile)) {
            setFormData(prev => ({
                ...prev,
                profiles: [...prev.profiles, profile]
            }));
            setProfile('');
        }
    };

    const removeFabricOption = (option) => {
        setFormData(prev => ({
            ...prev,
            fabric_options: prev.fabric_options.filter(item => item !== option)
        }));
    };

    const removeProfile = (profileItem) => {
        setFormData(prev => ({
            ...prev,
            profiles: prev.profiles.filter(item => item !== profileItem)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSave(formData);  // Changed from onSave(specification?.id, formData)
            onClose();
        } catch (error) {
            console.error('Error saving specification:', error);
            alert('Failed to save specification');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{specification ? 'Edit' : 'Add'} Specification</h2>
                <form onSubmit={handleSubmit} className="specification-form">
                    <div className="form-group">
                        <label>Type Name:</label>
                        <input
                            type="text"
                            name="type_name"
                            value={formData.type_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Fabric Selection Type:</label>
                        <select
                            name="fabric_selection"
                            value={formData.fabric_selection}
                            onChange={handleChange}
                            required
                        >
                            <option value="dropdown">Dropdown</option>
                            <option value="manual">Manual Input</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Fabric Count:</label>
                        <input
                            type="number"
                            name="fabric_count"
                            value={formData.fabric_count}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>

                    {formData.fabric_selection === 'dropdown' && (
                        <div className="form-group">
                            <label>Fabric Options:</label>
                            <div className="add-option-group">
                                <input
                                    type="text"
                                    value={fabricOption}
                                    onChange={(e) => setFabricOption(e.target.value)}
                                    placeholder="Enter fabric option"
                                />
                                <button type="button" onClick={addFabricOption}>Add</button>
                            </div>
                            <div className="options-list">
                                {formData.fabric_options.map((option, index) => (
                                    <div key={index} className="option-item">
                                        <span>{option}</span>
                                        <button type="button" onClick={() => removeFabricOption(option)}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Profiles:</label>
                        <div className="add-option-group">
                            <input
                                type="text"
                                value={profile}
                                onChange={(e) => setProfile(e.target.value)}
                                placeholder="Enter profile"
                            />
                            <button type="button" onClick={addProfile}>Add</button>
                        </div>
                        <div className="options-list">
                            {formData.profiles.map((prof, index) => (
                                <div key={index} className="option-item">
                                    <span>{prof}</span>
                                    <button type="button" onClick={() => removeProfile(prof)}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Minimum Fabric Type:</label>
                        <select
                            name="min_fabric"
                            value={formData.min_fabric}
                            onChange={handleChange}
                            required
                        >
                            <option value="area">Area</option>
                            <option value="length">Length</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Minimum Fabric Value:</label>
                        <input
                            type="number"
                            name="min_fabric_value"
                            value={formData.min_fabric_value}
                            onChange={handleChange}
                            step="0.1"
                            min="0"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tax (%):</label>
                        <input
                            type="number"
                            name="tax"
                            value={formData.tax}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            required
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

export default SpecificationModal;
