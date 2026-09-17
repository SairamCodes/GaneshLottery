import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LogOut, Eye, CheckCircle, XCircle, Settings, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [tokens, setTokens] = useState<string[]>([]);
  
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab !== 'settings') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // In a real app we'd map tabs to statuses
      let statusParam = '';
      if (activeTab === 'pending') statusParam = 'PAYMENT_SUBMITTED';
      else if (activeTab === 'verified') statusParam = 'PAYMENT_VERIFIED';
      else if (activeTab === 'rejected') statusParam = 'PAYMENT_REJECTED';
      
      const res = await api.get(`/admin/orders${statusParam ? `?status=${statusParam}` : ''}`);
      setOrders(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const openOrderModal = (order: any) => {
    setSelectedOrder(order);
    setTokens(Array(order.coupon_count).fill(''));
    setRejectReason('');
  };

  const handleVerify = async (orderId: string) => {
    // Validate tokens
    if (tokens.some(t => t.trim() === '')) {
      alert("Token number is required.");
      return;
    }
    const tokenNumbers = tokens.map(t => parseInt(t, 10));
    if (tokenNumbers.some(isNaN)) {
      alert("Token number is required.");
      return;
    }
    const uniqueTokens = new Set(tokenNumbers);
    if (uniqueTokens.size !== tokenNumbers.length) {
      alert("Duplicate tokens entered. Please enter unique tokens for each coupon.");
      return;
    }

    if (!window.confirm(`Are you sure you want to verify this payment and assign tokens: ${tokenNumbers.join(', ')}?`)) return;
    
    try {
      await api.post(`/admin/orders/${orderId}/verify`, { token_numbers: tokenNumbers });
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Verification failed.");
    }
  };

  const handleReject = async (orderId: string) => {
    if (!rejectReason) {
      alert("Please enter a rejection reason.");
      return;
    }
    try {
      await api.post(`/admin/orders/${orderId}/reject`, { reason: rejectReason });
      setSelectedOrder(null);
      setRejectReason('');
      fetchOrders();
    } catch (err) {
      alert("Rejection failed.");
    }
  };

  const handleQrUpload = async () => {
    if (!qrFile) return;
    setUploadingQr(true);
    const formData = new FormData();
    formData.append('file', qrFile);
    try {
      await api.post('/admin/payment-qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('QR Code updated successfully');
      setQrFile(null);
    } catch (err) {
      alert('Failed to update QR Code');
    } finally {
      setUploadingQr(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-800">Ganapathi Admin</div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'overview' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'pending' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            Pending Verifications
          </button>
          <button 
            onClick={() => setActiveTab('verified')}
            className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'verified' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            Verified Orders
          </button>
          <button 
            onClick={() => setActiveTab('rejected')}
            className={`w-full text-left px-4 py-3 rounded-lg ${activeTab === 'rejected' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            Rejected Orders
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${activeTab === 'settings' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => { localStorage.removeItem('admin_token'); navigate('/admin/login'); }}
            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold capitalize text-gray-800">{activeTab}</h1>
          <div className="flex gap-2">
            <button onClick={() => window.open(`${api.defaults.baseURL}/admin/export?token=${localStorage.getItem('admin_token')}`)} className="bg-white px-4 py-2 border rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 flex items-center gap-2 text-gray-700">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={fetchOrders} className="bg-white px-4 py-2 border rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 text-gray-700">Refresh</button>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm font-medium">TOTAL ORDERS</p>
              <p className="text-3xl font-bold mt-2">{stats?.total_orders || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm font-medium">PENDING PAYMENTS</p>
              <p className="text-3xl font-bold mt-2 text-yellow-600">{stats?.pending_payments || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm font-medium">SUBMITTED</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">{stats?.payments_submitted || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm font-medium">VERIFIED</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats?.verified_payments || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm font-medium">REJECTED</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats?.rejected_payments || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm font-medium">TOTAL COUPONS SOLD</p>
              <p className="text-3xl font-bold mt-2 text-primary">{stats?.total_coupons_sold || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
              <p className="text-gray-500 text-sm font-medium">TOTAL VERIFIED AMOUNT</p>
              <p className="text-3xl font-bold mt-2 text-primary">₹{stats?.total_verified_amount || 0}</p>
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border max-w-lg">
            <h2 className="text-lg font-bold mb-4">Payment Settings</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload New QR Code</label>
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp"
                onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                className="w-full border p-2 rounded"
              />
            </div>
            <button 
              onClick={handleQrUpload}
              disabled={!qrFile || uploadingQr}
              className="bg-primary text-white px-4 py-2 rounded font-bold disabled:opacity-50"
            >
              {uploadingQr ? 'Uploading...' : 'Replace QR Code'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                  <th className="p-4 font-medium">Order ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Mobile</th>
                  <th className="p-4 font-medium text-right">Coupons</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">No orders found.</td></tr>
                ) : orders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm font-mono">{order.order_id}</td>
                    <td className="p-4 font-medium">{order.name}<br/><span className="text-xs text-gray-500 font-normal">{order.village}</span></td>
                    <td className="p-4 text-sm">{order.mobile}</td>
                    <td className="p-4 text-right">{order.coupon_count}</td>
                    <td className="p-4 text-right font-medium">₹{order.total_amount}</td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        order.payment_status === 'PAYMENT_VERIFIED' ? 'bg-green-100 text-green-800' :
                        order.payment_status === 'PAYMENT_REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.payment_status.replace('PAYMENT_', '')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => openOrderModal(order)}
                        className="text-primary hover:bg-primary/10 p-2 rounded transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Review Order {selectedOrder.order_id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-800"><XCircle /></button>
            </div>
            
            <div className="p-6 flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h3 className="font-bold text-gray-700 mb-4">Customer Details</h3>
                <div className="space-y-3 text-sm">
                  <p><span className="text-gray-500 w-24 inline-block">Name:</span> <span className="font-bold">{selectedOrder.name}</span></p>
                  <p><span className="text-gray-500 w-24 inline-block">Mobile:</span> <span className="font-bold">{selectedOrder.mobile}</span></p>
                  <p><span className="text-gray-500 w-24 inline-block">Village:</span> <span className="font-bold">{selectedOrder.village}</span></p>
                  <div className="border-t my-4"></div>
                  <p><span className="text-gray-500 w-24 inline-block">Coupons:</span> <span className="font-bold text-lg">{selectedOrder.coupon_count}</span></p>
                  <p><span className="text-gray-500 w-24 inline-block">Expected:</span> <span className="font-bold text-primary text-xl">₹{selectedOrder.total_amount}</span></p>
                  <p><span className="text-gray-500 w-24 inline-block">Submitted:</span> <span>{selectedOrder.submitted_at ? format(new Date(selectedOrder.submitted_at), 'MMM dd, yyyy HH:mm') : 'N/A'}</span></p>
                </div>

                {selectedOrder.payment_status === 'PAYMENT_SUBMITTED' && (
                  <div className="mt-8 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                      <h4 className="font-bold text-yellow-800 mb-2">Assign Token Numbers</h4>
                      <p className="text-xs text-yellow-700 mb-3">Please manually enter {selectedOrder.coupon_count} distinct token number(s) for this order.</p>
                      <div className="space-y-2">
                        {Array.from({ length: selectedOrder.coupon_count }).map((_, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-sm font-medium w-20">Coupon {i + 1}:</span>
                            <input 
                              type="number" 
                              className="flex-1 px-3 py-2 border rounded text-sm"
                              placeholder="Enter Token No."
                              value={tokens[i] || ''}
                              onChange={(e) => {
                                const newTokens = [...tokens];
                                newTokens[i] = e.target.value;
                                setTokens(newTokens);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleVerify(selectedOrder.order_id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" /> VERIFY & GENERATE TICKETS
                    </button>
                    
                    <div className="border border-red-200 p-4 rounded-lg bg-red-50">
                      <input 
                        type="text" 
                        placeholder="Rejection Reason (required)" 
                        className="w-full px-3 py-2 border border-red-300 rounded mb-2 text-sm outline-none focus:ring-1 focus:ring-red-500"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <button 
                        onClick={() => handleReject(selectedOrder.order_id)}
                        className="w-full bg-white border border-red-600 text-red-600 hover:bg-red-50 font-bold py-2 rounded-lg"
                      >
                        REJECT PAYMENT
                      </button>
                    </div>
                  </div>
                )}

                {selectedOrder.payment_status === 'PAYMENT_VERIFIED' && (
                  <div className="mt-8 space-y-4">
                    <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200">
                      <p className="font-bold mb-1">Payment Verified</p>
                      <p className="text-sm">Verified on: {selectedOrder.verified_at ? format(new Date(selectedOrder.verified_at), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                    </div>
                    
                    <a 
                      href={`${api.defaults.baseURL}/orders/${selectedOrder.order_id}/tickets/download?transaction_id=${selectedOrder.transaction_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 block text-center"
                    >
                      VIEW TICKET
                    </a>

                    <button 
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to clear this verification?\nThe payment will return to pending verification and the assigned lottery token(s) will be released.")) {
                          try {
                            await api.post(`/admin/orders/${selectedOrder.order_id}/clear-verification`);
                            alert("Verification cleared successfully.");
                            setSelectedOrder(null);
                            fetchOrders();
                            fetchStats();
                          } catch (err: any) {
                            alert(err.response?.data?.detail || "Failed to clear verification");
                          }
                        }
                      }}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      CLEAR VERIFICATION
                    </button>

                    <div className="border border-red-200 p-4 rounded-lg bg-red-50">
                      <input 
                        type="text" 
                        placeholder="Rejection Reason (required)" 
                        className="w-full px-3 py-2 border border-red-300 rounded mb-2 text-sm outline-none focus:ring-1 focus:ring-red-500"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <button 
                        onClick={() => handleReject(selectedOrder.order_id)}
                        className="w-full bg-white border border-red-600 text-red-600 hover:bg-red-50 font-bold py-2 rounded-lg"
                      >
                        REJECT PAYMENT
                      </button>
                    </div>
                  </div>
                )}

                {selectedOrder.payment_status === 'PAYMENT_REJECTED' && (
                  <div className="mt-8">
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
                      <p className="font-bold mb-1">Payment Rejected</p>
                      <p className="text-sm">Reason: {selectedOrder.rejection_reason || 'No reason provided'}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 bg-gray-100 rounded-lg p-2 min-h-[400px] flex items-center justify-center border">
                {selectedOrder.screenshot_url ? (
                  <img 
                    src={`${api.defaults.baseURL?.replace('/api', '')}${selectedOrder.screenshot_url}?token=${localStorage.getItem('admin_token')}`}
                    alt="Payment Screenshot"
                    className="max-w-full max-h-[600px] object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50">Image Error</text></svg>'; }}
                  />
                ) : (
                  <p className="text-gray-500 text-center px-4">No Screenshot Available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
