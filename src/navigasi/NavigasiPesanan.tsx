import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LayarBuatPesanan from "../layar/LayarBuatPesanan";
import LayarDetailPesanan from "../layar/LayarDetailPesanan";
import LayarPayment from "../layar/LayarPayment";
import LayarPesanan from "../layar/LayarPesanan";
import LayarDetailBooking from "../layar/LayarDetailBooking";

export type DaftarRutePesanan = {
  DetailBooking: { idBooking: number };
  DaftarPesanan:
    | {
        mode?: "history" | "aktif" | "hariIni";
      }
    | undefined;

  BuatPesanan: undefined;

  DetailPesanan: {
    idPesanan: number;
  };

  PaymentPesanan: {
    idPesanan: number;
  };
};

const TumpukanPesanan = createNativeStackNavigator<DaftarRutePesanan>();

export default function NavigasiPesanan() {
  return (
    <TumpukanPesanan.Navigator
      initialRouteName="DaftarPesanan"
      screenOptions={{
        headerShown: false,
      }}
    >
      <TumpukanPesanan.Screen name="DaftarPesanan" component={LayarPesanan} />
      <TumpukanPesanan.Screen name="DetailBooking" component={LayarDetailBooking} />

      <TumpukanPesanan.Screen name="BuatPesanan" component={LayarBuatPesanan} />

      <TumpukanPesanan.Screen
        name="DetailPesanan"
        component={LayarDetailPesanan}
      />

      <TumpukanPesanan.Screen name="PaymentPesanan" component={LayarPayment} />
    </TumpukanPesanan.Navigator>
  );
}
