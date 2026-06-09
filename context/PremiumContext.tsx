import React, { createContext, useState, useContext } from 'react';

// 1. Definimos qué datos va a guardar nuestra memoria global
type PremiumContextType = {
  isPremium: boolean;
  activarPremium: () => void;
};

// 2. Creamos el contexto (El interruptor)
const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

// 3. Creamos el proveedor que envolverá toda nuestra app
export const PremiumProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPremium, setIsPremium] = useState(false); // Por defecto, todos inician en Gratis

  const activarPremium = () => {
    setIsPremium(true);
  };

  return (
    <PremiumContext.Provider value={{ isPremium, activarPremium }}>
      {children}
    </PremiumContext.Provider>
  );
};

// 4. Un atajo para usar este interruptor fácilmente en cualquier pantalla
export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error("usePremium debe usarse dentro de un PremiumProvider");
  }
  return context;
};