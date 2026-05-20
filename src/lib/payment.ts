import { useWriteContract, useSendTransaction } from "wagmi";
import { ERC20_ABI } from "./erc20-abi";
import { isNativeKite } from "./payment-link";

export function usePayment() {
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  async function pay(token: string, to: string, amountRaw: bigint): Promise<`0x${string}`> {
    if (isNativeKite(token)) {
      return sendTransactionAsync({
        to: to as `0x${string}`,
        value: amountRaw,
      });
    }
    return writeContractAsync({
      address: token as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [to as `0x${string}`, amountRaw],
    });
  }

  return { pay };
}
