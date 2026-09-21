import { useState } from "react";

import { useNavigation } from "@react-navigation/native";

import TombolKembali from "../komponen/TombolKembali";

import ModalAksi from "../komponen/ModalAksi";

import type { KonfigurasiModalAksi } from "../komponen/ModalAksi";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ambilPesanKesalahan } from "../layanan/api";

import { tambahPelanggan } from "../layanan/pelanggan";

import type { DaftarRutePelanggan } from "../navigasi/NavigasiPelanggan";

type NavigasiTambahPelanggan = NativeStackNavigationProp<
  DaftarRutePelanggan,
  "TambahPelanggan"
>;

export default function LayarTambahPelanggan() {
  const navigasi = useNavigation<NavigasiTambahPelanggan>();

  const [nama, aturNama] = useState("");

  const [nomorTelepon, aturNomorTelepon] = useState("");

  const [alamat, aturAlamat] = useState("");

  const [sedangMenyimpan, aturSedangMenyimpan] = useState(false);

  const [pesanKesalahan, aturPesanKesalahan] = useState("");

  const [konfigurasiModal, aturKonfigurasiModal] =
    useState<KonfigurasiModalAksi | null>(null);

  const formulirValid =
    nama.trim().length > 0 && nomorTelepon.trim().length > 0;

  const tanganiSimpan = async () => {
    if (!formulirValid || sedangMenyimpan) {
      return;
    }

    try {
      aturSedangMenyimpan(true);
      aturPesanKesalahan("");

      const pelanggan = await tambahPelanggan({
        nama: nama.trim(),
        nomorTelepon: nomorTelepon.trim(),

        ...(alamat.trim()
          ? {
              alamat: alamat.trim(),
            }
          : {}),
      });

      aturKonfigurasiModal({
        judul: "Pelanggan Berhasil Ditambahkan",
        pesan: `${pelanggan.nama} sudah tersimpan.`,
        teksTombolUtama: "OK",
        saatTombolUtama: () => navigasi.goBack(),
      });
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangMenyimpan(false);
    }
  };

  return (
    <SafeAreaView style={gaya.areaAman}>
      <KeyboardAvoidingView
        style={gaya.areaAman}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={gaya.konten}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TombolKembali onPress={() => navigasi.goBack()} />
          <View style={gaya.kepala}>
            <Text style={gaya.judul}>Tambah Pelanggan</Text>

            <Text style={gaya.deskripsi}>
              Masukkan informasi pelanggan BARBER BARBAR.
            </Text>
          </View>

          <View style={gaya.kartu}>
            <View style={gaya.grupInput}>
              <Text style={gaya.label}>Nama</Text>

              <TextInput
                value={nama}
                onChangeText={aturNama}
                placeholder="Nama pelanggan"
                placeholderTextColor="#64748b"
                style={gaya.input}
                editable={!sedangMenyimpan}
              />
            </View>

            <View style={gaya.grupInput}>
              <Text style={gaya.label}>Nomor Telepon</Text>

              <TextInput
                value={nomorTelepon}
                onChangeText={aturNomorTelepon}
                placeholder="08xxxxxxxxxx"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                style={gaya.input}
                editable={!sedangMenyimpan}
              />
            </View>

            <View style={gaya.grupInputTerakhir}>
              <Text style={gaya.label}>Alamat</Text>

              <TextInput
                value={alamat}
                onChangeText={aturAlamat}
                placeholder="Alamat pelanggan (opsional)"
                placeholderTextColor="#64748b"
                multiline
                textAlignVertical="top"
                style={[gaya.input, gaya.inputAlamat]}
                editable={!sedangMenyimpan}
              />
            </View>
          </View>

          <View style={gaya.kartuInformasi}>
            <Text style={gaya.judulInformasi}>Membership</Text>

            <Text style={gaya.deskripsiInformasi}>
              Membership dapat didaftarkan setelah data pelanggan berhasil
              dibuat.
            </Text>
          </View>

          {pesanKesalahan ? (
            <View style={gaya.kartuKesalahan}>
              <Text style={gaya.teksKesalahan}>{pesanKesalahan}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={tanganiSimpan}
            disabled={!formulirValid || sedangMenyimpan}
            style={({ pressed }) => [
              gaya.tombolSimpan,

              (!formulirValid || sedangMenyimpan) && gaya.tombolTidakAktif,

              pressed &&
                formulirValid &&
                !sedangMenyimpan &&
                gaya.tombolDitekan,
            ]}
          >
            <Text style={gaya.teksTombol}>
              {sedangMenyimpan ? "Menyimpan..." : "Simpan Pelanggan"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

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
    lineHeight: 20,
    color: "#94a3b8",
  },

  kartu: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    backgroundColor: "#1e293b",
  },

  grupInput: {
    marginBottom: 20,
  },

  grupInputTerakhir: {
    marginBottom: 0,
  },

  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#e2e8f0",
  },

  input: {
    minHeight: 50,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    fontSize: 15,
    color: "#ffffff",
    backgroundColor: "#0f172a",
  },

  inputAlamat: {
    height: 100,
    paddingTop: 14,
    paddingBottom: 14,
  },

  kartuInformasi: {
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#312e81",
    borderRadius: 14,
    backgroundColor: "#1e1b4b",
  },

  judulInformasi: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c7d2fe",
  },

  deskripsiInformasi: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: "#a5b4fc",
  },

  kartuKesalahan: {
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 12,
    backgroundColor: "#450a0a",
  },

  teksKesalahan: {
    fontSize: 13,
    lineHeight: 19,
    color: "#fecaca",
  },

  tombolSimpan: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    borderRadius: 14,
    backgroundColor: "#4f46e5",
  },

  tombolTidakAktif: {
    opacity: 0.45,
  },

  tombolDitekan: {
    opacity: 0.8,
  },

  teksTombol: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
});
