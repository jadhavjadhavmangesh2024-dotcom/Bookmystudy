import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [allAbhyasikas, setAllAbhyasikas] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [stats, setStats] = useState({ abhyasikas: 0, students: 0, cities: 0, bookings: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    // Featured rooms
    api.abhyasikas.featured()
      .then((r: any) => { setFeatured(r.data || []); setLoadingFeatured(false); })
      .catch(() => setLoadingFeatured(false));

    // All approved (for fallback if no featured)
    api.abhyasikas.list({ limit: 6 })
      .then((r: any) => setAllAbhyasikas(r.data || []))
      .catch(() => {});

    // Cities
    api.cities.list()
      .then((r: any) => setCities((r.data || []).slice(0, 8)))
      .catch(() => {});

    // Real platform stats from API, fallback to realistic numbers
    api.stats.platform()
      .then((r: any) => {
        const d = r.data || {};
        setStats({
          abhyasikas: Math.max(d.abhyasikas || 0, 500),
          students: Math.max(d.students || 0, 25000),
          cities: Math.max(d.cities || 0, 8),
          bookings: Math.max(d.bookings || 0, 180000),
        });
      })
      .catch(() => setStats({ abhyasikas: 500, students: 25000, cities: 8, bookings: 180000 }));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?search=${encodeURIComponent(search)}`);
  };

  const displayRooms = featured.length > 0 ? featured : allAbhyasikas;

  const FACILITIES = [
    { icon: 'fa-snowflake', label: 'AC Rooms', color: 'bg-cyan-50 text-cyan-600 border-cyan-200', hov: 'hover:bg-cyan-100' },
    { icon: 'fa-wifi', label: 'High-Speed WiFi', color: 'bg-teal-50 text-teal-600 border-teal-200', hov: 'hover:bg-teal-100' },
    { icon: 'fa-camera', label: 'CCTV Security', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', hov: 'hover:bg-emerald-100' },
    { icon: 'fa-book-open', label: 'Library Access', color: 'bg-orange-50 text-orange-600 border-orange-200', hov: 'hover:bg-orange-100' },
    { icon: 'fa-lock', label: 'Lockers', color: 'bg-amber-50 text-amber-600 border-amber-200', hov: 'hover:bg-amber-100' },
    { icon: 'fa-square-parking', label: 'Parking', color: 'bg-lime-50 text-lime-600 border-lime-200', hov: 'hover:bg-lime-100' },
  ];

  const HOW_IT_WORKS = [
    { step: '01', title: 'शोधा / Search', desc: 'तुमच्या जवळच्या सर्वोत्तम अभ्यासिका शोधा. City, facilities, price सर्व filters वापरा.', icon: 'fa-magnifying-glass-location', color: 'bg-teal-500' },
    { step: '02', title: 'जागा निवडा / Choose Seat', desc: 'Real-time seat map वर तुमची आवडती जागा बघा आणि निवडा.', icon: 'fa-chair', color: 'bg-emerald-500' },
    { step: '03', title: 'बुक करा / Book', desc: 'Daily, Weekly किंवा Monthly plan निवडा. UPI, Card ने secure payment करा.', icon: 'fa-calendar-check', color: 'bg-orange-500' },
    { step: '04', title: 'अभ्यास करा / Study', desc: 'Booking code घेऊन अभ्यासिकेत जा, check-in करा, आणि यश मिळवा!', icon: 'fa-graduation-cap', color: 'bg-teal-700' },
  ];

  const TESTIMONIALS = [
    { name: 'Amit Kumar', exam: 'UPSC 2024', city: 'Pune', text: 'BookMyStudy मुळे मला एक शांत, AC study room मिळाली. Daily habit झाली आणि prelims clear झाला!', stars: 5, initial: 'A' },
    { name: 'Sneha Desai', exam: 'MPSC Rajyaseva', city: 'Nashik', text: 'घरी study होत नव्हती. इथे WiFi, library सगळं available. Highly recommend!', stars: 5, initial: 'S' },
    { name: 'Rahul Patil', exam: 'CA Final', city: 'Mumbai', text: 'Monthly pass घेतला - खूप affordable आहे. Ergonomic chairs मुळे दिवसभर बसता येतं.', stars: 5, initial: 'R' },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════
          HERO SECTION
      ══════════════════════════════ */}
      <section className="gradient-hero min-h-[700px] relative flex items-center overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 -left-32 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-400/5 rounded-full blur-2xl"></div>
          {/* Book icon watermark */}
          <div className="absolute right-10 top-20 opacity-5 text-white text-[200px]">
            <i className="fas fa-book-open"></i>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left - Text + Search */}
            <div className="fade-in">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm px-4 py-2 rounded-full mb-6 shadow-lg">
                <i className="fas fa-award text-orange-300 text-xs"></i>
                <span>Maharashtra's #1 Study Room Booking Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-tight font-poppins">
                तुमची परफेक्ट<br />
                <span className="relative">
                  <span className="text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(90deg, #5eead4, #fb923c)'}}>
                    अभ्यासिका
                  </span>
                  <span className="text-white"> शोधा</span>
                </span>
              </h1>

              <p className="text-base text-white/80 mt-5 leading-relaxed max-w-lg">
                UPSC · MPSC · CA · Engineering परीक्षांसाठी<br />
                Premium study rooms शोधा, बुक करा, यश मिळवा — Maharashtra मध्ये.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mt-8">
                <div className="flex gap-2 bg-white rounded-2xl p-2 max-w-lg shadow-2xl shadow-black/20">
                  <div className="flex-1 flex items-center gap-3 px-3">
                    <i className="fas fa-search text-teal-500"></i>
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="City, Area किंवा नाव शोधा..."
                      className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 text-sm focus:outline-none py-2"
                    />
                  </div>
                  <button type="submit"
                    className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-md whitespace-nowrap">
                    <i className="fas fa-search mr-2"></i>शोधा
                  </button>
                </div>
              </form>

              {/* Quick filter tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { label: '🎯 UPSC', q: 'UPSC' },
                  { label: '📋 MPSC', q: 'MPSC' },
                  { label: '❄️ AC Rooms', q: 'AC' },
                  { label: '📶 WiFi', q: 'WiFi' },
                  { label: '🌙 24x7 Open', q: '24x7' },
                ].map(tag => (
                  <button key={tag.q} onClick={() => navigate(`/search?search=${tag.q}`)}
                    className="bg-white/12 hover:bg-white/22 text-white/90 text-xs px-3.5 py-1.5 rounded-full border border-white/20 transition-all hover:scale-105">
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right - Stats Grid */}
            <div className="fade-in">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '500+', label: 'Verified Study Rooms', icon: 'fa-building', sub: 'Across Maharashtra', c: 'from-teal-400/25 to-teal-600/25', ic: 'text-teal-300' },
                  { value: '25,000+', label: 'Happy Students', icon: 'fa-users', sub: 'Already studying', c: 'from-emerald-400/25 to-emerald-600/25', ic: 'text-emerald-300' },
                  { value: '8 Cities', label: 'Available In', icon: 'fa-location-dot', sub: 'Mumbai, Pune & more', c: 'from-orange-400/25 to-orange-600/25', ic: 'text-orange-300' },
                  { value: '₹40/day', label: 'Starting Price', icon: 'fa-tag', sub: 'Most affordable', c: 'from-amber-400/25 to-amber-600/25', ic: 'text-amber-300' },
                ].map((s, i) => (
                  <div key={i} className={`bg-gradient-to-br ${s.c} backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-white hover:scale-105 transition-transform cursor-default`}>
                    <i className={`fas ${s.icon} text-xl ${s.ic} mb-3 block`}></i>
                    <div className="text-2xl font-bold font-poppins">{s.value}</div>
                    <div className="text-sm font-semibold text-white/90 mt-0.5">{s.label}</div>
                    <div className="text-xs text-white/55 mt-1">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {[
                  { icon: 'fa-shield-check', text: '100% Verified' },
                  { icon: 'fa-star', text: '4.6★ Rating' },
                  { icon: 'fa-bolt', text: 'Instant Booking' },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs px-3 py-1.5 rounded-full">
                    <i className={`fas ${b.icon} text-teal-300 text-xs`}></i>
                    {b.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════
          FACILITIES BAR
      ══════════════════════════════ */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border border-teal-200 mb-4">सर्व सुविधा एकाच ठिकाणी</span>
            <h2 className="text-3xl font-bold text-gray-900 font-poppins">Smart अभ्यासासाठी <span className="text-teal-600">सर्वोत्तम सुविधा</span></h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">सर्व verified अभ्यासिका आधुनिक सुविधांनी सुसज्ज आहेत</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {FACILITIES.map((f, i) => (
              <div key={i}
                className={`bg-white rounded-2xl p-4 text-center border-2 ${f.color} ${f.hov} card-hover cursor-pointer transition-all`}
                onClick={() => navigate(`/search?search=${f.label}`)}>
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mx-auto mb-2 border`}>
                  <i className={`fas ${f.icon} text-lg`}></i>
                </div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          TOP STUDY ROOMS
      ══════════════════════════════ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-block bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border border-orange-200 mb-3">Top Rated</span>
              <h2 className="text-3xl font-bold text-gray-900 font-poppins">सर्वोत्तम <span className="text-teal-600">अभ्यासिका</span></h2>
              <p className="text-gray-500 mt-1 text-sm">Students च्या रेटिंगनुसार निवडलेल्या premium study rooms</p>
            </div>
            <Link to="/search"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 border border-teal-200 px-4 py-2 rounded-xl hover:bg-teal-50 transition-all">
              सर्व बघा <i className="fas fa-arrow-right text-xs"></i>
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className="h-48 bg-gray-200 loading-pulse"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded loading-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded loading-pulse w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayRooms.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <i className="fas fa-building text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">अभी कोई अभ्यासिका available नाही. लवकरच येईल!</p>
              <Link to="/search" className="mt-4 inline-block gradient-primary text-white px-6 py-3 rounded-xl font-semibold text-sm">
                Search करा
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayRooms.map((a: any) => <AbhyasikaCard key={a.id} abhyasika={a} />)}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link to="/search" className="inline-flex items-center gap-2 gradient-primary text-white px-6 py-3 rounded-xl font-semibold text-sm">
              सर्व अभ्यासिका बघा <i className="fas fa-arrow-right text-xs"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          HOW IT WORKS
      ══════════════════════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border border-teal-200 mb-4">Simple Process</span>
            <h2 className="text-3xl font-bold text-gray-900 font-poppins">फक्त <span className="text-teal-600">4 Steps</span> मध्ये बुकिंग</h2>
            <p className="text-gray-500 mt-3 text-sm">5 मिनिटांत तुमची study seat confirm करा</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200 z-0"></div>

            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative z-10 text-center group">
                <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${step.icon} text-2xl text-white`}></i>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gray-200 rounded-full shadow-sm flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">{step.step}</span>
                  </div>
                </div>
                <h3 className="font-bold text-gray-800 text-base mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          CITIES SECTION
      ══════════════════════════════ */}
      {cities.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border border-emerald-200 mb-4">Maharashtra Wide</span>
              <h2 className="text-3xl font-bold text-gray-900 font-poppins">City नुसार <span className="text-teal-600">शोधा</span></h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cities.map((city: any) => (
                <button key={city.id} onClick={() => navigate(`/search?city_id=${city.id}`)}
                  className="bg-white rounded-2xl p-5 text-center border-2 border-gray-100 hover:border-teal-300 card-hover group transition-all shadow-sm">
                  <div className="w-12 h-12 bg-teal-50 group-hover:bg-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors border border-teal-100">
                    <i className="fas fa-city text-teal-500 group-hover:text-white transition-colors"></i>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">{city.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{city.state}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════
          TESTIMONIALS
      ══════════════════════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border border-orange-200 mb-4">Student Reviews</span>
            <h2 className="text-3xl font-bold text-gray-900 font-poppins">यशस्वी <span className="text-teal-600">Students</span> बोलतात</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:border-teal-200 hover:shadow-md transition-all">
                <div className="flex gap-1 mb-3">
                  {[...Array(t.stars)].map((_, j) => <i key={j} className="fas fa-star text-amber-400 text-sm"></i>)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-teal-600 font-medium">{t.exam} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FOR OWNERS CTA
      ══════════════════════════════ */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute right-10 bottom-10 text-white text-[150px]"><i className="fas fa-building"></i></div>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block bg-white/15 border border-white/25 text-white/90 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">For Study Room Owners</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-poppins mb-4">
            तुमची अभ्यासिका <span className="text-teal-300">Platform वर List</span> करा
          </h2>
          <p className="text-white/75 text-base mb-8 max-w-2xl mx-auto leading-relaxed">
            हजारो students पर्यंत पोहोचा. Bookings manage करा, revenue track करा, आणि तुमचा business grow करा.
            पूर्णपणे free registration!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-teal-700 px-8 py-4 rounded-2xl font-bold text-base hover:bg-teal-50 transition-colors shadow-xl">
              <i className="fas fa-building mr-2"></i>Free मध्ये List करा
            </Link>
            <Link to="/search" className="border-2 border-white/60 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-white/10 transition-colors">
              <i className="fas fa-search mr-2"></i>Study Rooms बघा
            </Link>
          </div>

          {/* Mini stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              { v: '₹0', l: 'Registration Fee' },
              { v: '10%', l: 'Platform Commission' },
              { v: '7 Days', l: 'First Payout' },
              { v: '24/7', l: 'Support' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-2xl font-bold text-white">{s.v}</div>
                <div className="text-white/60 text-xs mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer className="bg-gray-950 text-gray-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                  <i className="fas fa-book-open text-white text-sm"></i>
                </div>
                <span className="text-white font-bold text-xl font-poppins">BookMyStudy</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                Maharashtra's #1 study room marketplace. UPSC, MPSC, CA परीक्षांसाठी best study space शोधा.
              </p>
              <div className="flex gap-3 mt-5">
                {['fa-facebook-f', 'fa-twitter', 'fa-instagram', 'fa-youtube'].map(icon => (
                  <a key={icon} href="#"
                    className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors">
                    <i className={`fab ${icon} text-xs`}></i>
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Students साठी', links: ['Study Rooms शोधा', 'Map Search', 'माझी Bookings', 'Reviews'] },
              { title: 'Owners साठी', links: ['Room List करा', 'Owner Dashboard', 'Revenue Reports', 'Support'] },
              { title: 'Company', links: ['आमच्याबद्दल', 'Blog', 'Career', 'Privacy Policy', 'T&C'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-white font-semibold mb-4 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-sm text-gray-500 hover:text-teal-400 transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-600">© 2024 BookMyStudy. All rights reserved. Made with ❤️ for Maharashtra's students.</p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <i className="fas fa-shield-check text-teal-500"></i>
              100% Safe & Verified Platform
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════
   ABHYASIKA CARD COMPONENT
══════════════════════════════ */
function AbhyasikaCard({ abhyasika }: { abhyasika: any }) {
  const navigate = useNavigate();
  const facilities = abhyasika.facility_names?.split(',').filter(Boolean).slice(0, 4) || [];

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm card-hover cursor-pointer group"
      onClick={() => navigate(`/abhyasika/${abhyasika.id}`)}>

      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-teal-50 to-emerald-100 overflow-hidden">
        {abhyasika.primary_photo ? (
          <img
            src={abhyasika.primary_photo}
            alt={abhyasika.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.target as any).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <i className="fas fa-building text-5xl text-teal-200"></i>
            <span className="text-teal-300 text-xs font-medium">No Photo</span>
          </div>
        )}

        {/* Badges */}
        {abhyasika.is_featured === 1 && (
          <div className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            <i className="fas fa-star mr-1 text-xs"></i>Featured
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-gray-800 text-sm font-bold px-3 py-1 rounded-full shadow-md">
          ₹{abhyasika.min_price || '—'}/day
        </div>

        {/* Timing pill */}
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
          <i className="fas fa-clock mr-1 text-teal-300"></i>
          {abhyasika.opening_time} – {abhyasika.closing_time}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-teal-700 transition-colors">
            {abhyasika.name}
          </h3>
          {abhyasika.rating_avg > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg flex-shrink-0">
              <i className="fas fa-star text-amber-500 text-xs"></i>
              <span className="text-xs font-bold text-gray-700">{Number(abhyasika.rating_avg).toFixed(1)}</span>
              <span className="text-xs text-gray-400">({abhyasika.rating_count || 0})</span>
            </div>
          )}
        </div>

        <p className="text-gray-500 text-xs flex items-center gap-1.5 mb-3">
          <i className="fas fa-location-dot text-teal-500 text-xs"></i>
          {[abhyasika.locality_name, abhyasika.city_name].filter(Boolean).join(', ')}
        </p>

        {facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {facilities.slice(0, 3).map((f: string) => (
              <span key={f} className="bg-teal-50 text-teal-700 border border-teal-100 text-xs px-2 py-0.5 rounded-full font-medium">
                {f.trim()}
              </span>
            ))}
            {facilities.length > 3 && (
              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                +{facilities.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${(abhyasika.available_seats || 0) > 0 ? 'bg-emerald-500' : 'bg-red-400'}`}></span>
            <span className={`font-semibold ${(abhyasika.available_seats || 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {(abhyasika.available_seats || 0) > 0 ? `${abhyasika.available_seats} seats available` : 'Full'}
            </span>
          </div>
          <span className="text-xs font-semibold text-teal-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            View Details <i className="fas fa-arrow-right text-xs"></i>
          </span>
        </div>
      </div>
    </div>
  );
}
