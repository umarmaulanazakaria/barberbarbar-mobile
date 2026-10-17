import { useEffect } from "react";

import { NavigationContainer } from "@react-navigation/native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ActivityIndicator, StyleSheet, View } from "react-native";

import LayarLogin from "../staff/LayarLoginStaff";

import { useSesiStore } from "../store/useSesiStore";

import NavigasiTabUtama from "./NavigasiTabUtama";

export type DaftarRuteUtama = {
  Login: undefined;
  Aplikasi: undefined;
};

const Tumpukan = createNativeStackNavigator<DaftarRuteUtama>();

export default function NavigasiUtama() {
  const pengguna = useSesiStore((state) => state.pengguna);

  const sudahMemuatSesi = useSesiStore((state) => state.sudahMemuatSesi);

  const muatSesi = useSesiStore((state) => state.muatSesi);

  useEffect(() => {
    muatSesi();
  }, [muatSesi]);

  if (!sudahMemuatSesi) {
    return (
      <View style={gaya.loading}>
        <ActivityIndicator size="large" color="#818cf8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tumpukan.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {pengguna ? (
          <Tumpukan.Screen name="Aplikasi" component={NavigasiTabUtama} />
        ) : (
          <Tumpukan.Screen name="Login" component={LayarLogin} />
        )}
      </Tumpukan.Navigator>
    </NavigationContainer>
  );
}

const gaya = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
});
