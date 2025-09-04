import { createPublicClient, http } from "viem";
import { sepolia, mainnet } from "viem/chains";

export const CHAIN = {
  ...sepolia,
};

// Alchemy transport for standard Ethereum RPC calls
export const alchemyTransport = http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_ENDPOINT);

// Pimlico bundler transport for ERC-4337 UserOperations
export const pimlicoBundlerTransport = http(
  `https://api.pimlico.io/v2/${CHAIN.id}/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`
);

export const PUBLIC_CLIENT = createPublicClient({
  chain: sepolia,
  transport: alchemyTransport,
});

export const MAINNET_PUBLIC_CLIENT = createPublicClient({
  chain: mainnet,
  transport: http(),
});
