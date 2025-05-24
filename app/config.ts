import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";

export const client = createPublicClient({
  chain: bscTestnet,
  transport: http("https://bnb-testnet.g.alchemy.com/v2/GhSvVJczQfn65c6EOrome"),
});

// const block = await client.getBlock({
//   blockNumber: 123456n,
// });

// console.log(block);