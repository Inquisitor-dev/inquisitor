import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function Panel({ children }: PropsWithChildren) {
  return <View style={styles.panel}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
