'use client'

import { sidebarLinks } from '@/constants'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Footer from './Footer'
import PlaidLink from './PlaidLink'
import { useBalance } from './BalanceProvider';
import { ModeToggle } from "@/components/ModeToggle";

const Sidebar = ({ user }: SiderbarProps) => {
    const pathname = usePathname();
    const { source, toggleSource } = useBalance();

    return (
        <section className="sidebar">
            <nav className="flex flex-col gap-4">
                <Link href="/" className="mb-12 cursor-pointer flex items-center gap-2">
                    <Image
                        src="/icons/logo.svg"
                        width={34}
                        height={34}
                        alt="IDPBank logo"
                        className="size-[24px] max-xl:size-14"
                    />
                    <h1 className="sidebar-logo">IDPBank</h1>
                </Link>

                {sidebarLinks.map((item) => {
                    const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`)

                    return (
                        <Link href={item.route} key={item.label}
                              className={cn('sidebar-link', { 'bg-bank-gradient': isActive })}
                        >
                            <div className="relative size-6">
                                <Image
                                    src={item.imgURL}
                                    alt={item.label}
                                    fill
                                    className={cn({
                                        'brightness-[3] invert-0': isActive
                                    })}
                                />
                            </div>
                            <p className={cn("sidebar-label", { "!text-white": isActive })}>
                                {item.label}
                            </p>
                        </Link>
                    )
                })}

                <PlaidLink user={user} />
            </nav>
<div    className="flex flex-col gap-2">
            <Footer user={user} />
            
                <div className="flex flex-row  items-center justify-center py-2 gap-1 cursor-pointer" onClick={toggleSource}>
                    <div className={`size-2.5 rounded-full ${source === 'plaid' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[15px] font-semibold text-gray-600">
                        {source === 'plaid' ? 'Plaid Mode' : 'Appwrite Mode'}
                    </span>
            </div>
            
                <ModeToggle />
                  </div>  
        </section>
    )
}

export default Sidebar