import { Address, Hex } from "viem";

export type User = { id: Hex; pubKey: { x: Hex; y: Hex }; account: Address; balance: bigint };

export async function getBalance(address: Hex): Promise<{ balance: bigint }> {
  const response = await fetch(`/api/balance/${address}`, {
    method: "GET",
  });

  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || `Failed to fetch balance: ${response.status}`);
  }
  
  return {
    balance: data.balance,
  };
}
