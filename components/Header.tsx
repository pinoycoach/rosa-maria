import React from 'react';

// The top bar: the name, which always leads home.
export const Header: React.FC<{ onHome: () => void }> = ({ onHome }) => (
  <header className="print:hidden border-b border-marian-100 bg-cream/90 backdrop-blur sticky top-0 z-10">
    <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
      <button onClick={onHome} className="flex items-center gap-2.5" aria-label="Rosa Maria, home">
        <img src="/icon.svg" alt="" className="w-9 h-9" />
        <span className="font-serif text-2xl text-marian-800">Rosa Maria</span>
      </button>
    </div>
  </header>
);
