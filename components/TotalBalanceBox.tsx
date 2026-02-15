"use client";

import React from 'react'
import AnimatedCounter from "@/components/AnimatedCounter";
import DoughnutChart from "@/components/DoughnutChart";
import { useBalance } from './BalanceProvider';

const TotalBalanceBox = ({
    accounts = [], totalBanks, totalCurrentBalance
                         }: TotalBalanceBoxProps) => {
    const { source } = useBalance();

    const totalManualBalance = accounts.reduce((total, account) => {
        return total + (account.manualBalance ?? account.currentBalance);
    }, 0);

    return (
        <section className="total-balance">
            <div className="total-balance-chart">
                <DoughnutChart accounts={accounts} />
            </div>

            <div className="flex flex-col gap-6">
                <h2 className="header-2">
                    Bank Accounts: {totalBanks}
                </h2>
                <div className="flex flex-col gap-2">
                    <p className="total-balance-label">
                        {source === 'plaid' ? 'Total Current Balance' : 'Total Appwrite Balance'}
                    </p>

                    <div className="total-balance-amount flex-center gap-2">
                        <AnimatedCounter amount={source === 'plaid' ? totalCurrentBalance : totalManualBalance} />
                    </div>
                </div>
            </div>
        </section>
    )
}
export default TotalBalanceBox
