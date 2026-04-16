"use client";

import React from 'react';
import { useBalance } from './BalanceProvider';
import { formatAmount } from '@/lib/utils'; 

const TransactionBalance = ({ account }: { account: any }) => {
    const { source } = useBalance();
    
    // Retrieve balances, fallback to currentBalance if manualBalance is missing
    const balance = source === 'plaid' 
        ? account?.currentBalance 
        : (account?.manualBalance !== undefined && account?.manualBalance !== null ? account.manualBalance : account?.currentBalance);

    return (
        <p className="text-24 text-center font-bold">
            {formatAmount(balance)}
        </p>
    );
};

export default TransactionBalance;
