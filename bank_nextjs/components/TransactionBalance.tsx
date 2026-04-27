"use client";

import React from 'react';
import { formatAmount } from '@/lib/utils';

const TransactionBalance = ({ account }: { account: any }) => {
    const balance = account?.currentBalance;

    return (
        <p className="text-24 text-center font-bold">
            {formatAmount(balance)}
        </p>
    );
};

export default TransactionBalance;
