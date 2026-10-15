import { statusRamah } from '../layanan/teks';
import { useCallback, useState } from "react";

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import type { RouteProp } from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import TombolKembali from "../komponen/TombolKembali";

import ModalAksi from "../komponen/ModalAksi";

import type { KonfigurasiModalAksi } from "../komponen/ModalAksi";

import { ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";
import { ambilStatusMembership } from "../layanan/pelanggan";

import {
  ambilPelangganBerdasarkanId,
  buatMembership,
} from "../layanan/pelanggan";

import type { Pelanggan } from "../tipe/pelanggan";

import type { DaftarRutePelanggan } from "../navigasi/NavigasiPelanggan";

type RuteDetailPelanggan = RouteProp<DaftarRutePelanggan, "DetailPelanggan">;

type NavigasiDetailPelanggan = NativeStackNavigationProp<
  DaftarRutePelanggan,
  "DetailPelanggan"
>;

const formatTanggal = (nilai: string) => {
  return new Date(nilai).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function LayarDetailPelanggan() {
  const navigasi = useNavigation<NavigasiDetailPelanggan>();

  const rute = useRoute<RuteDetailPelanggan>();

  const { idPelanggan } = rute.params;

  const [pelanggan, aturPelanggan] = useState<Pelanggan | null>(null);
  const [statusMember,aturStatusMember]=useState("");

  const [sedangMemuat, aturSedangMemuat] = useState(true);

  const [sedangMembuatMember, aturSedangMembuatMember] = useState(false);

  const [pesanKesalahan, aturPesanKesalahan] = useState("");

  const [konfigurasiModal, aturKonfigurasiModal] =
    useState<KonfigurasiModalAksi | null>(null);

  const muatPelanggan = useCallback(async () => {
    try {
      aturPesanKesalahan("");

      const [data,status]=await Promise.all([ambilPelangganBerdasarkanId(idPelanggan),ambilStatusMembership(idPelanggan)]);
      aturStatusMember(status.status);

      aturPelanggan(data);
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangMemuat(false);
    }
  }, [idPelanggan]);

  usePenyegaranRealtime(["pelanggan","membership"],muatPelanggan);
  useFocusEffect(
    useCallback(() => {
      aturSedangMemuat(true);

      void muatPelanggan();
    }, [muatPelanggan]),
  );

  const prosesBuatMembership = async () => {
    if (
      !pelanggan ||
      pelanggan.membership ||
      pelanggan.status === "DIBLOKIR" ||
      sedangMembuatMember
    ) {
      return;
    }

    try {
      aturSedangMembuatMember(true);

      aturPesanKesalahan("");

      await buatMembership(pelanggan.id);

      await muatPelanggan();

      aturKonfigurasiModal({
        judul: "Membership Berhasil",
        pesan: `${pelanggan.nama} sekarang terdaftar sebagai Member.`,
        teksTombolUtama: "OK",
        saatTombolUtama: () => {},
      });
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangMembuatMember(false);
    }
  };

  const tanganiBuatMembership = () => {
    if (!pelanggan) {
      return;
    }

    aturKonfigurasiModal({
      judul: "Daftarkan Membership",
      pesan: `Daftarkan ${pelanggan.nama} sebagai Member BARBER BARBAR?`,
      teksTombolUtama: "Daftarkan",
      saatTombolUtama: () => {
        void prosesBuatMembership();
      },
      teksTombolKedua: "Batal",
    });
  };

  if (sedangMemuat) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.loading}>
          <ActivityIndicator size="large" color="#818cf8" />

          <Text style={gaya.teksLoading}>Memuat pelanggan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pelanggan) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.errorHalaman}>
          <Text style={gaya.judulError}>Pelanggan tidak ditemukan</Text>

          <Text style={gaya.deskripsiError}>
            {pesanKesalahan || "Data pelanggan tidak tersedia."}
          </Text>

          <Pressable
            onPress={() => navigasi.goBack()}
            style={({ pressed }) => [
              gaya.tombolKembaliError,

              pressed && gaya.tombolDitekan,
            ]}
          >
            <Text style={gaya.teksTombol}>Kembali</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const adalahMember = pelanggan.membership !== null;

  const diblokir = pelanggan.status === "DIBLOKIR";

  return (
    <SafeAreaView style={gaya.areaAman}>
      <ScrollView
        contentContainerStyle={gaya.konten}
        showsVerticalScrollIndicator={false}
      >
        <TombolKembali onPress={() => navigasi.goBack()} />

        <View style={gaya.kepala}>
          <Text style={gaya.judul}>Detail Pelanggan</Text>

          <Text style={gaya.deskripsi}>Informasi pelanggan BARBER BARBAR.</Text>
        </View>

        {pesanKesalahan ? (
          <View style={gaya.kartuKesalahan}>
            <Text style={gaya.teksKesalahan}>{pesanKesalahan}</Text>
          </View>
        ) : null}

        <View style={gaya.kartuProfil}>
          <View style={gaya.avatar}>
            <Text style={gaya.inisial}>
              {pelanggan.nama.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={gaya.namaPelanggan}>{pelanggan.nama}</Text>

          <Text style={gaya.nomorTelepon}>{pelanggan.nomorTelepon}</Text>

          <View style={gaya.areaBadge}>
            <View
              style={[
                gaya.badge,

                diblokir ? gaya.badgeDiblokir : gaya.badgeAktif,
              ]}
            >
              <Text style={gaya.teksBadge}>{statusRamah(pelanggan.status)}</Text>
            </View>

            <View
              style={[
                gaya.badge,

                adalahMember ? gaya.badgeMember : gaya.badgeReguler,
              ]}
            >
              <Text style={gaya.teksBadge}>
                {adalahMember ? "MEMBER" : "REGULER"}
              </Text>
            </View>
          </View>
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Informasi Pelanggan</Text>

          <View style={gaya.kartuInformasi}>
            <View style={gaya.barisInformasi}>
              <Text style={gaya.labelInformasi}>Nama</Text>

              <Text style={gaya.nilaiInformasi}>{pelanggan.nama}</Text>
            </View>

            <View style={gaya.pemisah} />

            <View style={gaya.barisInformasi}>
              <Text style={gaya.labelInformasi}>Nomor Telepon</Text>

              <Text style={gaya.nilaiInformasi}>{pelanggan.nomorTelepon}</Text>
            </View>

            <View style={gaya.pemisah} />

            <View style={gaya.barisInformasi}>
              <Text style={gaya.labelInformasi}>Alamat</Text>

              <Text style={gaya.nilaiInformasi}>{pelanggan.alamat || "-"}</Text>
            </View>

            <View style={gaya.pemisah} />

            <View style={gaya.barisInformasi}>
              <Text style={gaya.labelInformasi}>Terdaftar</Text>

              <Text style={gaya.nilaiInformasi}>
                {formatTanggal(pelanggan.dibuatPada)}
              </Text>
            </View>
          </View>
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Membership</Text>

          <Text style={gaya.nilaiMembership}>Status membership: {statusMember}</Text>
          {adalahMember && pelanggan.membership ? (
            <View style={gaya.kartuMembership}>
              <View style={gaya.kepalaMembership}>
                <View>
                  <Text style={gaya.labelMember}>Member Code</Text>

                  <Text style={gaya.kodeMember}>
                    {pelanggan.membership.memberCode}
                  </Text>
                </View>

                <View
                  style={[
                    gaya.badgeStatusMember,

                    pelanggan.membership.isActive
                      ? gaya.memberAktif
                      : gaya.memberTidakAktif,
                  ]}
                >
                  <Text style={gaya.teksStatusMember}>
                    {pelanggan.membership.isActive ? "Aktif" : "Tidak Aktif"}
                  </Text>
                </View>
              </View>

              <View style={gaya.pemisahMember} />

              <View style={gaya.barisMembership}>
                <Text style={gaya.labelMembership}>Discount</Text>

                <Text style={gaya.nilaiDiscount}>
                  {pelanggan.membership.discountPercent}%
                </Text>
              </View>

              <View style={gaya.barisMembership}>
                <Text style={gaya.labelMembership}>Bergabung</Text>

                <Text style={gaya.nilaiMembership}>
                  {formatTanggal(pelanggan.membership.joinedAt)}
                </Text>
              </View>
            </View>
          ) : diblokir ? (
            <View style={gaya.kartuDiblokir}>
              <Text style={gaya.judulDiblokir}>Pelanggan Diblokir</Text>

              <Text style={gaya.deskripsiDiblokir}>
                Membership tidak dapat dibuat untuk pelanggan yang sedang
                diblokir.
              </Text>
            </View>
          ) : (
            <View style={gaya.kartuBelumMember}>
              <Text style={gaya.judulBelumMember}>Belum menjadi Member</Text>

              <Text style={gaya.deskripsiBelumMember}>
                Daftarkan pelanggan untuk mendapatkan benefit Membership.
              </Text>

              <Pressable
                onPress={tanganiBuatMembership}
                disabled={sedangMembuatMember}
                style={({ pressed }) => [
                  gaya.tombolMember,

                  sedangMembuatMember && gaya.tombolTidakAktif,

                  pressed && !sedangMembuatMember && gaya.tombolDitekan,
                ]}
              >
                <Text style={gaya.teksTombol}>
                  {sedangMembuatMember
                    ? "Mendaftarkan..."
                    : "Daftarkan Membership"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <ModalAksi
        konfigurasi={konfigurasiModal}
        onTutup={() => aturKonfigurasiModal(null)}
      />
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
    marginBottom: 24,
  },

  judul: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },

  deskripsi: {
    marginTop: 6,
    fontSize: 14,
    color: "#94a3b8",
  },

  kartuProfil: {
    alignItems: "center",
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 18,
    backgroundColor: "#1e293b",
  },

  avatar: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: "#4f46e5",
  },

  inisial: {
    fontSize: 29,
    fontWeight: "800",
    color: "#ffffff",
  },

  namaPelanggan: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },

  nomorTelepon: {
    marginTop: 5,
    fontSize: 13,
    color: "#94a3b8",
  },

  areaBadge: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgeAktif: {
    backgroundColor: "#064e3b",
  },

  badgeDiblokir: {
    backgroundColor: "#7f1d1d",
  },

  badgeMember: {
    backgroundColor: "#312e81",
  },

  badgeReguler: {
    backgroundColor: "#334155",
  },

  teksBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },

  bagian: {
    marginTop: 28,
  },

  judulBagian: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  kartuInformasi: {
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    backgroundColor: "#1e293b",
  },

  barisInformasi: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 16,
  },

  labelInformasi: {
    fontSize: 13,
    color: "#94a3b8",
  },

  nilaiInformasi: {
    maxWidth: "65%",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    color: "#ffffff",
  },

  pemisah: {
    height: 1,
    backgroundColor: "#334155",
  },

  kartuMembership: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#4338ca",
    borderRadius: 16,
    backgroundColor: "#1e1b4b",
  },

  kepalaMembership: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  labelMember: {
    fontSize: 11,
    color: "#a5b4fc",
  },

  kodeMember: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },

  badgeStatusMember: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  memberAktif: {
    backgroundColor: "#065f46",
  },

  memberTidakAktif: {
    backgroundColor: "#475569",
  },

  teksStatusMember: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },

  pemisahMember: {
    height: 1,
    marginVertical: 16,
    backgroundColor: "#3730a3",
  },

  barisMembership: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  labelMembership: {
    fontSize: 13,
    color: "#a5b4fc",
  },

  nilaiMembership: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },

  nilaiDiscount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#818cf8",
  },

  kartuBelumMember: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    backgroundColor: "#1e293b",
  },

  judulBelumMember: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  deskripsiBelumMember: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#94a3b8",
  },

  tombolMember: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
  },

  tombolTidakAktif: {
    opacity: 0.45,
  },

  tombolDitekan: {
    opacity: 0.8,
  },

  teksTombol: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  kartuDiblokir: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 16,
    backgroundColor: "#450a0a",
  },

  judulDiblokir: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fca5a5",
  },

  deskripsiDiblokir: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#fecaca",
  },

  kartuKesalahan: {
    marginBottom: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 12,
    backgroundColor: "#450a0a",
  },

  teksKesalahan: {
    fontSize: 13,
    color: "#fecaca",
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

  tombolKembaliError: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
  },
});
