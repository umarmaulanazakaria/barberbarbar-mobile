import { useState } from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import ModalAksi from "../komponen/ModalAksi";

import type { KonfigurasiModalAksi } from "../komponen/ModalAksi";

import { useSesiStore } from "../store/useSesiStore";

export default function LayarProfil() {
  const pengguna = useSesiStore((state) => state.pengguna);

  const logout = useSesiStore((state) => state.logout);

  const [konfigurasiModal, aturKonfigurasiModal] =
    useState<KonfigurasiModalAksi | null>(null);

  const tanganiLogout = () => {
    aturKonfigurasiModal({
      judul: "Keluar",
      pesan: "Yakin ingin keluar dari BARBER BARBAR?",
      teksTombolUtama: "Keluar",
      saatTombolUtama: () => {
        void logout();
      },
      teksTombolKedua: "Batal",
      variasiTombolUtama: "bahaya",
    });
  };

  if (!pengguna) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.dataKosong}>
          <Text style={gaya.judulDataKosong}>Sesi tidak tersedia</Text>
        </View>
      </SafeAreaView>
    );
  }

  const inisial = pengguna.name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={gaya.areaAman}>
      <View style={gaya.kontainer}>
        <View style={gaya.kepala}>
          <Text style={gaya.judul}>Profile</Text>

          <Text style={gaya.deskripsi}>Informasi akun BARBER BARBAR.</Text>
        </View>

        <View style={gaya.kartuProfil}>
          <View style={gaya.avatar}>
            <Text style={gaya.inisial}>{inisial}</Text>
          </View>

          <Text style={gaya.nama}>{pengguna.name}</Text>

          <Text style={gaya.email}>{pengguna.email}</Text>

          <View style={gaya.badge}>
            <Text style={gaya.teksBadge}>{pengguna.role}</Text>
          </View>
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Informasi Akun</Text>

          <View style={gaya.kartuInformasi}>
            <View style={gaya.barisInformasi}>
              <Text style={gaya.labelInformasi}>Nama</Text>

              <Text style={gaya.nilaiInformasi}>{pengguna.name}</Text>
            </View>

            <View style={gaya.pemisah} />

            <View style={gaya.barisInformasi}>
              <Text style={gaya.labelInformasi}>Email</Text>

              <Text style={gaya.nilaiInformasi}>{pengguna.email}</Text>
            </View>

            <View style={gaya.pemisah} />

            <View style={gaya.barisInformasi}>
              <Text style={gaya.labelInformasi}>Role</Text>

              <Text style={gaya.nilaiRole}>{pengguna.role}</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={tanganiLogout}
          style={({ pressed }) => [
            gaya.tombolKeluar,

            pressed && gaya.tombolDitekan,
          ]}
        >
          <Text style={gaya.teksTombolKeluar}>Keluar</Text>
        </Pressable>
      </View>

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

  kontainer: {
    flex: 1,
    padding: 20,
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
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 38,
    backgroundColor: "#4f46e5",
  },

  inisial: {
    fontSize: 30,
    fontWeight: "800",
    color: "#ffffff",
  },

  nama: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },

  email: {
    marginTop: 5,
    fontSize: 13,
    color: "#94a3b8",
  },

  badge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#312e81",
  },

  teksBadge: {
    fontSize: 11,
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

  nilaiRole: {
    fontSize: 13,
    fontWeight: "700",
    color: "#818cf8",
  },

  pemisah: {
    height: 1,
    backgroundColor: "#334155",
  },

  tombolKeluar: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 14,
    backgroundColor: "#450a0a",
  },

  tombolDitekan: {
    opacity: 0.8,
  },

  teksTombolKeluar: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fca5a5",
  },

  dataKosong: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  judulDataKosong: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
});
