import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { API_URL } from '../services/api';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PaymentPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchOrderAndQr();
  }, [orderId]);

  const fetchOrderAndQr = async () => {
    try {
      const [orderRes, qrRes] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get('/payment-qr')
      ]);
      setOrder(orderRes.data);
      if (qrRes.data.url) {
        setQrUrl(`${API_URL.replace('/api', '')}${qrRes.data.url}`);
      }
      
      // If already submitted, redirect to status
      if (orderRes.data.payment_status !== 'PENDING_PAYMENT' && orderRes.data.payment_status !== 'PAYMENT_REJECTED') {
         // Maybe just show a message, but let's allow them to see it or redirect
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Order not found");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      if (!validTypes.includes(selectedFile.type)) {
        setError("Please upload a valid image (JPG, PNG, WEBP)");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setUploadSuccess(false);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await api.post(`/orders/${orderId}/payment-screenshot`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to upload screenshot");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/orders/${orderId}/submit-payment`);
      // Update order state or redirect
      setOrder({...order, payment_status: 'PAYMENT_SUBMITTED', transaction_id: res.data.transaction_id});
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!order) return <div className="text-center mt-10">{error}</div>;

  if (order.payment_status === 'PAYMENT_SUBMITTED') {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center justify-center text-center">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-4 mx-auto" />
        <h2 className="text-2xl font-bold mb-2">Payment Submitted Successfully</h2>
        <p className="text-gray-600 mb-4 max-w-sm">Your payment is waiting for verification. You will receive your tickets once verified by the admin.</p>
        
        {order.transaction_id && (
          <div className="bg-white border-2 border-primary border-dashed p-4 rounded-xl mb-8">
            <p className="text-sm text-gray-500 mb-1">Your Transaction ID</p>
            <p className="text-xl font-bold font-mono text-primary">{order.transaction_id}</p>
            <p className="text-xs text-gray-400 mt-2">Save this ID for tracking your status.</p>
          </div>
        )}

        <Link to="/status" className="bg-primary text-white px-8 py-3 rounded-lg font-bold">Check Status</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-gray-50 p-4 border-b text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Order ID</p>
          <p className="font-bold text-lg">{order.order_id}</p>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-bold">{order.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Coupons</p>
              <p className="font-bold">{order.coupon_count}</p>
            </div>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-lg text-center mb-6">
            <p className="text-sm text-gray-600 mb-1">Total Amount to Pay</p>
            <p className="text-3xl font-extrabold text-primary">₹{order.total_amount}</p>
          </div>

          {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

          <div className="text-center mb-8">
            <p className="font-bold mb-4">Scan & Pay using PhonePe / UPI</p>
            {qrUrl ? (
              <div className="border p-2 rounded-xl inline-block bg-white shadow-sm">
                <img src={qrUrl} alt="Payment QR" className="w-64 h-64 object-contain" />
              </div>
            ) : (
              <div className="w-64 h-64 border-2 border-dashed mx-auto flex items-center justify-center text-gray-400">
                QR not available
              </div>
            )}
            
            {qrUrl && (
              <a href={qrUrl} download className="block text-primary text-sm font-medium mt-2 hover:underline">
                Download QR
              </a>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold mb-4 text-center">Upload Payment Screenshot</h3>
            
            {!uploadSuccess ? (
              <div className="space-y-4">
                <label className="border-2 border-dashed border-gray-300 p-6 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Tap to select screenshot</span>
                  <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} />
                </label>
                
                {previewUrl && (
                  <div className="relative">
                    <img src={previewUrl} alt="Preview" className="w-full h-40 object-contain bg-black/5 rounded" />
                  </div>
                )}
                
                <button 
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Screenshot'}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200">
                  Payment screenshot uploaded successfully.
                </div>
                
                <button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary-light text-white py-4 rounded-lg font-bold text-lg shadow-md flex justify-center items-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Submit Payment for Verification'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
