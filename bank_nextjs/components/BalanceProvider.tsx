"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type BalanceSource = "plaid" | "appwrite";

interface BalanceContextType {
  source: BalanceSource;
  toggleSource: () => void;
  setSource: (source: BalanceSource) => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [source, setSourceState] = useState<BalanceSource>("plaid");

  useEffect(() => {
    // Optionally persist preference in localStorage
    const savedSource = localStorage.getItem("balanceSource") as BalanceSource;
    if (savedSource) {
      setSourceState(savedSource);
    }
  }, []);

  const setSource = (newSource: BalanceSource) => {
    setSourceState(newSource);
    localStorage.setItem("balanceSource", newSource);
  }

  const toggleSource = () => {
    setSource(source === "plaid" ? "appwrite" : "plaid");
  };

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
