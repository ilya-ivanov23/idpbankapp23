"use client";

import React, { createContext, useContext } from "react";

type BalanceSource = "api";

interface BalanceContextType {
  source: BalanceSource;
  toggleSource: () => void;
  setSource: (source: BalanceSource) => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider = ({ children }: { children: React.ReactNode }) => {
  const source: BalanceSource = "api";
  const setSource = () => {};
  const toggleSource = () => {};

  return (
    <BalanceContext.Provider value={{ source, toggleSource, setSource }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error("useBalance must be used within a BalanceProvider");
  }
  return context;
};
