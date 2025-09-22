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
  
  // Show loading state while balance is being fetched
  if (balance === null) {
    return (
      <Flex style={css} direction="row" justify="center" align="center" gap="1">
        <Text highContrast={true} weight="bold" size="9">
          --
        </Text>
        <Text highContrast={true} weight="bold" size="6" style={{ color: "var(--accent-12)" }}>
          .-- ETH
        </Text>
      </Flex>
    );
  }
  
  const [integerPart, decimalPart = "0000"] = balance.split(".");

  return (
    <Flex style={css} direction="row" justify="center" align="center" gap="1">
      <Text highContrast={true} weight="bold" size="9">
        {integerPart}
      </Text>
      <Text highContrast={true} weight="bold" size="6" style={{ color: "var(--accent-12)" }}>
        .{decimalPart.slice(0, 4)} ETH
      </Text>
    </Flex>
  );
}
