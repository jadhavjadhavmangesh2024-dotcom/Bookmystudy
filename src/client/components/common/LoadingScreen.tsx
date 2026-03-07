import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <i className="fas fa-book-open text-white text-2xl loading-spinner" style={{animationDuration:'1.5s'}}></i>
        </div>
        <h2 className="text-xl font-bold text-gray-800 font-poppins">Abhyasika</h2>
        <p className="text-gray-500 mt-1 text-sm">Loading your study space...</p>
        <div className="flex justify-center gap-1 mt-4">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full loading-pulse" style={{animationDelay:`${i*0.2}s`}}></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Spinner({ size = 'md', color = 'indigo' }: { size?: 'sm'|'md'|'lg', color?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-${color}-200 border-t-${color}-600 rounded-full loading-spinner`}></div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-gray-500 mt-3 text-sm">Loading...</p>
      </div>
    </div>
  );
}
