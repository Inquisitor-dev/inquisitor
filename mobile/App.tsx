import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

type RootStackParamList = {
  Diagnostic: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function DiagnosticScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Inquisitor</Text>
      <Text style={styles.body}>Navigation diagnostic screen is running.</Text>
      <Text style={styles.body}>If you can see this, the crash is inside our real screens/components.</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            component={DiagnosticScreen}
            name="Diagnostic"
            options={{ title: "Diagnostic" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
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
