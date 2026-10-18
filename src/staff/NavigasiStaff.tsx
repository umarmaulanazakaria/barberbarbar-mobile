import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator, type BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, type NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ComponentType } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BerandaStaff, DaftarPesananStaff, ProfilStaff, RiwayatStaff } from "./LayarDaftarStaff";
import LayarWalkinStaff from "./LayarWalkinStaff";
import LayarDetailStaff from "./LayarDetailStaff";
import LayarBayarStaff from "./LayarBayarStaff";
import LayarStrukStaff from "./LayarStrukStaff";
import PelangganOperasionalStaff from "./PelangganOperasionalStaff";
import CekMemberStaff from "./MemberStaff";
import { DetailArsipOperasionalStaff } from "./RiwayatOperasionalStaff";
import { warnaStaff } from "./UiStaff";
import type { JenisStaff } from "./layananStaff";
type TabStaff = { Beranda: undefined; Pesanan: undefined; "Walk-in": undefined; Riwayat: undefined; Profil: undefined };
export type RuteStaff = { UtamaStaff: undefined; DetailStaff: { jenis: JenisStaff; id: number }; ArsipStaff: { jenis: JenisStaff; id: number }; PelangganStaff: undefined; CekMember: undefined; BayarStaff: { jenis: JenisStaff; id: number; pesananId: number }; StrukStaff: { jenis: JenisStaff; id: number } };
const Tab = createBottomTabNavigator<TabStaff>(), Stack = createNativeStackNavigator<RuteStaff>();
const ikon: Record<keyof TabStaff, React.ComponentProps<typeof Ionicons>["name"]> = { Beranda: "home-outline", Pesanan: "list-outline", "Walk-in": "add-circle-outline", Riwayat: "time-outline", Profil: "person-outline" };
function TabsStaff() {
  const insets = useSafeAreaInsets();
  return <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: warnaStaff.ungu, tabBarInactiveTintColor: "#9aa2b4", tabBarStyle: { backgroundColor: "white", borderTopColor: warnaStaff.garis, height: 60 + Math.max(8, insets.bottom), paddingTop: 8, paddingBottom: Math.max(8, insets.bottom) }, tabBarLabelStyle: { fontSize: 10, fontWeight: "600" }, tabBarIcon: ({ color }) => <Ionicons name={ikon[route.name]} color={color} size={21}/> })}>
    <Tab.Screen name="Beranda" component={TumpukanBeranda}/><Tab.Screen name="Pesanan" component={TumpukanPesanan}/><Tab.Screen name="Walk-in" component={TumpukanWalkin}/><Tab.Screen name="Riwayat" component={TumpukanRiwayat}/><Tab.Screen name="Profil" component={TumpukanProfil}/>
  </Tab.Navigator>;
}
function TumpukanStaff({ utama }: { utama: ComponentType }) { return <Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="UtamaStaff" component={utama}/><Stack.Screen name="DetailStaff" component={LayarDetailStaff}/><Stack.Screen name="ArsipStaff" component={DetailArsipOperasionalStaff}/><Stack.Screen name="PelangganStaff" component={PelangganOperasionalStaff}/><Stack.Screen name="CekMember" component={CekMemberStaff}/><Stack.Screen name="BayarStaff" component={LayarBayarStaff}/><Stack.Screen name="StrukStaff" component={LayarStrukStaff}/></Stack.Navigator>; }

function TumpukanBeranda() { return <TumpukanStaff utama={BerandaStaff}/>; }
function TumpukanPesanan() { return <TumpukanStaff utama={DaftarPesananStaff}/>; }
function TumpukanWalkin() { return <TumpukanStaff utama={LayarWalkinStaff}/>; }
function TumpukanRiwayat() { return <TumpukanStaff utama={RiwayatStaff}/>; }
function TumpukanProfil() { return <TumpukanStaff utama={ProfilStaff}/>; }
export function bukaTabStaff(nav: NativeStackNavigationProp<RuteStaff>, tab: keyof TabStaff) { nav.getParent<BottomTabNavigationProp<TabStaff>>()?.navigate(tab); }
export default function NavigasiStaff() { return <TabsStaff/>; }
