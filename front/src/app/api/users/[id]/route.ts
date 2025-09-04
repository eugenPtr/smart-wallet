import { PUBLIC_CLIENT } from "@/constants/client";
import { FACTORY_ABI } from "@/constants/factory";
import { Hex, stringify, toHex, keccak256 } from "viem";

export async function GET(_req: Request, { params }: { params: { id: Hex } }) {
  const { id } = params;
  if (!id) {
    return Response.json(JSON.parse(stringify({ error: "id is required" })));
  }

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
      balance = await PUBLIC_CLIENT.getBalance({ address: user.account });
    } catch (error) {
      console.error('Error fetching balance from RPC:', error);
      // Fallback to 0 balance if RPC fails
      balance = BigInt(0);
    }
  }

  return Response.json(JSON.parse(stringify({ ...user, id: toHex(user.id), balance })));
}
