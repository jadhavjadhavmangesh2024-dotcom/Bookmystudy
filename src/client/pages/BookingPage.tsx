import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/common/ToastProvider';
import { useAuth } from '../context/AuthContext';

export default function BookingPage() {
  const { abhyasikaId } = useParams();
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [abhyasika, setAbhyasika] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState<any>(null);
  const [form, setForm] = useState({
    booking_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    if (abhyasikaId) loadData();
  }, [abhyasikaId]);

  useEffect(() => {
    if (form.start_date && form.booking_type) {
      const start = new Date(form.start_date);
      const days = form.booking_type === 'daily' ? 1 : form.booking_type === 'weekly' ? 7 : 30;
      const end = new Date(start);
      end.setDate(end.getDate() + days - 1);
      setForm(f => ({ ...f, end_date: end.toISOString().split('T')[0] }));
    }
  }, [form.start_date, form.booking_type]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [a, s, c]: any = await Promise.all([
        api.abhyasikas.get(abhyasikaId!),
        api.seats.list(abhyasikaId, { date: form.start_date }),
        api.seats.categories(abhyasikaId)
      ]);
      setAbhyasika(a.data);
      setSeats(s.data || []);
      setCategories(c.data || []);
    } catch (e: any) { error(e.message); }
    setLoading(false);
  };

  const calculateAmount = () => {
    if (!selectedSeat) return { base: 0, tax: 0, discount: 0, total: 0, days: 0 };
    const start = new Date(form.start_date);
    const end = new Date(form.end_date || form.start_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    
    let base = 0;
    const cat = categories.find(c => c.id === selectedSeat.category_id);
    if (cat) {
      if (form.booking_type === 'daily') base = cat.daily_price * days;
      else if (form.booking_type === 'weekly') base = cat.weekly_price * Math.ceil(days / 7);
      else if (form.booking_type === 'monthly') base = cat.monthly_price * Math.ceil(days / 30);
    }
    
    const tax = base * 0.18;
    const discount = couponValid?.discount || 0;
    const total = base + tax - discount;
    return { base, tax, discount, total: Math.max(0, total), days };
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    const { total } = calculateAmount();
    try {
      const r: any = await api.coupons.validate({ code: couponCode, amount: total });
      setCouponValid(r.data);
      success(`Coupon applied! Discount: ₹${r.data.discount}`);
    } catch (e: any) { error(e.message); setCouponValid(null); }
  };

  const handleBook = async () => {
    if (!selectedSeat) return error('Please select a seat');
    if (!form.start_date || !form.end_date) return error('Please select dates');

    setBooking(true);
    try {
      const r: any = await api.bookings.create({
        abhyasika_id: parseInt(abhyasikaId!),
        seat_id: selectedSeat.id,
        booking_type: form.booking_type,
        start_date: form.start_date,
        end_date: form.end_date,
        coupon_code: couponCode || undefined
      });

      const bookingId = r.data.booking_id;
      const amount = r.data.amount;

      // Simulate Razorpay payment (Demo mode)
      info('Opening payment gateway...');
      
      setTimeout(async () => {
        try {
          // Simulate successful payment
          await api.payments.verify({
            booking_id: bookingId,
            razorpay_order_id: `order_demo_${Date.now()}`,
            razorpay_payment_id: `pay_demo_${Date.now()}`,
            razorpay_signature: 'demo_signature'
          });
          success('🎉 Booking confirmed! Your seat is reserved.');
          navigate('/student/bookings');
        } catch (e: any) { error(e.message); }
        setBooking(false);
      }, 2000);

    } catch (e: any) {
      error(e.message || 'Booking failed');
      setBooking(false);
    }
  };

  const amounts = calculateAmount();
  const BOOKING_TYPES = [
    { value: 'daily', label: 'Daily', desc: '1 day', icon: 'fa-sun' },
    { value: 'weekly', label: 'Weekly', desc: '7 days', icon: 'fa-calendar-week' },
    { value: 'monthly', label: 'Monthly', desc: '30 days', icon: 'fa-calendar' },
  ];

  if (loading) return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 rounded-2xl loading-pulse"></div>
          <div className="h-96 bg-gray-200 rounded-2xl loading-pulse"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors">
            <i className="fas fa-arrow-left text-sm"></i>
            <span className="text-sm font-medium">Back to {abhyasika?.name}</span>
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6 font-poppins">
          Book Your Seat - <span className="text-indigo-600">{abhyasika?.name}</span>
        </h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Seat Selection */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* Booking Type */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Select Plan</h3>
              <div className="grid grid-cols-3 gap-3">
                {BOOKING_TYPES.map(type => (
                  <button key={type.value} onClick={() => setForm(f => ({ ...f, booking_type: type.value }))}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${form.booking_type === type.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <i className={`fas ${type.icon} text-xl mb-2 ${form.booking_type === type.value ? 'text-indigo-600' : 'text-gray-400'}`}></i>
                    <div className={`text-sm font-bold ${form.booking_type === type.value ? 'text-indigo-700' : 'text-gray-700'}`}>{type.label}</div>
                    <div className="text-xs text-gray-400">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Select Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Start Date</label>
                  <input type="date" value={form.start_date} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">End Date</label>
                  <input type="date" value={form.end_date} min={form.start_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              {amounts.days > 0 && (
                <p className="text-sm text-indigo-600 mt-2 font-medium">
                  <i className="fas fa-calendar mr-1"></i>{amounts.days} day{amounts.days > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Seat Map */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">Select Seat</h3>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4 text-xs">
                {[
                  { label: 'Available', class: 'bg-green-100 border-2 border-green-400' },
                  { label: 'Occupied', class: 'bg-red-100 border-2 border-red-400' },
                  { label: 'Selected', class: 'bg-indigo-600 border-2 border-indigo-700' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 ${l.class} rounded-md`}></div>
                    <span className="text-gray-500">{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Category Tabs */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(cat => (
                    <span key={cat.id} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color_code }}></div>
                      {cat.name} - ₹{cat.daily_price}/day
                    </span>
                  ))}
                </div>
              )}

              {/* Seats Grid */}
              <div className="min-h-40 p-4 bg-gray-50 rounded-xl">
                <div className="flex flex-wrap gap-2">
                  {seats.map(seat => {
                    const isAvail = seat.current_status === 'available' || seat.status === 'available';
                    const isSelected = selectedSeat?.id === seat.id;
                    const cat = categories.find(c => c.id === seat.category_id);
                    return (
                      <div key={seat.id}
                        onClick={() => isAvail ? setSelectedSeat(isSelected ? null : seat) : null}
                        title={`${seat.seat_number} - ${cat?.name || ''} - ${isAvail ? 'Available' : 'Occupied'}`}
                        className={`seat ${isSelected ? 'selected' : isAvail ? 'available' : 'occupied'} ${!isAvail ? 'cursor-not-allowed' : ''}`}>
                        {seat.seat_number?.slice(-2) || seat.seat_number}
                      </div>
                    );
                  })}
                  {seats.length === 0 && (
                    <div className="w-full text-center py-8 text-gray-400">
                      <i className="fas fa-chair text-3xl mb-2"></i>
                      <p className="text-sm">No seats available</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedSeat && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3">
                  <i className="fas fa-chair text-indigo-600"></i>
                  <div>
                    <p className="text-sm font-bold text-indigo-700">Selected: {selectedSeat.seat_number}</p>
                    <p className="text-xs text-indigo-500">{selectedSeat.category_name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm sticky top-24">
              <h3 className="font-bold text-gray-800 text-lg mb-5">Booking Summary</h3>

              {/* Study Room Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5">
                <div className="w-12 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-building text-indigo-400"></i>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{abhyasika?.name}</p>
                  <p className="text-xs text-gray-400">{abhyasika?.city_name}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm mb-5">
                {[
                  { label: 'Seat', value: selectedSeat ? selectedSeat.seat_number : 'Not selected', icon: 'fa-chair' },
                  { label: 'Plan', value: form.booking_type.charAt(0).toUpperCase() + form.booking_type.slice(1), icon: 'fa-calendar' },
                  { label: 'Duration', value: amounts.days > 0 ? `${amounts.days} days` : '-', icon: 'fa-clock' },
                  { label: 'Dates', value: form.start_date && form.end_date ? `${form.start_date} → ${form.end_date}` : '-', icon: 'fa-calendar-days' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500 flex items-center gap-2">
                      <i className={`fas ${item.icon} text-indigo-400 w-4 text-center`}></i>
                      {item.label}
                    </span>
                    <span className={`font-medium ${!selectedSeat && item.label === 'Seat' ? 'text-red-400 text-xs' : 'text-gray-700'}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              {selectedSeat && amounts.base > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Base Amount</span>
                    <span className="font-medium">₹{amounts.base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (18%)</span>
                    <span className="font-medium">₹{amounts.tax.toFixed(2)}</span>
                  </div>
                  {amounts.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount</span>
                      <span className="font-medium">-₹{amounts.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                    <span>Total Amount</span>
                    <span className="text-indigo-600 text-lg">₹{amounts.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Coupon */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Have a Coupon?</label>
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponValid(null); }}
                    placeholder="Enter coupon code" className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                  <button onClick={validateCoupon} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">
                    Apply
                  </button>
                </div>
                {couponValid && (
                  <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">
                    <i className="fas fa-check-circle"></i>
                    Coupon applied! You save ₹{couponValid.discount}
                  </p>
                )}
              </div>

              {/* Book Button */}
              <button onClick={handleBook} disabled={!selectedSeat || booking}
                className="w-full gradient-primary text-white py-4 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                {booking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full loading-spinner"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <i className="fas fa-lock"></i>
                    Pay ₹{amounts.total > 0 ? amounts.total.toFixed(0) : '0'} & Confirm
                  </>
                )}
              </button>

              {/* Security badges */}
              <div className="flex justify-center gap-4 mt-4">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <i className="fas fa-shield-halved text-green-500"></i>Secure Payment
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <i className="fas fa-rotate-left text-blue-500"></i>Free Cancellation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
