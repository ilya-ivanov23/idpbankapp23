"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import React from "react";
import BankCard from "./BankCard";
import Category from "./Category";
import { countTransactionCategories, cn } from "@/lib/utils";
import PlaidLink from "@/components/PlaidLink";

interface MobileProfileProps {
  user: any;
  banks: any[];
  transactions: any[];
}

const MobileProfile = ({ user, banks = [], transactions = [] }: MobileProfileProps) => {
  const categories: CategoryCount[] = countTransactionCategories(transactions);

  return (
    <section className="w-fit">
      <Sheet>
        <SheetTrigger>
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer">
            <span className="text-xl font-bold text-blue-700 dark:text-gray-300">
              {user?.firstName[0]}
            </span>
          </div>
        </SheetTrigger>
        <SheetContent side="right" className="border-none bg-white dark:bg-background p-0 gap-0 sm:max-w-[340px]">
          <SheetTitle className="sr-only">Profile Details</SheetTitle>
          <SheetDescription className="sr-only">Access your profile and banking information</SheetDescription>
          <div className="h-full overflow-y-auto">
             <div className="profile-banner-mobile" />
             <div className="profile">
                <div className="profile-img">
                   <span className="text-5xl font-bold text-blue-500">{user.firstName[0]}</span>
                </div>
                <div className="profile-details">
                   <h1 className='profile-name'>
                      {user.firstName} {user.lastName}
                   </h1>
                   <p className="profile-email">
                      {user.email}
                   </p>
                </div>
             </div>

          <div className="banks mt-10">
            <div className="flex w-full justify-between  items-center">
                <h2 className="header-2">My Banks</h2>
                <PlaidLink user={user} variant="mini" />
            </div>
             <div className="relative flex flex-1 flex-col items-center justify-center gap-7 mt-5">
                 {banks.length > 0 ? (
                    banks.map((bank) => (
                       <BankCard
                          key={bank.id}
                          account={bank}
                          userName={`${user.firstName} ${user.lastName}`}
                          showBalance={false}
                       />
                    ))
                 ) : (
                     <p className="text-gray-500">No banks connected</p>
                 )}
             </div>
          </div>
          
          <div className="mt-10 flex flex-1 flex-col gap-6 px-6 pb-5">
             <h2 className="header-2">Top categories</h2>
             <div className='space-y-5'>
                {categories.map((category) => (
                    <Category key={category.name} category={category} />
                ))}
             </div>
          </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileProfile;
