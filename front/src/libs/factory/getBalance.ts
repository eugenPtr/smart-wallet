import { Address, Hex } from "viem";
import { PUBLIC_CLIENT } from "@/constants/client";

export type User = { id: Hex; pubKey: { x: Hex; y: Hex }; account: Address; balance: bigint };

export async function getBalance(address: Hex): Promise<{ balance: bigint }> {
  try {
    const balance = await PUBLIC_CLIENT.getBalance({ address });
    return { balance };
  } catch (error) {
    console.error('Error fetching balance from RPC:', error);
    throw new Error("Failed to fetch balance");
  }
}
