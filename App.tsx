import { StatusBar } from "expo-status-bar";

import { SafeAreaProvider } from "react-native-safe-area-context";

import NavigasiUtama from "./src/navigasi/NavigasiUtama";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />

      <NavigasiUtama />
    </SafeAreaProvider>
  );
}
