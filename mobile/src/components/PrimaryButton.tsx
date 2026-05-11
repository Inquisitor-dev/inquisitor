import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { spacing } from "@/theme/spacing";
import { inquisitorColors } from "@/theme/inquisitor";

type PrimaryButtonProps = PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "ghost";
}>;

export function PrimaryButton({
  children,
  onPress,
  disabled = false,
  tone = "primary",
}: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "secondary" && styles.buttonSecondary,
        tone === "ghost" && styles.buttonGhost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === "secondary" && styles.labelSecondary,
          tone === "ghost" && styles.labelGhost,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    borderRadius: 4,
    backgroundColor: inquisitorColors.primary,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: inquisitorColors.primary,
    marginBottom: spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderColor: "rgba(138, 3, 3, 0.3)",
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderColor: "rgba(232, 220, 196, 0.2)",
  },
  label: {
    color: inquisitorColors.parchment,
    fontFamily: "serif",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  labelSecondary: {
    color: inquisitorColors.muted,
  },
  labelGhost: {
    color: inquisitorColors.parchment,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
