"use client";

import { formatAmount } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Copy from './Copy'

const BankCard = ({ account, userName, showBalance = true }: CreditCardProps) => {
    const balance = account.currentBalance;

    return (
        <div className="flex flex-col">
            <Link href={`/transaction-history/?id=${account.appwriteItemId}`} className="bank-card">
                <div className="bank-card_content">
                    <div>
                        <h1 className="text-14 font-bold text-white pb-0.5 sm:text-16 capitalize">
                            {account.subtype}
                        </h1>
                        <p className="font-ibm-plex-serif font-black text-white text-12 sm:text-16">
                            {formatAmount(balance)}
                        </p>
                    </div>

                    <article className="flex flex-col gap-2">
                        <div className="flex justify-between">
                            <h1 className="text-12 font-semibold text-white sm:text-12">
                                {userName}
                            </h1>
                            <h2 className="text-10 font-semibold text-white sm:text-12">
                                ●● / ●●
                            </h2>
                        </div>
                        <p className="text-10 font-semibold tracking-[1.1px] text-white sm:text-14">
                            ●●●● ●●●● ●●●● <span className="text-12 sm:text-14">{account.mask}</span>
                        </p>
                    </article>
                </div>

                <div className="bank-card_icon">
                    <Image
                        src="/icons/Paypass.svg"
                        width={20}
                        height={24}
                        alt="pay"
                    />
                    <Image
                        src="/icons/mastercard.svg"
                        width={45}
                        height={32}
                        alt="mastercard"
                        className="ml-5"
                    />
                </div>

                <div className="absolute top-0 left-0 w-full h-full">
                    <Image
                        src="/icons/lines.png"
                        fill
                        alt="lines"
                        className="object-contain"
                    />
                </div>
            </Link>

            {showBalance && <Copy title={account?.shareableId} />}
        </div>
    )
}

export default BankCard
