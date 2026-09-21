import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LayarDetailPelanggan from "../layar/LayarDetailPelanggan";
import LayarPelanggan from "../layar/LayarPelanggan";
import LayarTambahPelanggan from "../layar/LayarTambahPelanggan";

export type DaftarRutePelanggan = {
  DaftarPelanggan: undefined;
  TambahPelanggan: undefined;

  DetailPelanggan: {
    idPelanggan: number;
  };
};

const TumpukanPelanggan = createNativeStackNavigator<DaftarRutePelanggan>();

export default function NavigasiPelanggan() {
  return (
    <TumpukanPelanggan.Navigator
      initialRouteName="DaftarPelanggan"
      screenOptions={{
        headerShown: false,
      }}
    >
      <TumpukanPelanggan.Screen
        name="DaftarPelanggan"
        component={LayarPelanggan}
      />

      <TumpukanPelanggan.Screen
        name="TambahPelanggan"
        component={LayarTambahPelanggan}
      />

      <TumpukanPelanggan.Screen
        name="DetailPelanggan"
        component={LayarDetailPelanggan}
      />
    </TumpukanPelanggan.Navigator>
  );
}
