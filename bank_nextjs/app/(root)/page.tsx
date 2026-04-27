export const dynamic = 'force-dynamic';
import HeaderBox from '@/components/HeaderBox'
import RecentTransactions from '@/components/RecentTransactions';
import RightSidebar from '@/components/RightSidebar';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import { getAccounts } from '@/lib/actions/bank.actions';
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

    const hasNoAccounts = !accounts?.data || accounts.data.length === 0;

    if (hasNoAccounts) {
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
                                🏦 No bank accounts connected
                            </h2>
                            <p className="reconnect-banner-text">
                                Connect your bank account to start tracking your transactions and balances.
                            </p>
                        </div>
                    </div>
                </div>


            </section>
        );
    }

    const accountsData = accounts.data;
    const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
    const account = accountsData.find((item: Account) => item.appwriteItemId === appwriteItemId) || accountsData[0];

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
                    transactions={[]}
                    appwriteItemId={appwriteItemId}
                    page={currentPage}
                />
            </div>

        </section>
    );
}

export default Home