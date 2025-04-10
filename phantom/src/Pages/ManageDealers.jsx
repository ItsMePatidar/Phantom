import React, { useState, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import '../Styles/ManageDealers.css';

function ManageDealers() {
    const { dealers, addDealer, updateDealer, deleteDealer, fetchDealers } = useOrders();
    const [showModal, setShowModal] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        password: '',
        role: 'dealer',
        gst_no: '' // Add GST number field
    });

    useEffect(() => {
        fetchDealers(); // Fetch dealers when component mounts
    }, []);

    const handleAddNew = () => {
        setSelectedDealer(null);
        setFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            password: '',
            role: 'dealer',
            gst_no: '' // Add GST number field
        });
        setShowModal(true);
    };

    const handleEdit = (dealer) => {
        setSelectedDealer(dealer);
        setFormData({
            name: dealer.name,
            phone: dealer.phone,
            email: dealer.email || '',
            address: dealer.address || '',
            password: '',
            role: dealer.role,
            gst_no: dealer.gst_no || '' // Add GST number
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedDealer) {
                await updateDealer(selectedDealer.id, formData);
            } else {
                await addDealer(formData);
            }
            setShowModal(false);
        } catch (error) {
            console.error('Error saving dealer:', error);
            alert('Failed to save dealer');
        }
    };

    const handleDelete = async (dealerId) => {
        if (window.confirm('Are you sure you want to delete this dealer?')) {
            try {
                await deleteDealer(dealerId);
            } catch (error) {
                console.error('Error deleting dealer:', error);
                alert('Failed to delete dealer');
            }
        }
    };

    return (
        <div className="manage-dealers">
            <div className="page-header">
                <h1>Manage Dealers</h1>
                <button className="add-dealer-btn" onClick={handleAddNew}>
                    Add New Dealer
                </button>
            </div>

            <div className="dealers-list">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>GST No.</th> {/* Add new column */}
                            <th>Address</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dealers.map(dealer => (
                            <tr key={dealer.id}>
                                <td>{dealer.name}</td>
                                <td>{dealer.phone}</td>
                                <td>{dealer.email || '-'}</td>
                                <td>{dealer.gst_no || '-'}</td> {/* Add new column */}
                                <td>{dealer.address || '-'}</td>
                                <td>
                                    <button onClick={() => handleEdit(dealer)} className="edit-btn">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(dealer.id)} className="delete-btn">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>{selectedDealer ? 'Edit Dealer' : 'Add New Dealer'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name:</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone:</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email:</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>GST Number:</label>
                                <input
                                    type="text"
                                    value={formData.gst_no}
                                    onChange={(e) => setFormData({...formData, gst_no: e.target.value})}
                                    placeholder="Enter GST number"
                                />
                            </div>
                            <div className="form-group">
                                <label>Address:</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Password:</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required={!selectedDealer}
                                    placeholder={selectedDealer ? '(Leave blank to keep unchanged)' : ''}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageDealers;
