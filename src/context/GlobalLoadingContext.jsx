// src/context/GlobalLoadingContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const GlobalLoadingContext = createContext(null);

/**
 * Proveedor global de loading.
 * Envuelve toda la app en App.jsx o main.jsx:
 *
 *   <GlobalLoadingProvider>
 *     <App />
 *   </GlobalLoadingProvider>
 */
export function GlobalLoadingProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = useCallback(() => {
    setLoadingCount(prev => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount(prev => Math.max(0, prev - 1));
  }, []);

  const isAnyLoading = loadingCount > 0;

  return (
    <GlobalLoadingContext.Provider value={{ isAnyLoading, startLoading, stopLoading }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const ctx = useContext(GlobalLoadingContext);
  if (!ctx) {
    throw new Error('useGlobalLoading debe usarse dentro de <GlobalLoadingProvider>');
  }
  return ctx;
}