import { StatusBar } from "expo-status-bar";

import { SafeAreaProvider } from "react-native-safe-area-context";

import NavigasiUtama from "./src/navigasi/NavigasiUtama";
import RealtimeOperator from "./src/komponen/RealtimeOperator";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />

      <NavigasiUtama />
      <RealtimeOperator />
    </SafeAreaProvider>
  );
}
