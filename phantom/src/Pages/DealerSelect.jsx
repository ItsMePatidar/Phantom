import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import logo from '../Components/logo.png';

function DealerSelect() {
    const { setCurrentDealer, searchDealer } = useOrders();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const dealerName = e.target.dealerName.value;
            const password = String(e.target.password.value);
            const dealer = await searchDealer(dealerName, password);
            
            if (dealer) {
                setCurrentDealer(dealer);
                navigate(dealer.role === 'admin' ? '/admin-dashboard' : '/dashboard');
            } else {
                setError('Invalid credentials. Please check your name and password.');
            }
        } catch (err) {
            setError('An error occurred while logging in.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dealer-select-page">
            <img src={logo} alt="Company Logo" className="logo" />
            <form onSubmit={handleSubmit} className="dealer-select-form">
                <h2>Login</h2>
                <div className="form-group">
                    <label htmlFor="dealerName">Dealer Name</label>
                    <input
                        type="text"
                        id="dealerName"
                        name="dealerName"
                        placeholder="Enter your name"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
}

export default DealerSelect;
