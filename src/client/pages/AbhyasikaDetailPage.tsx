import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastProvider';
import api from '../utils/api';

export default function AbhyasikaDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();
  const [abhyasika, setAbhyasika] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activePhoto, setActivePhoto] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    if (id) {
      api.abhyasikas.get(id).then((r: any) => {
        setAbhyasika(r.data);
        setLoading(false);
      }).catch(() => { setLoading(false); });
    }
  }, [id]);

  const toggleWishlist = async () => {
    if (!user) return navigate('/login');
    try {
      await api.wishlists.toggle({ abhyasika_id: abhyasika.id });
      setWishlisted(!wishlisted);
      success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
    } catch (e: any) { error(e.message); }
  };

  const handleBook = () => {
    if (!user) return navigate('/login');
    if (user.role !== 'student') return error('Only students can book seats');
    navigate(`/booking/${abhyasika.id}`);
  };

  if (loading) return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-80 bg-gray-200 rounded-2xl loading-pulse"></div>
            <div className="h-8 bg-gray-200 rounded loading-pulse w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded loading-pulse w-1/2"></div>
          </div>
          <div className="h-80 bg-gray-200 rounded-2xl loading-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (!abhyasika) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="text-center">
        <i className="fas fa-building text-5xl text-gray-300 mb-4"></i>
        <h2 className="text-2xl font-bold text-gray-700">Study Room Not Found</h2>
        <Link to="/search" className="mt-4 inline-block text-indigo-600 hover:underline">Browse All Rooms</Link>
      </div>
    </div>
  );

  const allPhotos = abhyasika.photos || [];
  const ratingDistribution = abhyasika.reviews ? {} : {};
  const facilityGroups = abhyasika.facilities?.reduce((acc: any, f: any) => {
    if (!acc[f.category_name]) acc[f.category_name] = [];
    acc[f.category_name].push(f);
    return acc;
  }, {}) || {};

  const TABS = [
    { key: 'overview', label: 'Overview', icon: 'fa-info-circle' },
    { key: 'facilities', label: 'Facilities', icon: 'fa-list-check' },
    { key: 'seats', label: 'Seat Plans', icon: 'fa-chair' },
    { key: 'reviews', label: `Reviews (${abhyasika.rating_count || 0})`, icon: 'fa-star' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-indigo-600">Home</Link>
          <i className="fas fa-chevron-right text-xs"></i>
          <Link to="/search" className="hover:text-indigo-600">Study Rooms</Link>
          <i className="fas fa-chevron-right text-xs"></i>
          <span className="text-gray-700 font-medium truncate">{abhyasika.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-80 bg-gradient-to-br from-indigo-100 to-purple-100">
                {allPhotos[activePhoto]?.url ? (
                  <img src={allPhotos[activePhoto].url} alt={abhyasika.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-building text-8xl text-indigo-200"></i>
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={toggleWishlist}
                    className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center ${wishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'}`}>
                    <i className={`fas fa-heart text-sm`}></i>
                  </button>
                </div>
              </div>
              {allPhotos.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto">
                  {allPhotos.map((p: any, i: number) => (
                    <button key={i} onClick={() => setActivePhoto(i)}
                      className={`flex-shrink-0 w-16 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activePhoto ? 'border-indigo-500 scale-105' : 'border-transparent hover:border-gray-300'}`}>
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-wrap gap-4 items-start justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 font-poppins">{abhyasika.name}</h1>
                  {abhyasika.tagline && <p className="text-indigo-600 mt-1 font-medium italic">"{abhyasika.tagline}"</p>}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <i className="fas fa-location-dot text-indigo-400"></i>
                      {[abhyasika.locality_name, abhyasika.city_name].filter(Boolean).join(', ')}
                    </span>
                    {abhyasika.rating_avg > 0 && (
                      <span className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full">
                        <i className="fas fa-star text-yellow-500"></i>
                        <span className="font-semibold text-gray-700">{Number(abhyasika.rating_avg).toFixed(1)}</span>
                        <span className="text-gray-400">({abhyasika.rating_count} reviews)</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <i className="fas fa-clock text-indigo-400"></i>
                      {abhyasika.opening_time} - {abhyasika.closing_time}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Starting from</div>
                  <div className="text-3xl font-bold text-indigo-600">
                    ₹{abhyasika.seat_categories?.[0]?.daily_price || '50'}
                    <span className="text-base text-gray-400 font-normal">/day</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 text-sm">
                <span className={`badge ${abhyasika.available_seats > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <i className={`fas fa-circle text-xs mr-1`}></i>
                  {abhyasika.available_seats > 0 ? `${abhyasika.available_seats} Seats Available` : 'Fully Booked'}
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500"><i className="fas fa-chair mr-1 text-indigo-400"></i>{abhyasika.total_seats} Total Seats</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex border-b overflow-x-auto">
                {TABS.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <i className={`fas ${tab.icon} text-sm`}></i>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    {abhyasika.description && (
                      <div>
                        <h3 className="font-bold text-gray-800 mb-2 text-lg">About this Study Room</h3>
                        <p className="text-gray-600 leading-relaxed">{abhyasika.description}</p>
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-3 text-lg">Location & Contact</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="fas fa-location-dot text-indigo-600 text-sm"></i>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Address</p>
                            <p className="text-sm text-gray-500">{abhyasika.address}, {abhyasika.city_name}</p>
                          </div>
                        </div>
                        {abhyasika.phone && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <i className="fas fa-phone text-green-600 text-sm"></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Phone</p>
                              <a href={`tel:${abhyasika.phone}`} className="text-sm text-indigo-600 hover:underline">{abhyasika.phone}</a>
                            </div>
                          </div>
                        )}
                        {abhyasika.email && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <i className="fas fa-envelope text-blue-600 text-sm"></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Email</p>
                              <a href={`mailto:${abhyasika.email}`} className="text-sm text-indigo-600 hover:underline">{abhyasika.email}</a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Map Placeholder */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-3 text-lg">Location on Map</h3>
                      <div className="h-52 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center justify-center">
                        <div className="text-center">
                          <i className="fas fa-map-location-dot text-4xl text-indigo-300 mb-2"></i>
                          <p className="text-sm text-gray-500">Interactive map</p>
                          {abhyasika.google_maps_url ? (
                            <a href={abhyasika.google_maps_url} target="_blank" rel="noreferrer"
                              className="mt-2 inline-block text-xs text-indigo-600 underline">Open in Google Maps</a>
                          ) : (
                            <a href={`https://maps.google.com/maps?q=${abhyasika.latitude},${abhyasika.longitude}`} target="_blank" rel="noreferrer"
                              className="mt-2 inline-block text-xs text-indigo-600 underline">Open in Google Maps</a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Facilities Tab */}
                {activeTab === 'facilities' && (
                  <div className="space-y-6">
                    {Object.entries(facilityGroups).map(([cat, facs]: any) => (
                      <div key={cat}>
                        <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">{cat}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {facs.map((f: any) => (
                            <div key={f.id} className="flex items-center gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-check text-indigo-600 text-xs"></i>
                              </div>
                              <span className="text-sm text-gray-700 font-medium">{f.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {abhyasika.facilities?.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No facilities listed</p>
                    )}
                  </div>
                )}

                {/* Seats Tab */}
                {activeTab === 'seats' && (
                  <div className="space-y-5">
                    {abhyasika.seat_categories?.map((cat: any) => (
                      <div key={cat.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color_code }}></div>
                            <h4 className="font-bold text-gray-800">{cat.name}</h4>
                          </div>
                        </div>
                        {cat.description && <p className="text-sm text-gray-500 mb-3">{cat.description}</p>}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { type: 'Daily', price: cat.daily_price, icon: 'fa-sun' },
                            { type: 'Weekly', price: cat.weekly_price, icon: 'fa-calendar-week' },
                            { type: 'Monthly', price: cat.monthly_price, icon: 'fa-calendar' }
                          ].map(p => (
                            <div key={p.type} className="bg-white rounded-lg p-3 text-center border border-gray-200">
                              <i className={`fas ${p.icon} text-indigo-400 mb-1 text-sm`}></i>
                              <div className="text-lg font-bold text-gray-800">₹{p.price || '-'}</div>
                              <div className="text-xs text-gray-500">{p.type}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {abhyasika.reviews?.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <i className="fas fa-star text-3xl mb-2"></i>
                        <p>No reviews yet. Be the first to review!</p>
                      </div>
                    ) : abhyasika.reviews?.map((review: any) => (
                      <div key={review.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-700 font-bold text-sm">{review.first_name?.[0]}{review.last_name?.[0]}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{review.first_name} {review.last_name}</p>
                              <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className={`fas fa-star text-sm ${i < review.overall_rating ? 'star-filled' : 'star-empty'}`}></i>
                            ))}
                          </div>
                        </div>
                        {review.title && <h5 className="font-semibold text-gray-700 mb-1">{review.title}</h5>}
                        <p className="text-sm text-gray-600 leading-relaxed">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Book Your Seat</h3>

              {/* Pricing Summary */}
              <div className="space-y-3 mb-5">
                {abhyasika.seat_categories?.slice(0, 3).map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color_code }}></div>
                        <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">from ₹{cat.monthly_price}/month</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">₹{cat.daily_price}/day</div>
                      <div className="text-xs text-gray-400">₹{cat.weekly_price}/week</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded-xl">
                <i className="fas fa-chair text-indigo-400"></i>
                <span className="font-medium">{abhyasika.available_seats} seats available right now</span>
              </div>

              <button onClick={handleBook}
                className="w-full gradient-primary text-white py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2 mb-3">
                <i className="fas fa-calendar-plus"></i>
                Book a Seat Now
              </button>

              <button onClick={toggleWishlist}
                className={`w-full py-3 rounded-xl font-semibold text-sm border-2 transition-all flex items-center justify-center gap-2 ${wishlisted ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <i className={`fas fa-heart${wishlisted ? '' : '-crack'}`}></i>
                {wishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
              </button>

              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { icon: 'fa-shield-halved', label: 'Secure', sub: 'Payment' },
                    { icon: 'fa-rotate-left', label: 'Free', sub: 'Cancellation' },
                    { icon: 'fa-headset', label: '24/7', sub: 'Support' }
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-2 text-center">
                      <i className={`fas ${item.icon} text-indigo-500 text-sm mb-1`}></i>
                      <div className="text-xs font-semibold text-gray-700">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
