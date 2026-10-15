import { useCallback, useMemo, useState } from "react";

import { useFocusEffect, useNavigation } from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";

import { ambilSemuaPelanggan } from "../layanan/pelanggan";

import type { Pelanggan } from "../tipe/pelanggan";

import type { DaftarRutePelanggan } from "../navigasi/NavigasiPelanggan";

type NavigasiDaftarPelanggan = NativeStackNavigationProp<
  DaftarRutePelanggan,
  "DaftarPelanggan"
>;

export default function LayarPelanggan() {
  const navigasi = useNavigation<NavigasiDaftarPelanggan>();

  const [daftarPelanggan, aturDaftarPelanggan] = useState<Pelanggan[]>([]);

  const [kataPencarian, aturKataPencarian] = useState("");

  const [sedangMemuat, aturSedangMemuat] = useState(true);

  const [sedangRefresh, aturSedangRefresh] = useState(false);

  const [pesanKesalahan, aturPesanKesalahan] = useState("");

  const muatPelanggan = useCallback(async () => {
    try {
      aturPesanKesalahan("");

      const data = await ambilSemuaPelanggan();

      aturDaftarPelanggan(data);
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangMemuat(false);

      aturSedangRefresh(false);
    }
  }, []);

  usePenyegaranRealtime(["pelanggan","membership"],muatPelanggan);
  useFocusEffect(
    useCallback(() => {
      void muatPelanggan();
    }, [muatPelanggan]),
  );

  const tanganiRefresh = () => {
    aturSedangRefresh(true);

    void muatPelanggan();
  };

  const tanganiCobaLagi = () => {
    aturSedangMemuat(true);

    void muatPelanggan();
  };

  const pelangganTersaring = useMemo(() => {
    const pencarian = kataPencarian.trim().toLowerCase();

    if (!pencarian) {
      return daftarPelanggan;
    }

    return daftarPelanggan.filter((pelanggan) => {
      return (
        pelanggan.nama.toLowerCase().includes(pencarian) ||
        pelanggan.nomorTelepon.toLowerCase().includes(pencarian) ||
        (pelanggan.alamat ?? "").toLowerCase().includes(pencarian)
      );
    });
  }, [daftarPelanggan, kataPencarian]);

  const tanganiTambahPelanggan = () => {
    navigasi.navigate("TambahPelanggan");
  };

  const tanganiDetailPelanggan = (pelanggan: Pelanggan) => {
    navigasi.navigate("DetailPelanggan", {
      idPelanggan: pelanggan.id,
    });
  };

  const renderPelanggan = ({ item }: { item: Pelanggan }) => {
    const adalahMember = item.membership?.isActive === true;

    return (
      <Pressable
        onPress={() => tanganiDetailPelanggan(item)}
        style={({ pressed }) => [
          gaya.kartuPelanggan,

          pressed && gaya.kartuDitekan,
        ]}
      >
        <View style={gaya.barisUtama}>
          <View style={gaya.informasiUtama}>
            <Text style={gaya.namaPelanggan} numberOfLines={1}>
              {item.nama}
            </Text>

            <View style={gaya.barisDetail}>
              <Text style={gaya.nomorTelepon} numberOfLines={1}>
                {item.nomorTelepon}
              </Text>

              {item.alamat ? (
                <>
                  <Text style={gaya.pemisahDetail}>•</Text>

                  <Text style={gaya.alamat} numberOfLines={1}>
                    {item.alamat}
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          <View
            style={[
              gaya.badgeStatus,

              item.status === "AKTIF" ? gaya.badgeAktif : gaya.badgeDiblokir,
            ]}
          >
            <Text style={gaya.teksBadge}>{item.status}</Text>
          </View>
        </View>

        <View style={gaya.barisBawah}>
          <View
            style={[
              gaya.badgeMember,

              adalahMember ? gaya.memberAktif : gaya.memberReguler,
            ]}
          >
            <Text style={gaya.teksMember}>
              {adalahMember
                ? `Member ${item.membership?.discountPercent}%`
                : "Reguler"}
            </Text>
          </View>

          {adalahMember ? (
            <Text style={gaya.kodeMember}>{item.membership?.memberCode}</Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  if (sedangMemuat && daftarPelanggan.length === 0 && !pesanKesalahan) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.loading}>
          <ActivityIndicator size="large" color="#818cf8" />

          <Text style={gaya.teksLoading}>Memuat pelanggan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (pesanKesalahan && daftarPelanggan.length === 0) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.errorHalaman}>
          <Text style={gaya.judulError}>Pelanggan belum dapat dimuat</Text>

          <Text style={gaya.deskripsiError}>{pesanKesalahan}</Text>

          <Pressable
            onPress={tanganiCobaLagi}
            style={({ pressed }) => [
              gaya.tombolCobaLagi,

              pressed && gaya.kartuDitekan,
            ]}
          >
            <Text style={gaya.teksCobaLagi}>Coba Lagi</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={gaya.areaAman}>
      <FlatList
        data={pelangganTersaring}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPelanggan}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={gaya.kontenDaftar}
        refreshControl={
          <RefreshControl
            refreshing={sedangRefresh}
            onRefresh={tanganiRefresh}
            tintColor="#818cf8"
          />
        }
        ItemSeparatorComponent={() => <View style={gaya.jarak} />}
        ListHeaderComponent={
          <View>
            <View style={gaya.kepala}>
              <View style={gaya.informasiKepala}>
                <Text style={gaya.judul}>Pelanggan</Text>

                <Text style={gaya.deskripsi}>
                  Cari dan kelola pelanggan BARBER BARBAR.
                </Text>
              </View>

              <Pressable
                onPress={tanganiTambahPelanggan}
                style={({ pressed }) => [
                  gaya.tombolTambah,

                  pressed && gaya.kartuDitekan,
                ]}
              >
                <Text style={gaya.simbolTambah}>+</Text>

                <Text style={gaya.teksTambah}>Tambah</Text>
              </Pressable>
            </View>

            {pesanKesalahan && daftarPelanggan.length > 0 ? (
              <View style={gaya.kartuPeringatan}>
                <Text style={gaya.teksPeringatan}>
                  Data terbaru belum dapat dimuat.
                </Text>

                <Text style={gaya.detailPeringatan}>{pesanKesalahan}</Text>
              </View>
            ) : null}

            <TextInput
              value={kataPencarian}
              onChangeText={aturKataPencarian}
              placeholder="Cari nama, nomor telepon, atau alamat"
              placeholderTextColor="#64748b"
              style={gaya.inputCari}
            />

            <Text style={gaya.judulBagian}>Daftar Pelanggan</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={gaya.dataKosong}>
            <Text style={gaya.judulDataKosong}>
              {kataPencarian
                ? "Pelanggan tidak ditemukan"
                : "Belum ada pelanggan"}
            </Text>

            <Text style={gaya.deskripsiDataKosong}>
              {kataPencarian
                ? "Coba gunakan kata pencarian lain."
                : "Tambahkan pelanggan pertama untuk mulai membuat pesanan."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const gaya = StyleSheet.create({
  areaAman: {
    flex: 1,
    backgroundColor: "#0f172a",
  },

  kontenDaftar: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 32,
  },

  kepala: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  informasiKepala: {
    flex: 1,
    marginRight: 12,
  },

  judul: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },

  deskripsi: {
    marginTop: 5,
    fontSize: 14,
    color: "#94a3b8",
  },

  tombolTambah: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
  },

  simbolTambah: {
    marginRight: 6,
    fontSize: 22,
    fontWeight: "300",
    color: "#ffffff",
  },

  teksTambah: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },

  inputCari: {
    height: 50,
    paddingHorizontal: 15,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    fontSize: 14,
    color: "#ffffff",
    backgroundColor: "#1e293b",
  },

  judulBagian: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  /*
   * CARD DIBUAT LEBIH COMPACT
   */
  kartuPelanggan: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },

  kartuDitekan: {
    opacity: 0.8,
  },

  barisUtama: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  informasiUtama: {
    flex: 1,
    marginRight: 12,
  },

  namaPelanggan: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  /*
   * NOMOR TELEPON + ALAMAT SEKARANG SATU BARIS
   */
  barisDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    overflow: "hidden",
  },

  nomorTelepon: {
    fontSize: 12,
    color: "#94a3b8",
  },

  pemisahDetail: {
    marginHorizontal: 7,
    fontSize: 11,
    color: "#475569",
  },

  alamat: {
    flex: 1,
    fontSize: 12,
    color: "#94a3b8",
  },

  badgeStatus: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  badgeAktif: {
    backgroundColor: "#064e3b",
  },

  badgeDiblokir: {
    backgroundColor: "#7f1d1d",
  },

  teksBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },

  /*
   * MEMBERSHIP LEBIH DEKAT KE INFORMASI ATAS
   */
  barisBawah: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  badgeMember: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  memberAktif: {
    backgroundColor: "#312e81",
  },

  memberReguler: {
    backgroundColor: "#334155",
  },

  teksMember: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },

  kodeMember: {
    fontSize: 10,
    fontWeight: "600",
    color: "#818cf8",
  },

  /*
   * JARAK ANTAR CARD DIPERKECIL
   */
  jarak: {
    height: 8,
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

  teksCobaLagi: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },

  dataKosong: {
    alignItems: "center",
    paddingVertical: 60,
  },

  judulDataKosong: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  deskripsiDataKosong: {
    marginTop: 7,
    paddingHorizontal: 20,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#64748b",
  },
});
