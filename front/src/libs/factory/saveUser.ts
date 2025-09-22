import { Hex, createWalletClient, zeroAddress, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN, PUBLIC_CLIENT, alchemyTransport } from "@/constants";
import { FACTORY_ABI } from "@/constants/factory";
import { User } from "./getUser";

export async function saveUser({
  id,
  pubKey,
}: {
  id: Hex;
  pubKey: { x: Hex; y: Hex };
}): Promise<Omit<User, "balance">> {
  console.log("🏭 saveUser() called with id:", id, "pubKey:", pubKey);
  
  try {
    // Validate environment variables
    console.log("🏭 Validating environment variables...");
    const relayerPrivateKey = process.env.NEXT_PUBLIC_RELAYER_PRIVATE_KEY as Hex;
    const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS as Hex;
    
    if (!relayerPrivateKey) {
      console.error("🏭 NEXT_PUBLIC_RELAYER_PRIVATE_KEY environment variable not set");
      throw new Error("NEXT_PUBLIC_RELAYER_PRIVATE_KEY environment variable not set");
    }
    
    if (!factoryAddress) {
      console.error("🏭 NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS environment variable not set");
      throw new Error("NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS environment variable not set");
    }
    
    console.log("🏭 Factory address:", factoryAddress);
    console.log("🏭 Relayer private key exists:", !!relayerPrivateKey);
    
    console.log("🏭 Creating wallet client...");
    const account = privateKeyToAccount(relayerPrivateKey);
    const walletClient = createWalletClient({
      account,
      chain: CHAIN,
      transport: alchemyTransport,
    });

    // Hash the ID to ensure it fits within 256-bit range for smart contract
    const hashedId = keccak256(id);
    console.log("🏭 Hashed ID:", hashedId);

    console.log("🏭 Checking if user already exists...");
    const user = await PUBLIC_CLIENT.readContract({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: "getUser",
      args: [BigInt(hashedId)],
    });

    console.log("🏭 Existing user check result:", user);

    if (user.account !== zeroAddress) {
      console.log("🏭 User already exists, returning existing user");
      return {
        id,
        account: user.account,
        pubKey: {
          x: pubKey.x,
          y: pubKey.y,
        },
      };
    }

    console.log("🏭 Saving user to contract...");
    const txHash = await walletClient.writeContract({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: "saveUser",
      args: [BigInt(hashedId), [pubKey.x, pubKey.y]],
    });

    console.log("🏭 User save transaction hash:", txHash);

    console.log("🏭 Getting smart wallet address...");
    const smartWalletAddress = await PUBLIC_CLIENT.readContract({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: "getAddress",
      args: [[pubKey.x, pubKey.y]],
    });

    console.log("🏭 Smart wallet address:", smartWalletAddress);

    console.log("🏭 Sending initial funding transaction...");
    const fundingTxHash = await walletClient.sendTransaction({
      to: smartWalletAddress,
      value: BigInt(1),
    });

    console.log("🏭 Funding transaction hash:", fundingTxHash);

    const createdUser = {
      id,
      account: smartWalletAddress,
      pubKey: {
        x: pubKey.x,
        y: pubKey.y,
      },
    };

    console.log("🏭 saveUser() completed successfully, returning:", createdUser);
    return createdUser;
  } catch (error) {
    console.error("🏭 Error in saveUser():", error);
    if (error instanceof Error) {
      console.error("🏭 Error name:", error.name);
      console.error("🏭 Error message:", error.message);
      console.error("🏭 Error stack:", error.stack);
    }
    throw error;
  }
}
