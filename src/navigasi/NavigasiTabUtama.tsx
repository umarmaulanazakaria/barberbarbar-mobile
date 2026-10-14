import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LayarBeranda from "../layar/LayarBeranda";
import LayarProfil from "../layar/LayarProfil";
import NavigasiPesanan, { type DaftarRutePesanan } from "./NavigasiPesanan";
import NavigasiPelanggan from "./NavigasiPelanggan";
import NavigasiBooking,{type DaftarRuteBooking} from "./NavigasiBooking";

export type DaftarRuteTabUtama = {
  Beranda: undefined;
  Pesanan: NavigatorScreenParams<DaftarRutePesanan>;
  Pelanggan: undefined;
  Profile: undefined;
  Booking: NavigatorScreenParams<DaftarRuteBooking> | undefined;
};

type NamaTab = keyof DaftarRuteTabUtama;
type NamaIkon = ComponentProps<typeof Ionicons>["name"];

const Tab = createBottomTabNavigator<DaftarRuteTabUtama>();

const ikonTab: Record<
  NamaTab,
  {
    aktif: NamaIkon;
    nonaktif: NamaIkon;
  }
> = {
  Booking: { aktif: "calendar", nonaktif: "calendar-outline" },
  Beranda: {
    aktif: "home",
    nonaktif: "home-outline",
  },

  Pesanan: {
    aktif: "receipt",
    nonaktif: "receipt-outline",
  },

  Pelanggan: {
    aktif: "people",
    nonaktif: "people-outline",
  },

  Profile: {
    aktif: "person-circle",
    nonaktif: "person-circle-outline",
  },
};

export default function NavigasiTabUtama() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const ikon = ikonTab[route.name];

        return {
          headerShown: false,

          tabBarActiveTintColor: "#818cf8",
          tabBarInactiveTintColor: "#64748b",

          tabBarStyle: {
            backgroundColor: "#1e293b",
            borderTopColor: "#334155",
            borderTopWidth: 1,
            height: 72,
            paddingTop: 8,
            paddingBottom: 8,
          },

          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },

          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? ikon.aktif : ikon.nonaktif}
              size={24}
              color={color}
            />
          ),
        };
      }}
    >
      <Tab.Screen name="Beranda" component={LayarBeranda} />
      <Tab.Screen name="Booking" component={NavigasiBooking} />

      <Tab.Screen
        name="Pesanan"
        component={NavigasiPesanan}
        options={{
          tabBarLabel: "Order",
        }}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();

            navigation.navigate("Pesanan", {
              screen: "DaftarPesanan",
              params: {
                mode: "history",
              },
            });
          },
        })}
      />

      <Tab.Screen name="Pelanggan" component={NavigasiPelanggan} />

      <Tab.Screen name="Profile" component={LayarProfil} />
    </Tab.Navigator>
  );
}
