"use server";

import { Client } from "dwolla-v2";
import { createTransaction } from "./transaction.actions";
import { createAdminClient } from "../appwrite";
import { plaidClient } from "@/lib/plaid";
import { revalidatePath } from "next/cache";

const getEnvironment = (): "production" | "sandbox" => {
    const environment = process.env.DWOLLA_ENV as string;

    switch (environment) {
        case "sandbox":
            return "sandbox";
        case "production":
            return "production";
        default:
            throw new Error(
                "Dwolla environment should either be set to `sandbox` or `production`"
            );
    }
};

const dwollaClient = new Client({
    environment: getEnvironment(),
    key: process.env.DWOLLA_KEY as string,
    secret: process.env.DWOLLA_SECRET as string,
});

// Helper function to update bank balance
const updateBankBalance = async (bankId: string, amountChange: number) => {
    try {
        const { database } = await createAdminClient();
        const bank: any = await database.getDocument(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_BANK_COLLECTION_ID!,
            bankId
        );

        let currentBalance = bank.manualBalance;

        // If manualBalance doesn't exist yet, fetch from Plaid to initialize
        if (currentBalance === undefined || currentBalance === null) {
            const accountsResponse = await plaidClient.accountsGet({
                access_token: bank.accessToken,
            });
            const accountData = accountsResponse.data.accounts[0];
            currentBalance = accountData.balances.current!;
        }

        const newBalance = Number(currentBalance) + amountChange;

        await database.updateDocument(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_BANK_COLLECTION_ID!,
            bankId,
            {
                manualBalance: newBalance
            }
        );
    } catch (error) {
        console.error("Error updating balance:", error);
    }
};

// Get existing funding sources for a customer (used when DuplicateResource occurs)
const getExistingFundingSource = async (customerId: string): Promise<string | null> => {
    try {
        const res = await dwollaClient.get(`customers/${customerId}/funding-sources`);
        const sources = res.body._embedded?.["funding-sources"] ?? [];
        // Return the first non-balance funding source URL
        const source = sources.find((s: any) => s.type !== 'balance' && s.status !== 'removed');
        return source ? source._links.self.href : null;
    } catch (err) {
        console.error("Getting existing funding sources failed:", err);
        return null;
    }
};

// Create a Dwolla Funding Source using a Plaid Processor Token
export const createFundingSource = async (
    options: CreateFundingSourceOptions
) => {
    try {
        return await dwollaClient
            .post(`customers/${options.customerId}/funding-sources`, {
                name: options.fundingSourceName,
                plaidToken: options.plaidToken,
            })
            .then((res) => res.headers.get("location"));
    } catch (err: any) {
        // If the funding source already exists, return the existing one's URL
        const isDuplicate = err?.body?.code === 'DuplicateResource';
        if (isDuplicate) {
            console.warn("[Dwolla] DuplicateResource — returning existing funding source URL");
            return await getExistingFundingSource(options.customerId);
        }
        console.error("Creating a Funding Source Failed: ", err);
    }
};

export const createOnDemandAuthorization = async () => {
    try {
        const onDemandAuthorization = await dwollaClient.post(
            "on-demand-authorizations"
        );
        const authLink = onDemandAuthorization.body._links;
        return authLink;
    } catch (err) {
        console.error("Creating an On Demand Authorization Failed: ", err);
    }
};

export const createDwollaCustomer = async (
    newCustomer: NewDwollaCustomerParams
) => {
    try {
        return await dwollaClient
            .post("customers", newCustomer)
            .then((res) => res.headers.get("location"));
    } catch (err) {
        console.error("Creating a Dwolla Customer Failed: ", err);
    }
};

export const createTransfer = async ({
    sourceFundingSourceUrl,
    destinationFundingSourceUrl,
    amount,
    name,
    email,
    senderId,
    senderBankId,
    receiverId,
    receiverBankId,
}: TransferParams) => {
    try {
        const requestBody = {
            _links: {
                source: {
                    href: sourceFundingSourceUrl,
                },
                destination: {
                    href: destinationFundingSourceUrl,
                },
            },
            amount: {
                currency: "USD",
                value: amount,
            },
        };
        const transfer = await dwollaClient
            .post("transfers", requestBody)
            .then((res) => res.headers.get("location"));

        if (transfer) {
            const transactionValues = {
                name,
                amount,
                senderId,
                senderBankId,
                receiverId,
                receiverBankId,
                email,
            }

            await createTransaction(transactionValues);

            // Update sender's manual balance (Debit)
            await updateBankBalance(senderBankId, -Number(amount));

            // Update receiver's manual balance (Credit)
            await updateBankBalance(receiverBankId, Number(amount));

            revalidatePath("/");
        }

        return transfer;
    } catch (err) {
        console.error("Transfer fund failed: ", err);
    }
};

export const addFundingSource = async ({
    dwollaCustomerId,
    processorToken,
    bankName,
}: AddFundingSourceParams) => {
    try {
        // create dwolla auth link
        const dwollaAuthLinks = await createOnDemandAuthorization();

        // add funding source to the dwolla customer & get the funding source url
        const fundingSourceOptions = {
            customerId: dwollaCustomerId,
            fundingSourceName: bankName,
            plaidToken: processorToken,
            _links: dwollaAuthLinks,
        };
        return await createFundingSource(fundingSourceOptions);
    } catch (err) {
        console.error("Transfer fund failed: ", err);
    }
};
