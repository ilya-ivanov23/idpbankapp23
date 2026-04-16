'use client'

import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { sidebarLinks } from "@/constants"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Footer from "@/components/Footer";
import { useBalance } from './BalanceProvider';
import PlaidLink from "@/components/PlaidLink";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";


const MobileNav = ({ user }: MobileNavProps) => {
    const pathname = usePathname();
       const { source, toggleSource } = useBalance();

    return (
        <section className="w-fit">
            <Sheet>
                <SheetTrigger>
                    <Image
                        src="/icons/hamburger.svg"
                        width={30}
                        height={30}
                        alt="menu"
                        className="cursor-pointer dark:invert"
                    />
                </SheetTrigger>
                <SheetContent side="left" className="border-none bg-white dark:bg-background pt-4">
                    <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
                    <SheetDescription className="sr-only">Navigate the banking application</SheetDescription>
                    <Link href="/" className="cursor-pointer flex items-center gap-1 px-4">
                        <Image
                            src="/icons/logo.svg"
                            width={34}
                            height={34}
                            alt="IDPBank logo"
                        />
                        <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">IDPBank</h1>
                    </Link>
                    <div className="mobilenav-sheet">
                            <nav className="flex h-full flex-col gap-6 pt-16 text-white">
                                {sidebarLinks.map((item) => {
                                    const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`)

                                    return (
                                        <SheetClose asChild key={item.route}>
                                            <Link href={item.route} key={item.label}
                                                className={cn('mobilenav-sheet_close w-full', { 'bg-bank-gradient': isActive })}
                                            >
                                                <Image
                                                    src={item.imgURL}
                                                    alt={item.label}
                                                    width={20}
                                                    height={20}
                                                    className={cn({
                                                        'brightness-[3] invert-0': isActive
                                                    })}
                                                />
                                                <p className={cn("text-16 font-semibold text-black-2", { "text-white": isActive })}>
                                                    {item.label}
                                                </p>
                                            </Link>
                                        </SheetClose>
                                    )
                                })}

                                <div className="ml-5">
                                    <SheetClose asChild>
                                        <Button
                                            className="plaidlink-default w-full"
                                            onClick={() => {
                                                const sidebarPlaidBtn = document.querySelector('.sidebar .plaidlink-default') as HTMLButtonElement | null;
                                                if (sidebarPlaidBtn) {
                                                    sidebarPlaidBtn.click();
                                                }
                                            }}
                                        >
                                            <Image
                                                src="/icons/connect-bank.svg"
                                                alt="connect bank"
                                                width={24}
                                                height={24}
                                            />
                                            <p className="text-[16px] font-semibold text-black-2 dark:text-white">Connect bank</p>
                                        </Button>
                                    </SheetClose>
                                </div>
                            </nav>

                        <Footer user={user} type="mobile" />

                        <div className="flex flex-row  items-center justify-center py-2 gap-1 cursor-pointer" onClick={toggleSource}>
                            <div className={`size-2.5 rounded-full ${source === 'plaid' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[15px] font-semibold text-gray-600">
                                {source === 'plaid' ? 'Plaid Mode' : 'Appwrite Mode'}
                            </span>
                        </div>
                        
                        <div>
                             <ModeToggle />

                        </div>
                       
                    </div>
                </SheetContent>
            </Sheet>
        </section>
    )
}

export default MobileNav
