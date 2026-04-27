import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import MobileNav from "@/components/MobileNav"; // Add this back
import MobileProfile from "@/components/MobileProfile";
import {getLoggedInUser} from "@/lib/actions/user.actions";
import { getAccounts } from "@/lib/actions/bank.actions";
import {redirect} from "next/navigation";

export default async function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    const loggedIn = await getLoggedInUser();

    if (!loggedIn) redirect('/sign-in')
    
    const accounts = await getAccounts({ userId: loggedIn.$id });
    
    const transactions: Transaction[] = [];

    return (
       <main className="flex h-screen w-full font-inter">
           <Sidebar user={loggedIn} />
           <div className="flex size-full flex-col">
              <div className="root-layout flex justify-between items-center">
                  <MobileNav user={loggedIn} />
                
                  <div className="flex items-center gap-2">
                    <Image src="/icons/logo.svg" alt="logo" width={30} height={30} />
                    <div className="font-bold text-black-1">IDPBank</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MobileProfile user={loggedIn} banks={accounts?.data} transactions={transactions} />
                  </div>
              </div>
               {children}
           </div>
       </main>
    );
}
