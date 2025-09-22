"use client";

import { getBalance } from "@/libs/factory/getBalance";
import { useMe } from "@/providers/MeProvider";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Hex, formatEther } from "viem";

function useBalanceHook() {
  // balance in ETH - null indicates loading state
  const [balance, setBalance] = useState<string | null>(null);
  const [increment, setIncrement] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const { me } = useMe();

  const fetchBalanceInETH = useCallback(async (address: Hex) => {
    try {
      setError(null);
      const res = await getBalance(address);
      const balanceInETH = formatEther(res.balance);
      setBalance(balanceInETH);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    }
  }, []);

  const refreshBalance = useCallback(() => {
    setIncrement((prev) => prev + 1);
  }, []);

  let interval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!me?.account) return;
    
    fetchBalanceInETH(me?.account);
    interval.current && clearInterval(interval.current);
    interval.current = setInterval(() => {
      fetchBalanceInETH(me?.account);
    }, 5000);

    return () => {
      interval.current && clearInterval(interval.current);
    };
  }, [me?.account, fetchBalanceInETH, increment]);

  return {
    balance,
    error,
    getBalance,
    refreshBalance,
  };
}

type UseBalanceHook = ReturnType<typeof useBalanceHook>;
const BalanceContext = createContext<UseBalanceHook | null>(null);

export const useBalance = (): UseBalanceHook => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error("useBalanceHook must be used within a BalanceProvider");
  }
  return context;
};

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const hook = useBalanceHook();

  return <BalanceContext.Provider value={hook}>{children}</BalanceContext.Provider>;
}
