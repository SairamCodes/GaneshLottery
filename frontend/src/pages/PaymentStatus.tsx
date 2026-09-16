import { useState } from 'react';
import api, { API_URL } from '../services/api';
import { Search, CheckCircle, XCircle, Clock, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PaymentStatus() {
  const [searchMode, setSearchMode] = useState<'txn' | 'mobile'>('txn');
  const [formData, setFormData] = useState({ transaction_id: '', mobile: '' });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrders([]);
    
    try {
      const payload = searchMode === 'txn' 
        ? { transaction_id: formData.transaction_id }
        : { mobile: formData.mobile };
        
      const res = await api.post(`/payment-status`, payload);
      setOrders(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "No transactions found");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (order: any) => {
    const queryParam = searchMode === 'txn' 
      ? `transaction_id=${order.transaction_id}` 
      : `mobile=${order.mobile}`;
    window.location.href = `${API_URL}/orders/${order.order_id}/tickets/download?${queryParam}`;
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center">
      <div className="max-w-md w-full mb-4">
        <Link to="/" className="inline-flex items-center text-primary font-medium hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
      </div>
      
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Check Payment Status</h2>
        
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${searchMode === 'txn' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
            onClick={() => { setSearchMode('txn'); setError(''); setOrders([]); }}
          >
            By Transaction ID
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${searchMode === 'mobile' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
            onClick={() => { setSearchMode('mobile'); setError(''); setOrders([]); }}
          >
            By Mobile
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          {searchMode === 'txn' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none uppercase font-mono"
                placeholder="e.g. TXN-2026-000001"
                value={formData.transaction_id}
                onChange={e => setFormData({...formData, transaction_id: e.target.value})}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input 
                required
                type="tel" 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Registered mobile number"
                value={formData.mobile}
                onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})}
              />
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2"
          >
            {loading ? 'Searching...' : <><Search className="w-4 h-4" /> Check Status</>}
          </button>
          
          {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
        </form>
      </div>

      {orders.length > 0 && (
        <div className="w-full max-w-md space-y-4">
          <h3 className="font-bold text-gray-700">Found {orders.length} Transaction{orders.length > 1 ? 's' : ''}</h3>
          
          {orders.map((statusData, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6">
                <div className="flex justify-between items-start border-b pb-2 mb-4">
                  <h3 className="font-bold text-gray-800">Order Summary</h3>
                  {statusData.transaction_id && (
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {statusData.transaction_id}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-bold">{statusData.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Coupons</p>
                    <p className="font-bold">{statusData.coupon_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-bold text-primary">₹ {statusData.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-bold">{new Date(statusData.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className={`rounded-lg p-5 text-center mb-2 
                  ${statusData.payment_status === 'PAYMENT_VERIFIED' ? 'bg-green-50 border border-green-200' : 
                  statusData.payment_status === 'PAYMENT_REJECTED' ? 'bg-red-50 border border-red-200' : 
                  'bg-yellow-50 border border-yellow-200'}`}
                >
                  {statusData.payment_status === 'PAYMENT_VERIFIED' && (
                    <>
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <h3 className="text-xl font-bold text-green-800 mb-1">🎉 Payment Verified!</h3>
                      <p className="text-green-700 text-sm">Your lottery coupon has been confirmed.</p>
                    </>
                  )}
                  {statusData.payment_status === 'PAYMENT_REJECTED' && (
                    <>
                      <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                      <h3 className="text-xl font-bold text-red-800 mb-1">Payment Rejected</h3>
                      <p className="text-red-700 text-sm mb-2">Payment could not be verified.</p>
                      {statusData.rejection_reason && (
                        <p className="text-red-600 text-xs italic bg-red-100 p-2 rounded">Reason: {statusData.rejection_reason}</p>
                      )}
                    </>
                  )}
                  {(statusData.payment_status === 'PENDING_PAYMENT' || statusData.payment_status === 'PAYMENT_SUBMITTED') && (
                    <>
                      <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                      <h3 className="text-xl font-bold text-yellow-800 mb-1">Verification Pending</h3>
                      <p className="text-yellow-700 text-sm">Your payment is being reviewed by the organizer.</p>
                    </>
                  )}
                </div>

                {statusData.payment_status === 'PAYMENT_VERIFIED' && statusData.tickets?.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <p className="text-sm font-bold text-gray-700 mb-3 text-center">Your Tokens</p>
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                      {statusData.tickets.map((t: any) => (
                        <span key={t.token_number} className="bg-primary/10 text-primary font-mono px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
                          #{String(t.token_number).padStart(6, '0')}
                        </span>
                      ))}
                    </div>
                    <button 
                      onClick={() => handleDownload(statusData)}
                      className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors"
                    >
                      <Download className="w-5 h-5" /> Download Tickets PDF
                    </button>
                  </div>
                )}
                
                {statusData.payment_status === 'PENDING_PAYMENT' && (
                  <div className="mt-4">
                    <Link to={`/payment/${statusData.order_id}`} className="w-full inline-block text-center bg-gray-900 text-white font-bold py-3 rounded-lg shadow-md">
                      Complete Upload Screenshot
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
