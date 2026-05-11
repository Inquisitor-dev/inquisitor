import type { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.frame}>
        <View pointerEvents="none" style={styles.glowTop} />
        <View pointerEvents="none" style={styles.glowMiddle} />
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  frame: {
    flex: 1,
  },
  glowTop: {
    position: "absolute",
    top: -110,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(210,171,103,0.12)",
  },
  glowMiddle: {
    position: "absolute",
    top: 200,
    left: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(165,67,51,0.10)",
  },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
