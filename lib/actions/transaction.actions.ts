"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import { generateReceiptPdf } from "../pdf";
import { uploadDocumentToS3 } from "../s3";

const {
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_TRANSACTION_COLLECTION_ID: TRANSACTION_COLLECTION_ID,
    APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
} = process.env;

export const createTransaction = async (transaction: CreateTransactionProps) => {
    try {
        const { database } = await createAdminClient();

        // 1. Fetch Sender and Receiver data from Appwrite Users collection
        const sender = await database.getDocument(
            DATABASE_ID!,
            USER_COLLECTION_ID!,
            transaction.senderId
        );

        let receiver;
        try {
            receiver = await database.getDocument(
                DATABASE_ID!,
                USER_COLLECTION_ID!,
                transaction.receiverId
            );
        } catch (e) {
            // Unlikely to happen, but good fallback just in case
            receiver = { firstName: 'Unknown', lastName: 'User' };
        }

        const senderFullName = `${(sender as any).firstName} ${(sender as any).lastName}`;
        const receiverFullName = `${(receiver as any).firstName} ${(receiver as any).lastName}`;

        // 2. Generate a unique ID for the Appwrite transaction (and for the PDF file name)
        const transactionId = ID.unique();

        // 3. Generate a beautiful PDF receipt on the fly in RAM
        const pdfBuffer = await generateReceiptPdf(
            transactionId,
            transaction.amount,
            new Date(),
            senderFullName,
            transaction.senderBankId,
            receiverFullName,
            transaction.receiverBankId,
            transaction.name // Description of transfer
        );

        // 3. Send the PDF receipt to our S3 (MinIO)
        const receiptFileName = `receipt_${transactionId}.pdf`;
        const receiptUrl = await uploadDocumentToS3(pdfBuffer, receiptFileName);

        // 4. Save to Appwrite Database (the receiptUrl string instead of the file!)
        const newTransaction = await database.createDocument(
            DATABASE_ID!,
            TRANSACTION_COLLECTION_ID!,
            transactionId,
            {
                channel: 'online',
                category: 'Transfer',
                receiptUrl: receiptUrl, // <== IMPORTANT: We save the LINK in the database
                ...transaction
            }
        )

        return parseStringify(newTransaction);
    } catch (error) {
        console.error("Error creating transaction in Appwrite:", error);
    }
}

export const getTransactionsByBankId = async ({bankId}: getTransactionsByBankIdProps) => {
    try {
        const { database } = await createAdminClient();

        const senderTransactions = await database.listDocuments(
            DATABASE_ID!,
            TRANSACTION_COLLECTION_ID!,
            [Query.equal('senderBankId', bankId)],
        )

        const receiverTransactions = await database.listDocuments(
            DATABASE_ID!,
            TRANSACTION_COLLECTION_ID!,
            [Query.equal('receiverBankId', bankId)],
        );

        const transactions = {
            total: senderTransactions.total + receiverTransactions.total,
            documents: [
                ...senderTransactions.documents,
                ...receiverTransactions.documents,
            ]
        }

        return parseStringify(transactions);
    } catch (error) {
        console.log(error);
    }
}