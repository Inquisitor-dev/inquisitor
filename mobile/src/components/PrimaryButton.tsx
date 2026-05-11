import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

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
    borderRadius: 16,
    backgroundColor: colors.accentStrong,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentStrong,
    marginBottom: spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.border,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderColor: colors.accentSoft,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  labelSecondary: {
    color: colors.text,
  },
  labelGhost: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
