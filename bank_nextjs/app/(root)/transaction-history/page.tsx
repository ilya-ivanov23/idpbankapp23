export const dynamic = 'force-dynamic';
import HeaderBox from '@/components/HeaderBox'
import { Pagination } from '@/components/Pagination';
import TransactionsTable from '@/components/TransactionsTable';
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { formatAmount } from '@/lib/utils';
import React from 'react'
import TransactionBalance from '@/components/TransactionBalance';

const TransactionHistory = async ({ searchParams: { id, page } }: SearchParamProps) => {
    const currentPage = Number(page as string) || 1;
    const loggedIn = await getLoggedInUser();
    if (!loggedIn) {
        // Handle no user case - redirecting to signup or showing error
        return null; 
    }
    const accounts = await getAccounts({
        userId: loggedIn.$id
    })

    if (!accounts) return;

    const accountsData = accounts?.data;
    const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

    const account = accountsData.find((item: Account) => item.appwriteItemId === appwriteItemId) || accountsData[0];
    const transactions: Transaction[] = [];


    const rowsPerPage = 10;
    const totalPages = Math.ceil(transactions.length / rowsPerPage);

    const indexOfLastTransaction = currentPage * rowsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;

    const currentTransactions = transactions.slice(
        indexOfFirstTransaction, indexOfLastTransaction
    )
    return (
        <div className="transactions">
            <div className="transactions-header">
                <HeaderBox
                    title="Transaction History"
                    subtext="See your bank details and transactions."
                />
            </div>

            <div className="space-y-6">
                <div className="transactions-account">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-18 font-bold text-white">{account?.name}</h2>
                        <p className="text-14 text-blue-25">
                            {account?.officialName}
                        </p>
                        <p className="text-14 font-semibold tracking-[1.1px] text-white">
                            ●●●● ●●●● ●●●● {account?.mask}
                        </p>
                    </div>

                    <div className='transactions-account-balance'>
                        <p className="text-14">Current balance</p>
                        <TransactionBalance account={account} />
                    </div>
                </div>

                <section className="flex w-full flex-col gap-6">
                    <TransactionsTable
                        transactions={currentTransactions}
                    />
                    {totalPages > 1 && (
                        <div className="my-4 w-full">
                            <Pagination totalPages={totalPages} page={currentPage} />
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

export default TransactionHistory