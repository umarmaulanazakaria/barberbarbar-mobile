import { useState } from "react";
import { Image, Text } from "react-native";
import { useSesiStore } from "../store/useSesiStore";
import { ambilPesanKesalahan } from "../layanan/api";
import { HalamanStaff, InputStaff, PanelStaff, PesanStaff, s, TombolStaff } from "./UiStaff";
export default function LayarLoginStaff() {
  const login = useSesiStore(v => v.login), sibuk = useSesiStore(v => v.sedangLogin), [email, aturEmail] = useState(""), [password, aturPassword] = useState(""), [error, aturError] = useState("");
  const masuk = async () => { if (sibuk) return; aturError(""); try { await login(email.trim(), password); } catch (e) { aturError(ambilPesanKesalahan(e)); } };
  return <HalamanStaff judul="Selamat datang." subjudul="Masuk untuk melayani pelanggan"><PanelStaff><Image source={require("../../assets/barber-barbar-logo.png")} resizeMode="contain" style={{ width: "80%", height: 65, alignSelf: "center", marginVertical: 20 }}/><Text style={s.h2}>Masuk akun Staff</Text><PesanStaff pesan={error}/><InputStaff label="Email" nilai={email} ubah={aturEmail} nonaktif={sibuk}/><InputStaff label="Kata sandi" nilai={password} ubah={aturPassword} rahasia nonaktif={sibuk}/><TombolStaff judul={sibuk ? "Masuk..." : "Masuk"} nonaktif={sibuk || !email.trim() || !password} aksi={() => void masuk()}/><Text style={s.kecil}>Gunakan akun operator BARBER BARBAR yang terdaftar.</Text></PanelStaff></HalamanStaff>;
}
