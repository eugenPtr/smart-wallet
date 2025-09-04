import { CHAIN, PUBLIC_CLIENT, transport } from "@/constants";
import { FACTORY_ABI } from "@/constants/factory";
import { Hex, createWalletClient, toHex, zeroAddress, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export async function POST(req: Request) {
  const { id, pubKey } = (await req.json()) as { id: Hex; pubKey: [Hex, Hex] };

  const account = privateKeyToAccount(process.env.RELAYER_PRIVATE_KEY as Hex);
  const walletClient = createWalletClient({
    account,
    chain: CHAIN,
    transport,
  });

  // Hash the ID to ensure it fits within 256-bit range for smart contract
  const hashedId = keccak256(id);

  const user = await PUBLIC_CLIENT.readContract({
    address: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS as Hex,
    abi: FACTORY_ABI,
    functionName: "getUser",
    args: [BigInt(hashedId)],
  });

  if (user.account !== zeroAddress) {
    return Response.json(undefined);
  }

  await walletClient.writeContract({
    address: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS as Hex,
    abi: FACTORY_ABI,
    functionName: "saveUser",
    args: [BigInt(hashedId), pubKey],
  });

  const smartWalletAddress = await PUBLIC_CLIENT.readContract({
    address: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS as Hex,
    abi: FACTORY_ABI,
    functionName: "getAddress",
    args: [pubKey],
  });

  await walletClient.sendTransaction({
    to: smartWalletAddress,
    value: BigInt(1),
  });

  const createdUser = {
    id,
    account: smartWalletAddress,
    pubKey,
  };

  return Response.json(createdUser);
}
