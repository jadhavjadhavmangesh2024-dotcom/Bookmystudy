import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [abhyasikas, setAbhyasikas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city_id: searchParams.get('city_id') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort_by: 'rating',
    facilities: [] as string[]
  });

  useEffect(() => {
    api.cities.list().then((r: any) => setCities(r.data || []));
    api.facilities.list().then((r: any) => setFacilities(r.data || []));
  }, []);

  useEffect(() => {
    loadAbhyasikas();
  }, [filters, page]);

  const loadAbhyasikas = async () => {
    setLoading(true);
    try {
      const res: any = await api.abhyasikas.list({ ...filters, page, limit: 12 });
      setAbhyasikas(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (e) {
      setAbhyasikas([]);
    }
    setLoading(false);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const toggleFacility = (fId: string) => {
    setFilters(f => ({
      ...f,
      facilities: f.facilities.includes(fId)
        ? f.facilities.filter(x => x !== fId)
        : [...f.facilities, fId]
    }));
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Search Header */}
      <div className="bg-white shadow-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3">
              <i className="fas fa-search text-gray-400"></i>
              <input
                type="text"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                placeholder="Search Study Rooms..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400"
              />
              {filters.search && (
                <button onClick={() => handleFilterChange('search', '')} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times text-sm"></i>
                </button>
              )}
            </div>
            <button onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${filtersOpen ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <i className="fas fa-sliders"></i>
              <span className="hidden sm:inline">Filters</span>
              {(filters.city_id || filters.min_price || filters.max_price || filters.facilities.length > 0) && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">!</span>
              )}
            </button>
            <select value={filters.sort_by} onChange={e => handleFilterChange('sort_by', e.target.value)}
              className="bg-gray-100 text-gray-700 rounded-xl px-4 text-sm focus:outline-none hidden sm:block">
              <option value="rating">Best Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="distance">Nearest First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {filtersOpen && (
            <div className="w-72 flex-shrink-0 hidden lg:block">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-40">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-800">Filters</h3>
                  <button onClick={() => { setFilters({ search: '', city_id: '', min_price: '', max_price: '', sort_by: 'rating', facilities: [] }); setPage(1); }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Clear All</button>
                </div>

                {/* City Filter */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <select value={filters.city_id} onChange={e => handleFilterChange('city_id', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                    <option value="">All Cities</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Price Range</label>
                  <div className="flex gap-3">
                    <input type="number" placeholder="Min" value={filters.min_price}
                      onChange={e => handleFilterChange('min_price', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                    <input type="number" placeholder="Max" value={filters.max_price}
                      onChange={e => handleFilterChange('max_price', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Facilities</label>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {facilities.slice(0, 12).map((f: any) => (
                      <label key={f.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${filters.facilities.includes(String(f.id)) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}
                          onClick={() => toggleFacility(String(f.id))}>
                          {filters.facilities.includes(String(f.id)) && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                        <span className="text-sm text-gray-700">{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-600 text-sm">
                {loading ? 'Searching...' : `${total} study rooms found`}
                {filters.search && <span className="ml-2 text-indigo-600 font-medium">for "{filters.search}"</span>}
              </p>
              <select value={filters.sort_by} onChange={e => handleFilterChange('sort_by', e.target.value)}
                className="sm:hidden bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option value="rating">Best Rated</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : abhyasikas.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Results Found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
                <button onClick={() => { setFilters({ search: '', city_id: '', min_price: '', max_price: '', sort_by: 'rating', facilities: [] }); setPage(1); }}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {abhyasikas.map(a => <AbhyasikaCard key={a.id} abhyasika={a} />)}
                </div>

                {/* Pagination */}
                {total > 12 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-50 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                      <i className="fas fa-chevron-left mr-1"></i>Prev
                    </button>
                    <span className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">
                      {page} / {Math.ceil(total / 12)}
                    </span>
                    <button disabled={page * 12 >= total} onClick={() => setPage(p => p + 1)}
                      className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-50 hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                      Next<i className="fas fa-chevron-right ml-1"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AbhyasikaCard({ abhyasika }: { abhyasika: any }) {
  const navigate = useNavigate();
  const facilities = abhyasika.facility_names?.split(',').filter(Boolean).slice(0, 4) || [];

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm card-hover cursor-pointer" onClick={() => navigate(`/abhyasika/${abhyasika.id}`)}>
      <div className="relative h-44 bg-gradient-to-br from-indigo-100 to-purple-100">
        {abhyasika.primary_photo ? (
          <img src={abhyasika.primary_photo} alt={abhyasika.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-building text-4xl text-indigo-200"></i>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 text-sm font-bold text-gray-800 px-3 py-1 rounded-full shadow">
          ₹{abhyasika.min_price || '50'}/day
        </div>
        {abhyasika.available_seats > 0 && (
          <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {abhyasika.available_seats} seats free
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-bold text-gray-800 text-base leading-tight">{abhyasika.name}</h3>
          {abhyasika.rating_avg > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <i className="fas fa-star text-yellow-400 text-xs"></i>
              <span className="text-sm font-semibold text-gray-700">{Number(abhyasika.rating_avg).toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
          <i className="fas fa-location-dot text-indigo-400 text-xs"></i>
          {[abhyasika.locality_name, abhyasika.city_name].filter(Boolean).join(', ')}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {facilities.map((f: string) => (
            <span key={f} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{f.trim()}</span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
          <span><i className="fas fa-clock mr-1"></i>{abhyasika.opening_time} - {abhyasika.closing_time}</span>
          <span className="text-indigo-600 font-semibold">Book Now →</span>
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="h-44 bg-gray-200 loading-pulse"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded loading-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded loading-pulse w-1/2"></div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-6 w-16 bg-gray-200 rounded-full loading-pulse"></div>)}
        </div>
      </div>
    </div>
  );
}
