import HeaderBox from '@/components/HeaderBox'
import RecentTransactions from '@/components/RecentTransactions';
import RightSidebar from '@/components/RightSidebar';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import PlaidLink from '@/components/PlaidLink';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { redirect } from "next/navigation";
import Image from 'next/image';

const Home = async ({ searchParams: { id, page } }: SearchParamProps) => {
    const currentPage = Number(page as string) || 1;
    const loggedIn = await getLoggedInUser();
    if (!loggedIn) {
        redirect('/sign-in');
    }

    const accounts = await getAccounts({ userId: loggedIn.$id });

    // Handle case when bank token expired (ITEM_LOGIN_REQUIRED) or no accounts at all
    const hasLoginError = accounts?.error === 'ITEM_LOGIN_REQUIRED';
    const hasNoAccounts = !accounts?.data || accounts.data.length === 0;

    if (hasLoginError || hasNoAccounts) {
        return (
            <section className="home">
                <div className="home-content">
                    <header className="home-header">
                        <HeaderBox
                            type="greeting"
                            title="Welcome"
                            user={loggedIn?.firstName || 'Guest'}
                            subtext="Access and manage your account and transactions efficiently."
                        />
                    </header>

                    {/* Reconnect banner */}
                    <div className="reconnect-banner">
                        <div className="reconnect-banner-icon">
                            <Image
                                src="/icons/connect-bank.svg"
                                alt="bank"
                                width={40}
                                height={40}
                            />
                        </div>
                        <div className="reconnect-banner-content">
                            <h2 className="reconnect-banner-title">
                                {hasLoginError
                                    ? '🔒 Bank connection needs to be updated'
                                    : '🏦 No bank accounts connected'}
                            </h2>
                            <p className="reconnect-banner-text">
                                {hasLoginError
                                    ? 'Your bank session has expired. Please reconnect your bank account to continue viewing your balance and transactions.'
                                    : 'Connect your bank account to start tracking your transactions and balances.'}
                            </p>
                            <PlaidLink user={loggedIn} variant="primary" />
                        </div>
                    </div>
                </div>

                <RightSidebar
                    user={loggedIn}
                    transactions={[]}
                    banks={[]}
                />
            </section>
        );
    }

    const accountsData = accounts.data;
    const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
    const account = await getAccount({ appwriteItemId });

    return (
        <section className="home">
            <div className="home-content">
                <header className="home-header">
                    <HeaderBox
                        type="greeting"
                        title="Welcome"
                        user={loggedIn?.firstName || 'Guest'}
                        subtext="Access and manage your account and transactions efficiently."
                    />

                    <TotalBalanceBox
                        accounts={accountsData}
                        totalBanks={accounts?.totalBanks}
                        totalCurrentBalance={accounts?.totalCurrentBalance}
                    />
                </header>

                <RecentTransactions
                    accounts={accountsData}
                    transactions={account?.transactions}
                    appwriteItemId={appwriteItemId}
                    page={currentPage}
                />
            </div>

            <RightSidebar
                user={loggedIn}
                transactions={account?.transactions}
                banks={accountsData?.slice(0, 2)}
            />
        </section>
    );
}

export default Home