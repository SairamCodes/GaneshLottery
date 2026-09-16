import { Link } from 'react-router-dom';
import { Ticket, Search } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 sm:p-8">
      {/* Header / Hero */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden border border-primary/20 mt-8">
        <div className="bg-primary p-6 text-center text-white">
          <h2 className="text-xl font-bold text-secondary mb-2">వినాయక నవ రాత్రులు శుభాకాంక్షలు</h2>
          <h1 className="text-3xl font-extrabold mb-1">గణపతి లాటరీ</h1>
          <p className="text-primary-light text-white/80">నిర్వాహకులు: మణికంఠ యూత్, గుడిపాడు</p>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 border-b-2 border-primary/20 pb-2 inline-block">బహుమతులు</h3>
            
            <div className="mt-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
              <p className="text-primary font-bold text-sm uppercase">1st Prize</p>
              <p className="text-xl font-extrabold text-gray-900">Hero Pleasure X</p>
            </div>
            
            <div className="mt-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-primary font-bold text-sm uppercase">2nd Prize</p>
              <p className="text-lg font-bold text-gray-900">Croma Washing Machine</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-6 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Ticket Price</p>
              <p className="text-2xl font-bold text-primary">₹500 <span className="text-sm text-gray-600 font-normal">/ coupon</span></p>
            </div>
            <div className="border-l border-gray-200 h-10 mx-2"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Draw Date</p>
              <p className="text-lg font-bold text-gray-800">22 Sep 2026</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link 
              to="/book" 
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white text-lg font-bold py-4 rounded-lg transition-colors shadow-md"
            >
              <Ticket className="w-5 h-5" />
              Book Lottery Coupon
            </Link>
            
            <Link 
              to="/status" 
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary hover:bg-gray-50 text-lg font-bold py-3 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
              Check Payment Status
            </Link>
          </div>
        </div>
      </div>
      
      {/* How it works */}
      <div className="max-w-md w-full mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-gray-800 mb-4 text-center">HOW IT WORKS</h3>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3"><span className="font-bold text-primary">1.</span> Choose number of coupons</li>
          <li className="flex gap-3"><span className="font-bold text-primary">2.</span> Pay ₹500 per coupon using QR</li>
          <li className="flex gap-3"><span className="font-bold text-primary">3.</span> Upload payment screenshot</li>
          <li className="flex gap-3"><span className="font-bold text-primary">4.</span> Wait for admin verification</li>
          <li className="flex gap-3"><span className="font-bold text-primary">5.</span> Download your official ticket PDF</li>
        </ul>
      </div>

      {/* Admin Link */}
      <div className="mt-12 text-center text-sm text-gray-400">
        <Link to="/admin/login" className="hover:text-primary transition-colors">Admin Login</Link>
      </div>
    </div>
  );
}
