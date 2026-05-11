import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type PrimaryButtonProps = PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
}>;

export function PrimaryButton({
  children,
  onPress,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.accentStrong,
    paddingHorizontal: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
