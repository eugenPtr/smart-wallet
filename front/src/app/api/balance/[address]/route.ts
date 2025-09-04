import { Hex, stringify } from "viem";
import { PUBLIC_CLIENT } from "@/constants/client";

export async function GET(_req: Request, { params }: { params: { address: Hex } }) {
  const { address } = params;
  if (!address) {
    return Response.json(JSON.parse(stringify({ error: "address is required" })));
  }
  
  try {

    const balance = await PUBLIC_CLIENT.getBalance({ address });
    return Response.json(JSON.parse(stringify({ balance })));
  } catch (error) {
    console.error('Error fetching balance from RPC:', error);
    return Response.json(
      JSON.parse(stringify({ error: "Failed to fetch balance" })),
      { status: 500 }
    );
  }
}
