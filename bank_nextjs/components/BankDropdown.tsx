"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
} from "@/components/ui/select";
import { formUrlQuery, formatAmount } from "@/lib/utils";

import { useBalance } from './BalanceProvider';

export const BankDropdown = ({
                                 accounts = [],
                                 setValue,
                                 otherStyles,
                                 id,
                             }: BankDropdownProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [selected, setSeclected] = useState(accounts[0]);
    const { source } = useBalance();

    const handleBankChange = (id: string) => {
        const account = accounts.find((account) => account.appwriteItemId === id)!;

        setSeclected(account);
        const newUrl = formUrlQuery({
            params: searchParams.toString(),
            key: "id",
            value: id,
        });
        router.push(newUrl, { scroll: false });

        if (setValue) {
            setValue("senderBank", id);
        }
    };

    return (
        <Select
            defaultValue={selected.id}
            onValueChange={(value) => handleBankChange(value)}
        >
            <SelectTrigger
                id={id}
                className={`flex w-full bg-white dark:bg-background gap-3 md:w-[300px] ${otherStyles}`}
            >
                <Image
                    src="icons/credit-card.svg"
                    width={20}
                    height={20}
                    alt="account"
                />
                <p className="line-clamp-1 w-full text-left">
                    {selected.name} ({formatAmount(
                        source === 'plaid' 
                            ? selected.currentBalance 
                            : (selected.manualBalance !== undefined ? selected.manualBalance : selected.currentBalance)
                    )})
                </p>
            </SelectTrigger>
            <SelectContent
                className={`w-full bg-white dark:bg-popover md:w-[300px] ${otherStyles}`}
                align="end"
            >
                <SelectGroup>
                    <SelectLabel className="py-2 font-normal text-gray-500">
                        Select a bank to display
                    </SelectLabel>
                    {accounts.map((account: Account) => (
                        <SelectItem
                            key={account.id}
                            value={account.appwriteItemId}
                            className="cursor-pointer border-t"
                        >
                            <div className="flex flex-col ">
                                <p className="text-16 font-medium">{account.name}</p>
                                <p className="text-14 font-medium text-blue-600">
                                    {formatAmount(
                                        source === 'plaid' 
                                            ? account.currentBalance 
                                            : (account.manualBalance !== undefined ? account.manualBalance : account.currentBalance)
                                    )}
                                </p>
                            </div>
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};