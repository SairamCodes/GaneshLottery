import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BookCoupon() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    village: '',
    coupon_count: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const couponPrice = 500;
  const totalAmount = formData.coupon_count * couponPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (formData.coupon_count < 1) {
      setError("Please select at least one coupon.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/orders', formData);
      navigate(`/payment/${response.data.order_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred while creating order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center">
      <div className="max-w-md w-full mb-4">
        <Link to="/" className="inline-flex items-center text-primary font-medium hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
      </div>
      
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Book Your Coupon</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input 
              required
              type="tel" 
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="e.g. 9876543210"
              value={formData.mobile}
              onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Village / Location</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="Enter your village"
              value={formData.village}
              onChange={e => setFormData({...formData, village: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Coupons</label>
            <div className="flex items-center">
              <button 
                type="button"
                className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-600 rounded-l-lg border border-gray-300 text-xl font-bold hover:bg-gray-200"
                onClick={() => setFormData(p => ({...p, coupon_count: Math.max(1, p.coupon_count - 1)}))}
              >
                -
              </button>
              <input 
                type="number" 
                readOnly
                className="flex-1 h-12 text-center border-y border-gray-300 text-xl font-bold text-gray-800 outline-none"
                value={formData.coupon_count}
              />
              <button 
                type="button"
                className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-600 rounded-r-lg border border-gray-300 text-xl font-bold hover:bg-gray-200"
                onClick={() => setFormData(p => ({...p, coupon_count: Math.min(100, p.coupon_count + 1)}))}
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg mt-6 border border-primary/20">
            <div className="flex justify-between items-center text-gray-600 mb-1">
              <span>{formData.coupon_count} Coupons × ₹{couponPrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">TOTAL AMOUNT</span>
              <span className="text-2xl font-extrabold text-primary">₹{totalAmount}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 bg-primary hover:bg-primary-light text-white text-lg font-bold py-4 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
