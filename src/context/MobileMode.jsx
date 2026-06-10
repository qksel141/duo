import React, { createContext, useContext, useEffect, useState } from 'react';

const MobileModeContext = createContext({
  viewMode: 'pc',
  isMobileMode: false,
  setViewMode: () => {},
  toggleViewMode: () => {},
});

export function MobileModeProvider({ children }) {
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'pc';
  });

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const value = {
    viewMode,
    isMobileMode: viewMode === 'mobile',
    setViewMode,
    toggleViewMode: () =>
      setViewMode((prev) => (prev === 'mobile' ? 'pc' : 'mobile')),
  };

  return (
    <MobileModeContext.Provider value={value}>
      {children}
    </MobileModeContext.Provider>
  );
}

export function useMobileMode() {
  return useContext(MobileModeContext);
}
