import { useState } from "react";

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ambilPesanKesalahan } from "../layanan/api";

import { useSesiStore } from "../store/useSesiStore";

export default function LayarLogin() {
  const [email, aturEmail] = useState("");

  const [kataSandi, aturKataSandi] = useState("");

  const [pesanKesalahan, aturPesanKesalahan] = useState("");

  const login = useSesiStore((state) => state.login);

  const sedangLogin = useSesiStore((state) => state.sedangLogin);

  const formulirValid = email.trim().length > 0 && kataSandi.length > 0;

  const tanganiLogin = async () => {
    if (!formulirValid || sedangLogin) {
      return;
    }

    aturPesanKesalahan("");

    try {
      await login(email.trim(), kataSandi);
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    }
  };

  return (
    <SafeAreaView style={gaya.areaAman}>
      <View style={gaya.kontainer}>
        <View style={gaya.areaLogo}>
          <Image
            source={require("../../assets/barber-barbar-logo.png")}
            style={gaya.logo}
            resizeMode="contain"
          />
        </View>

        <View style={gaya.kartu}>
          <Text style={gaya.judul}>Login Staff</Text>

          <Text style={gaya.deskripsi}>
            Masuk menggunakan akun yang dibuat oleh Admin.
          </Text>

          <View style={gaya.grupInput}>
            <Text style={gaya.label}>Email</Text>

            <TextInput
              style={gaya.input}
              value={email}
              onChangeText={aturEmail}
              placeholder="staff@barber.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!sedangLogin}
            />
          </View>

          <View style={gaya.grupInput}>
            <Text style={gaya.label}>Kata Sandi</Text>

            <TextInput
              style={gaya.input}
              value={kataSandi}
              onChangeText={aturKataSandi}
              placeholder="Masukkan kata sandi"
              placeholderTextColor="#64748b"
              secureTextEntry
              editable={!sedangLogin}
            />
          </View>

          {pesanKesalahan ? (
            <Text style={gaya.pesanKesalahan}>{pesanKesalahan}</Text>
          ) : null}

          <Pressable
            onPress={tanganiLogin}
            disabled={!formulirValid || sedangLogin}
            style={({ pressed }) => [
              gaya.tombolMasuk,

              (!formulirValid || sedangLogin) && gaya.tombolTidakAktif,

              pressed && formulirValid && !sedangLogin && gaya.tombolDitekan,
            ]}
          >
            <Text style={gaya.teksTombol}>
              {sedangLogin ? "Memproses..." : "Masuk"}
            </Text>
          </Pressable>
        </View>
      </View>
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
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  areaLogo: {
    alignItems: "center",
    marginBottom: 28,
  },

  logo: {
    width: "100%",
    height: 110,
  },

  kartu: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#1e293b",
  },

  judul: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },

  deskripsi: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
    color: "#94a3b8",
  },

  grupInput: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#e2e8f0",
  },

  input: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    fontSize: 16,
    color: "#ffffff",
    backgroundColor: "#0f172a",
  },

  pesanKesalahan: {
    marginBottom: 16,
    fontSize: 13,
    color: "#f87171",
  },

  tombolMasuk: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});
