"use server";
import { apiClient } from '../apiClient';

export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    const res = await apiClient.get(`/api/internal/accounts/${userId}`);
    const mappedAccounts = res.data.map((acc: any) => ({
      id: acc.id,
      institutionId: acc.institutionId || '',
      appwriteItemId: acc.id,
      accountId: acc.id,
      availableBalance: acc.balance,
      currentBalance: acc.balance,
      officialName: `IDPBank ${acc.currencyCode}`,
      mask: acc.id.slice(-4) || "0000",
      type: "depository",
      subtype: acc.assetType.toLowerCase(),
      name: `${acc.currencyCode} Wallet`,
      shareableId: acc.id
    }));
    const totalBalance = mappedAccounts.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0);
    return { data: mappedAccounts, totalBanks: mappedAccounts.length, totalCurrentBalance: totalBalance };
  } catch (error) {
    return { data:[], totalBanks: 0, totalCurrentBalance: 0 };
  }
}

export const getAccount = async ( { appwriteItemId }: getAccountProps ): Promise<any> => {
 return { data: null, transactions: [] };
}
export const getInstitution = async ( { institutionId }: getInstitutionProps ) => {  return { logoBase64: "" }; }