import { useCallback, useRef, useState } from "react";

import { useFocusEffect, useNavigation } from "@react-navigation/native";

import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ambilPesanKesalahan } from "../layanan/api";

import { ambilDashboard } from "../layanan/dashboard";
import KartuOperasional from "../komponen/KartuOperasional";
import { ambilOperasionalTerpadu, daftarAktif, type EntriOperasional } from "../layanan/operasionalTerpadu";
import { useWaktuOperasional } from "../hooks/useWaktuOperasional";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";

import type { Dashboard } from "../tipe/dashboard";

import type { DaftarRuteTabUtama } from "../navigasi/NavigasiTabUtama";

type NavigasiBeranda = BottomTabNavigationProp<DaftarRuteTabUtama, "Beranda">;

const formatRupiah = (nilai: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
};

export default function LayarBeranda() {
  const navigasi = useNavigation<NavigasiBeranda>();

  const [dashboard, aturDashboard] = useState<Dashboard | null>(null);

  const [sedangMemuat, aturSedangMemuat] = useState(true);

  const [sedangRefresh, aturSedangRefresh] = useState(false);

  const [pesanKesalahan, aturPesanKesalahan] = useState("");

  const [daftar, aturDaftar] = useState<EntriOperasional[]>([]);
  const urutan = useRef(0);

  const muatDashboard = useCallback(async () => {
    const nomor = ++urutan.current;
    try {
      aturPesanKesalahan("");

      const [data, entri] = await Promise.all([ambilDashboard(), ambilOperasionalTerpadu()]);
      if (nomor !== urutan.current) return;
      aturDashboard(data);
      aturDaftar(entri);
    } catch (error) {
      if (nomor === urutan.current) aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      if (nomor === urutan.current) { aturSedangMemuat(false); aturSedangRefresh(false); }
    }
  }, []);

  const sekarang = useWaktuOperasional(muatDashboard);
  usePenyegaranRealtime(["beranda","membership","katalog","booking","pembayaran"],muatDashboard);
  useFocusEffect(
    useCallback(() => {
      void muatDashboard();
      return () => { urutan.current++; };
    }, [muatDashboard]),
  );

  const tanganiRefresh = () => {
    aturSedangRefresh(true);

    void muatDashboard();
  };

  const tanganiCobaLagi = () => {
    aturSedangMemuat(true);

    void muatDashboard();
  };

  const tanganiPesananBaru = () => {
    navigasi.navigate("Pesanan", {
      screen: "BuatPesanan",
    });
  };

  const tanganiBukaPesananHariIni = () => {
    navigasi.navigate("Pesanan", {
      screen: "DaftarPesanan",

      params: {
        mode: "hariIni",
      },
    });
  };

  const tanganiBukaPesananAktif = () => {
    navigasi.navigate("Pesanan", {
      screen: "DaftarPesanan",

      params: {
        mode: "aktif",
      },
    });
  };

  const tanganiDetail = (entri: EntriOperasional) => {
    if (entri.booking) navigasi.navigate("Booking", {screen:"DetailBooking",params:{idBooking:entri.booking.id}});
    else if (entri.pesanan) navigasi.navigate("Pesanan", {screen:"DetailPesanan",params:{idPesanan:entri.pesanan.id}});
  };

  if (sedangMemuat && !dashboard) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.loading}>
          <ActivityIndicator size="large" color="#818cf8" />

          <Text style={gaya.teksLoading}>Memuat dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard && pesanKesalahan) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.errorHalaman}>
          <Text style={gaya.judulError}>Dashboard belum dapat dimuat</Text>

          <Text style={gaya.deskripsiError}>{pesanKesalahan}</Text>

          <Pressable
            onPress={tanganiCobaLagi}
            style={({ pressed }) => [
              gaya.tombolCobaLagi,
              pressed && gaya.tombolDitekan,
            ]}
          >
            <Text style={gaya.teksTombolCobaLagi}>Coba Lagi</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard) {
    return null;
  }

  const pesananAktif = daftarAktif(daftar, sekarang);
  const pesananTerbaruBelumPaid = pesananAktif.slice(0, 7);

  return (
    <SafeAreaView style={gaya.areaAman}>
      <ScrollView
        contentContainerStyle={gaya.konten}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={sedangRefresh}
            onRefresh={tanganiRefresh}
            tintColor="#818cf8"
          />
        }
      >
        <View style={gaya.kepala}>
          <Text style={gaya.sapaan}>Operasional Hari Ini</Text>

          <Text style={gaya.judul}>BARBER BARBAR</Text>

          <Text style={gaya.deskripsi}>
            Pantau aktivitas barbershop dan proses pesanan dalam satu tempat.
          </Text>
        </View>

        {pesanKesalahan ? (
          <View style={gaya.kartuPeringatan}>
            <Text style={gaya.teksPeringatan}>
              Data terbaru belum dapat dimuat.
            </Text>

            <Text style={gaya.detailPeringatan}>{pesanKesalahan}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={tanganiPesananBaru}
          style={({ pressed }) => [
            gaya.tombolPesananBaru,
            pressed && gaya.tombolDitekan,
          ]}
        >
          <View style={gaya.simbolTambah}>
            <Text style={gaya.teksSimbolTambah}>+</Text>
          </View>

          <View style={gaya.isiTombol}>
            <Text style={gaya.judulTombol}>Pesanan Baru</Text>

            <Text style={gaya.deskripsiTombol}>
              Buat pesanan baru untuk pelanggan.
            </Text>
          </View>

          <Text style={gaya.panah}>›</Text>
        </Pressable>

        <View style={gaya.bagian}>
          <View style={gaya.kepalaBagian}>
            <Text style={gaya.judulBagian}>Status Pesanan</Text>

            <Pressable onPress={tanganiBukaPesananHariIni}>
              <Text style={gaya.lihatSemua}>Lihat Semua</Text>
            </Pressable>
          </View>

          <View style={gaya.gridRingkasan}>
            <View style={gaya.kartuRingkasan}>
              <Text style={gaya.nilaiRingkasan}>{dashboard.waiting}</Text>

              <Text style={gaya.labelRingkasan}>Menunggu</Text>
            </View>

            <View style={gaya.kartuRingkasan}>
              <Text style={gaya.nilaiRingkasan}>{dashboard.inService}</Text>

              <Text style={gaya.labelRingkasan}>Dilayani</Text>
            </View>

            <View style={gaya.kartuRingkasan}>
              <Text style={gaya.nilaiRingkasan}>
                {dashboard.completedUnpaid}
              </Text>

              <Text style={gaya.labelRingkasan}>Belum Dibayar</Text>
            </View>

            <View style={gaya.kartuRingkasan}>
              <Text style={gaya.nilaiRingkasan}>{dashboard.paidToday}</Text>

              <Text style={gaya.labelRingkasan}>Pembayaran Hari Ini</Text>
            </View>
          </View>
        </View>

        <View style={gaya.kartuPendapatan}>
          <Text style={gaya.labelPendapatan}>Revenue Hari Ini</Text>

          <Text style={gaya.nilaiPendapatan}>
            {formatRupiah(dashboard.revenueToday)}
          </Text>
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Overview</Text>

          <View style={gaya.gridOverview}>
            <View style={gaya.kartuOverview}>
              <Text style={gaya.nilaiOverview}>{dashboard.pelanggan}</Text>

              <Text style={gaya.labelOverview}>Pelanggan</Text>
            </View>

            <View style={gaya.kartuOverview}>
              <Text style={gaya.nilaiOverview}>{dashboard.barberAktif}</Text>

              <Text style={gaya.labelOverview}>Barber</Text>
            </View>

            <View style={gaya.kartuOverview}>
              <Text style={gaya.nilaiOverview}>{dashboard.layananAktif}</Text>

              <Text style={gaya.labelOverview}>Layanan</Text>
            </View>
          </View>
        </View>

        <View style={gaya.bagian}>
          <View style={gaya.kepalaBagian}>
            <Text style={gaya.judulBagian}>Pesanan Terbaru</Text>

            <Pressable onPress={tanganiBukaPesananAktif}>
              <Text style={gaya.lihatSemua}>Lihat Semua</Text>
            </Pressable>
          </View>

          {pesananTerbaruBelumPaid.length === 0 ? (
            <View style={gaya.dataKosong}>
              <Text style={gaya.judulDataKosong}>
                Belum ada pesanan aktif terbaru
              </Text>

              <Text style={gaya.deskripsiDataKosong}>
                Booking dan walk-in yang membutuhkan tindak lanjut akan tampil di sini.
              </Text>
            </View>
          ) : (
            <View style={gaya.daftarOrder}>
              {pesananTerbaruBelumPaid.map((entri) => (
                <KartuOperasional key={entri.kunci} entri={entri} sekarang={sekarang} buka={() => tanganiDetail(entri)}/>
              ))}
              {pesananAktif.length > 7 && <Text style={gaya.detailOrder}>Menampilkan 7 dari {pesananAktif.length} entri aktif. Buka Lihat Semua untuk seluruh daftar.</Text>}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const gaya = StyleSheet.create({
  areaAman: {
    flex: 1,
    backgroundColor: "#0f172a",
  },

  konten: {
    padding: 20,
    paddingBottom: 40,
  },

  kepala: {
    marginBottom: 28,
  },

  sapaan: {
    fontSize: 14,
    color: "#94a3b8",
  },

  judul: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },

  deskripsi: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
  },

  tombolPesananBaru: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#4f46e5",
  },

  simbolTambah: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },

  teksSimbolTambah: {
    fontSize: 28,
    fontWeight: "300",
    color: "#ffffff",
  },

  isiTombol: {
    flex: 1,
  },

  judulTombol: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  deskripsiTombol: {
    marginTop: 3,
    fontSize: 12,
    color: "#c7d2fe",
  },

  panah: {
    fontSize: 30,
    fontWeight: "300",
    color: "#ffffff",
  },

  tombolDitekan: {
    opacity: 0.8,
  },

  bagian: {
    marginTop: 30,
  },

  kepalaBagian: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  judulBagian: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  lihatSemua: {
    fontSize: 13,
    fontWeight: "600",
    color: "#818cf8",
  },

  gridRingkasan: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  kartuRingkasan: {
    width: "48%",
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },

  nilaiRingkasan: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },

  labelRingkasan: {
    marginTop: 5,
    fontSize: 11,
    color: "#94a3b8",
  },

  kartuPendapatan: {
    marginTop: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#065f46",
    borderRadius: 16,
    backgroundColor: "#052e2b",
  },

  labelPendapatan: {
    fontSize: 12,
    color: "#a7f3d0",
  },

  nilaiPendapatan: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "800",
    color: "#6ee7b7",
  },

  gridOverview: {
    flexDirection: "row",
    gap: 10,
  },

  kartuOverview: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },

  nilaiOverview: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },

  labelOverview: {
    marginTop: 5,
    fontSize: 10,
    color: "#94a3b8",
  },

  daftarOrder: {
    gap: 10,
  },

  kartuOrder: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },

  barisOrderAtas: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  nomorOrder: {
    fontSize: 12,
    fontWeight: "700",
    color: "#818cf8",
  },

  statusOrder: {
    fontSize: 11,
    fontWeight: "700",
    color: "#cbd5e1",
  },

  namaPelanggan: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  detailOrder: {
    marginTop: 5,
    fontSize: 12,
    color: "#94a3b8",
  },

  barisOrderBawah: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  statusPayment: {
    fontSize: 11,
    fontWeight: "700",
  },

  paymentUnpaid: {
    color: "#fbbf24",
  },

  totalOrder: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  dataKosong: {
    alignItems: "center",
    paddingVertical: 35,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },

  judulDataKosong: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  deskripsiDataKosong: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
  },

  kartuPeringatan: {
    marginBottom: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#854d0e",
    borderRadius: 12,
    backgroundColor: "#422006",
  },

  teksPeringatan: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fde68a",
  },

  detailPeringatan: {
    marginTop: 5,
    fontSize: 12,
    color: "#fef3c7",
  },

  errorHalaman: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  judulError: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#ffffff",
  },

  deskripsiError: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#94a3b8",
  },

  tombolCobaLagi: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
  },

  teksTombolCobaLagi: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  teksLoading: {
    marginTop: 14,
    fontSize: 13,
    color: "#94a3b8",
  },
});
