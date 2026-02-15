'use client';

import { logoutAccount } from '@/lib/actions/user.actions'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'

import { useBalance } from './BalanceProvider';

const Footer = ({ user, type = 'desktop' }: FooterProps) => {
    const router = useRouter();
    const { source, toggleSource } = useBalance();

    const handleLogOut = async () => {
        const loggedOut = await logoutAccount();

        if(loggedOut) router.push('/sign-in')
    }

    return (
        <footer className="footer">
            <div className={type === 'mobile' ? 'footer_name-mobile' : 'footer_name'}>
                <p className="text-xl font-bold text-gray-700">
                    {user?.firstName[0]}
                </p>
            </div>

            <div className={type === 'mobile' ? 'footer_email-mobile' : 'footer_email'}>
                <h1 className="text-14 truncate text-gray-700 font-semibold">
                    {user?.firstName}
                </h1>
                <p className="text-14 truncate font-normal text-gray-600">
                    {user?.email}
                </p>
            </div>

            <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={toggleSource}>
                <div className={`size-2 rounded-full ${source === 'plaid' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-semibold text-gray-600">
                    {source === 'plaid' ? 'Plaid' : 'Appwrite'}
                </span>
            </div>

            <div className="footer_image" onClick={handleLogOut}>
                <Image src="icons/logout.svg" fill alt="jsm" />
            </div>
        </footer>
    )
}

export default Footer