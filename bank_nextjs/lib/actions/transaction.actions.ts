"use server";
import { apiClient } from '../apiClient';
import { revalidatePath } from 'next/cache';

export const createTransaction = async (transaction: CreateTransactionProps) => {
  const res = await apiClient.post('/api/transactions/transfer', { 
    toAccount: transaction.receiverId, amount: transaction.amount, currency: "USD" 
  }, { headers: { 'x-pin': process.env.TRANSACTION_PIN || '' } });
  revalidatePath('/');
  return res.data;
}

export const getTransactionsByBankId = async ( { bankId }: getTransactionsByBankIdProps ) => {
  return { transactions: [] };
}