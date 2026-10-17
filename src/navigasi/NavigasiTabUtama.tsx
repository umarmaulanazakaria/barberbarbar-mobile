import type { NavigatorScreenParams } from "@react-navigation/native";
import type { DaftarRutePesanan } from "./NavigasiPesanan";
import type { DaftarRuteBooking } from "./NavigasiBooking";
import NavigasiStaff from "../staff/NavigasiStaff";
// Tipe rute lama dipertahankan untuk source historis yang belum dihapus.
export type DaftarRuteTabUtama = {
  Beranda: undefined;
  Pesanan: NavigatorScreenParams<DaftarRutePesanan>;
  Pelanggan: undefined;
  Profile: undefined;
  Booking: NavigatorScreenParams<DaftarRuteBooking> | undefined;
};
export default function NavigasiTabUtama() { return <NavigasiStaff/>; }
