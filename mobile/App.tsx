import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Inquisitor</Text>
      <Text style={styles.body}>Diagnostic build is running.</Text>
      <Text style={styles.body}>If you can see this screen, the crash is inside our app UI flow.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0a0f",
    padding: 24,
  },
  title: {
    color: "#f4efe7",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  body: {
    color: "#b7ac9d",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8,
  },
});
