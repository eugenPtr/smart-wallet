import { Address, Hex, keccak256, toHex } from "viem";
import { PUBLIC_CLIENT } from "@/constants/client";
import { FACTORY_ABI } from "@/constants/factory";
import { getBalance } from "./getBalance";

export type User = { id: Hex; pubKey: { x: Hex; y: Hex }; account: Address; balance: bigint };

export async function getUser(id: Hex): Promise<User> {
  // Hash the ID to ensure it fits within 256-bit range for smart contract
  const hashedId = keccak256(id);

  const user = await PUBLIC_CLIENT.readContract({
    address: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS as Hex,
    abi: FACTORY_ABI,
    functionName: "getUser",
    args: [BigInt(hashedId)],
  });

  let balance = BigInt(0);

  if (user?.account) {
    try {
      const balanceResult = await getBalance(user.account);
      balance = balanceResult.balance;
    } catch (error) {
      console.error('Error fetching balance from RPC:', error);
      // Fallback to 0 balance if RPC fails
      balance = BigInt(0);
    }
  }

  return {
    id: toHex(user.id),
    pubKey: {
      x: user.publicKey[0],
      y: user.publicKey[1],
    },
    account: user.account,
    balance,
  };
}
