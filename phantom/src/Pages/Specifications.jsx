import React, { useEffect, useState } from 'react';
import { useOrders } from '../context/OrderContext';
import SpecificationModal from '../Components/SpecificationModal';
import '../Styles/Specifications.css'; // Assuming you have a CSS file for styling

function Specifications() {
    const { specifications, fetchSpecifications, addSpecification, updateSpecificationById, deleteSpecificationById } = useOrders();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSpec, setSelectedSpec] = useState(null);

    useEffect(() => {
        fetchSpecifications();
    }, []);

    const handleEdit = (spec) => {
        setSelectedSpec(spec);
        setIsModalOpen(true);
    };

    return (
        <div className="specifications-page">
            <div className="specifications-header">
                <h1>Product Specifications</h1>
                <button onClick={() => {
                    setSelectedSpec(null);
                    setIsModalOpen(true);
                }}>
                    Add New Specification
                </button>
            </div>

            <div className="specifications-table">
                <table>
                    <thead>
                        <tr>
                            <th>Type Name</th>
                            <th>Product Type</th>
                            <th>Fabric Selection</th>
                            <th>Fabric Count</th>
                            <th>Min Fabric</th>
                            <th>Tax (%)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {specifications.map(spec => (
                            <tr key={spec.id}>
                                <td>{spec.type_name}</td>
                                <td>{spec.product_type}</td>
                                <td>{spec.fabric_selection}</td>
                                <td>{spec.fabric_count}</td>
                                <td>{spec.min_fabric} ({spec.min_fabric_value})</td>
                                <td>{spec.tax}</td>
                                <td>
                                    <button onClick={() => handleEdit(spec)}>Edit</button>
                                    <button onClick={() => {
                                        if(window.confirm('Delete this specification?')) {
                                            deleteSpecificationById(spec.id);
                                        }
                                    }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <SpecificationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    specification={selectedSpec}
                    onSave={selectedSpec ? 
                        (data) => updateSpecificationById(selectedSpec.id, data) : 
                        addSpecification}
                />
            )}
        </div>
    );
}

export default Specifications;
