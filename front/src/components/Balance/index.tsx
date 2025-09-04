"use client";

import { useBalance } from "@/providers/BalanceProvider";
import { Flex, Text, Callout } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { CSSProperties } from "react";

const css: CSSProperties = {
  padding: "4rem 0",
};

export default function Balance() {
  const { balance, error } = useBalance();
  
  if (error) {
    return (
      <Flex style={css} direction="column" justify="center" align="center" gap="3">
        <Callout.Root color="red" role="alert">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>Balance Error: {error}</Callout.Text>
        </Callout.Root>
      </Flex>
    );
  }
  
  let [intBalance, decimals] = balance.toString().split(".");

  return (
    <Flex style={css} direction="row" justify="center">
      <Text highContrast={true} weight="bold" size="9">
        ${intBalance}
      </Text>
      <Text highContrast={true} weight="bold" size="6" style={{ color: "var(--accent-12)" }}>
        .{(decimals || "00").slice(0, 2)}
      </Text>
    </Flex>
  );
}
