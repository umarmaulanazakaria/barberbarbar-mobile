import { useCallback,useEffect, useMemo, useState } from "react";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";

import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";

import TombolKembali from "../komponen/TombolKembali";

import ModalAksi from "../komponen/ModalAksi";

import type { KonfigurasiModalAksi } from "../komponen/ModalAksi";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

import { ambilSemuaBarber } from "../layanan/barber";

import { ambilSemuaLayanan } from "../layanan/layanan";

import { ambilSemuaPelanggan } from "../layanan/pelanggan";

import { tambahPesanan } from "../layanan/pesanan";

import type { Barber } from "../tipe/barber";

import type { Layanan } from "../tipe/layanan";

import type { Pelanggan } from "../tipe/pelanggan";

import type { DaftarRutePesanan } from "../navigasi/NavigasiPesanan";

type NavigasiBuatPesanan = NativeStackNavigationProp<
  DaftarRutePesanan,
  "BuatPesanan"
>;

type JumlahService = Record<number, number>;

const formatRupiah = (nilai: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
};

export default function LayarBuatPesanan() {
  const navigasi = useNavigation<NavigasiBuatPesanan>();

  const [daftarPelanggan, aturDaftarPelanggan] = useState<Pelanggan[]>([]);

  const [daftarBarber, aturDaftarBarber] = useState<Barber[]>([]);

  const [daftarLayanan, aturDaftarLayanan] = useState<Layanan[]>([]);

  const [idPelangganTerpilih, aturIdPelangganTerpilih] = useState<
    number | null
  >(null);

  const [idBarberTerpilih, aturIdBarberTerpilih] = useState<number | null>(
    null,
  );

  const [jumlahService, aturJumlahService] = useState<JumlahService>({});

  const [dropdownPelangganTerbuka, aturDropdownPelangganTerbuka] =
    useState(false);

  const [dropdownBarberTerbuka, aturDropdownBarberTerbuka] = useState(false);

  const [kataPencarianPelanggan, aturKataPencarianPelanggan] = useState("");

  const [kataPencarianBarber, aturKataPencarianBarber] = useState("");

  const [catatan, aturCatatan] = useState("");

  const [sedangMemuat, aturSedangMemuat] = useState(true);

  const [sedangMenyimpan, aturSedangMenyimpan] = useState(false);

  const [pesanKesalahan, aturPesanKesalahan] = useState("");

  const [konfigurasiModal, aturKonfigurasiModal] =
    useState<KonfigurasiModalAksi | null>(null);

  const muatData = useCallback(async () => {
    try {
      aturSedangMemuat(true);

      aturPesanKesalahan("");

      const [pelanggan, barber, layanan] = await Promise.all([
        ambilSemuaPelanggan(),
        ambilSemuaBarber(),
        ambilSemuaLayanan(),
      ]);

      aturDaftarPelanggan(pelanggan);

      aturDaftarBarber(barber.filter((item) => item.aktif));

      aturDaftarLayanan(layanan.filter((item) => item.aktif));
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangMemuat(false);
    }
  }, []);
  usePenyegaranRealtime(["pelanggan","membership","katalog"],muatData);
  useEffect(() => {
    void muatData();
  }, []);

  const pelangganAktif = useMemo(() => {
    const pencarian = kataPencarianPelanggan.trim().toLowerCase();

    return daftarPelanggan.filter((pelanggan) => {
      if (pelanggan.status !== "AKTIF") {
        return false;
      }

      if (!pencarian) {
        return true;
      }

      return (
        pelanggan.nama.toLowerCase().includes(pencarian) ||
        pelanggan.nomorTelepon.toLowerCase().includes(pencarian)
      );
    });
  }, [daftarPelanggan, kataPencarianPelanggan]);

  const barberTerfilter = useMemo(() => {
    const pencarian = kataPencarianBarber.trim().toLowerCase();

    if (!pencarian) {
      return daftarBarber;
    }

    return daftarBarber.filter((barber) => {
      return (
        barber.nama.toLowerCase().includes(pencarian) ||
        barber.nomorTelepon?.toLowerCase().includes(pencarian)
      );
    });
  }, [daftarBarber, kataPencarianBarber]);

  const pelangganTerpilih = daftarPelanggan.find(
    (pelanggan) => pelanggan.id === idPelangganTerpilih,
  );

  const barberTerpilih = daftarBarber.find(
    (barber) => barber.id === idBarberTerpilih,
  );

  const layananTerpilih = daftarLayanan.filter(
    (layanan) => (jumlahService[layanan.id] ?? 0) > 0,
  );

  const subtotalPerkiraan = layananTerpilih.reduce((total, layanan) => {
    const qty = jumlahService[layanan.id] ?? 0;

    return total + layanan.harga * qty;
  }, 0);

  const discountPersenPerkiraan = pelangganTerpilih?.membership?.isActive
    ? pelangganTerpilih.membership.discountPercent
    : 0;

  const diskonPerkiraan = Math.floor(
    (subtotalPerkiraan * discountPersenPerkiraan) / 100,
  );

  const totalPerkiraan = subtotalPerkiraan - diskonPerkiraan;

  const formulirValid =
    idPelangganTerpilih !== null &&
    layananTerpilih.length > 0;

  const ubahJumlahService = (idLayanan: number, perubahan: number) => {
    aturJumlahService((sebelumnya) => {
      const jumlahSaatIni = sebelumnya[idLayanan] ?? 0;

      const jumlahBaru = Math.max(0, Math.min(20, jumlahSaatIni + perubahan));

      if (jumlahBaru === 0) {
        const dataBaru = {
          ...sebelumnya,
        };

        delete dataBaru[idLayanan];

        return dataBaru;
      }

      return {
        ...sebelumnya,
        [idLayanan]: jumlahBaru,
      };
    });
  };

  const pilihPelanggan = (pelanggan: Pelanggan) => {
    aturIdPelangganTerpilih(pelanggan.id);

    aturKataPencarianPelanggan("");

    aturDropdownPelangganTerbuka(false);
  };

  const pilihBarber = (barber: Barber) => {
    aturIdBarberTerpilih(barber.id);

    aturKataPencarianBarber("");

    aturDropdownBarberTerbuka(false);
  };

  const tutupDropdownPelanggan = () => {
    aturKataPencarianPelanggan("");

    aturDropdownPelangganTerbuka(false);
  };

  const tutupDropdownBarber = () => {
    aturKataPencarianBarber("");

    aturDropdownBarberTerbuka(false);
  };

  const prosesBuatOrder = async () => {
    if (
      !formulirValid ||
      idPelangganTerpilih === null ||
      sedangMenyimpan
    ) {
      return;
    }

    try {
      aturSedangMenyimpan(true);

      aturPesanKesalahan("");

      const hasil = await tambahPesanan({
        pelangganId: idPelangganTerpilih,

        ...(idBarberTerpilih === null ? {} : { barberId: idBarberTerpilih }),

        items: layananTerpilih.map((layanan) => ({
          layananId: layanan.id,

          qty: jumlahService[layanan.id] ?? 1,
        })),

        ...(catatan.trim()
          ? {
              catatan: catatan.trim(),
            }
          : {}),
      });

      aturKonfigurasiModal({
        judul: "Pesanan Berhasil Dibuat",
        pesan: `${hasil.data.nomorPesanan} berhasil dibuat.`,
        teksTombolUtama: "Lihat Pesanan",
        saatTombolUtama: () => {
          navigasi.replace("DetailPesanan", {
            idPesanan: hasil.data.id,
          });
        },
      });
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangMenyimpan(false);
    }
  };

  const tanganiBuatOrder = () => {
    if (!formulirValid || sedangMenyimpan) {
      return;
    }

    aturKonfigurasiModal({
      judul: "Buat Pesanan",
      pesan: "Pastikan pelanggan, barber, dan layanan sudah benar.",
      teksTombolUtama: "Buat Pesanan",
      saatTombolUtama: () => {
        void prosesBuatOrder();
      },
      teksTombolKedua: "Batal",
    });
  };

  if (sedangMemuat) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.loading}>
          <ActivityIndicator size="large" color="#818cf8" />

          <Text style={gaya.teksLoading}>Menyiapkan pesanan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={gaya.areaAman}>
      <ScrollView
        contentContainerStyle={gaya.konten}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TombolKembali onPress={() => navigasi.goBack()} />

        <View style={gaya.kepala}>
          <Text style={gaya.judul}>Buat Pesanan</Text>

          <Text style={gaya.deskripsi}>
            Pilih pelanggan, barber, dan layanan.
          </Text>
        </View>

        {pesanKesalahan ? (
          <View style={gaya.kartuKesalahan}>
            <Text style={gaya.teksKesalahan}>{pesanKesalahan}</Text>

            <Pressable
              onPress={() => {
                void muatData();
              }}
            >
              <Text style={gaya.cobaLagi}>Muat ulang data</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Pelanggan</Text>

          <Pressable
            onPress={() => aturDropdownPelangganTerbuka(true)}
            style={({ pressed }) => [
              gaya.dropdownField,

              pelangganTerpilih && gaya.dropdownFieldTerpilih,

              pressed && gaya.kartuDitekan,
            ]}
          >
            <View style={gaya.isiDropdownField}>
              {pelangganTerpilih ? (
                <>
                  <Text style={gaya.nilaiDropdown}>
                    {pelangganTerpilih.nama}
                  </Text>

                  <Text style={gaya.keteranganDropdown}>
                    {pelangganTerpilih.nomorTelepon}
                  </Text>
                </>
              ) : (
                <Text style={gaya.placeholderDropdown}>Pilih pelanggan</Text>
              )}
            </View>

            {pelangganTerpilih ? (
              <View
                style={[
                  gaya.badge,

                  pelangganTerpilih.membership?.isActive
                    ? gaya.badgeMember
                    : gaya.badgeReguler,
                ]}
              >
                <Text style={gaya.teksBadge}>
                  {pelangganTerpilih.membership?.isActive
                    ? "Member"
                    : "Reguler"}
                </Text>
              </View>
            ) : null}

            <Ionicons name="chevron-down" size={20} color="#818cf8" />
          </Pressable>
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Barber (opsional; ditentukan saat mulai layanan)</Text>

          <Pressable
            onPress={() => aturDropdownBarberTerbuka(true)}
            style={({ pressed }) => [
              gaya.dropdownField,

              barberTerpilih && gaya.dropdownFieldTerpilih,

              pressed && gaya.kartuDitekan,
            ]}
          >
            <View style={gaya.isiDropdownField}>
              {barberTerpilih ? (
                <>
                  <Text style={gaya.nilaiDropdown}>{barberTerpilih.nama}</Text>

                  {barberTerpilih.nomorTelepon ? (
                    <Text style={gaya.keteranganDropdown}>
                      {barberTerpilih.nomorTelepon}
                    </Text>
                  ) : (
                    <Text style={gaya.keteranganDropdown}>Barber aktif</Text>
                  )}
                </>
              ) : (
                <Text style={gaya.placeholderDropdown}>Pilih Barber</Text>
              )}
            </View>

            {barberTerpilih ? (
              <Text style={gaya.statusAktif}>Aktif</Text>
            ) : null}

            <Ionicons name="chevron-down" size={20} color="#818cf8" />
          </Pressable>
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Layanan</Text>

          <View style={gaya.daftarPilihan}>
            {daftarLayanan.map((layanan) => {
              const qty = jumlahService[layanan.id] ?? 0;

              return (
                <View
                  key={layanan.id}
                  style={[gaya.kartuService, qty > 0 && gaya.kartuTerpilih]}
                >
                  <View style={gaya.informasiPilihan}>
                    <Text style={gaya.namaPilihan}>{layanan.nama}</Text>

                    <Text style={gaya.deskripsiPilihan}>
                      {formatRupiah(layanan.harga)}
                      {" • "}
                      {layanan.durasiMenit} menit
                    </Text>
                  </View>

                  <View style={gaya.pengaturJumlah}>
                    <Pressable
                      onPress={() => ubahJumlahService(layanan.id, -1)}
                      disabled={qty === 0}
                      style={[
                        gaya.tombolJumlah,

                        qty === 0 && gaya.tombolJumlahNonaktif,
                      ]}
                    >
                      <Text style={gaya.teksJumlah}>−</Text>
                    </Pressable>

                    <Text style={gaya.nilaiJumlah}>{qty}</Text>

                    <Pressable
                      onPress={() => ubahJumlahService(layanan.id, 1)}
                      disabled={qty >= 20}
                      style={[
                        gaya.tombolJumlah,

                        qty >= 20 && gaya.tombolJumlahNonaktif,
                      ]}
                    >
                      <Text style={gaya.teksJumlah}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Catatan</Text>

          <TextInput
            value={catatan}
            onChangeText={aturCatatan}
            placeholder="Catatan pesanan (opsional)"
            placeholderTextColor="#64748b"
            multiline
            maxLength={500}
            textAlignVertical="top"
            style={[gaya.input, gaya.inputCatatan]}
          />
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Ringkasan</Text>

          <View style={gaya.kartuRingkasan}>
            <View style={gaya.barisRingkasan}>
              <Text style={gaya.labelRingkasan}>Pelanggan</Text>

              <Text style={gaya.nilaiRingkasan}>
                {pelangganTerpilih?.nama ?? "-"}
              </Text>
            </View>

            <View style={gaya.pemisah} />

            <View style={gaya.barisRingkasan}>
              <Text style={gaya.labelRingkasan}>Barber</Text>

              <Text style={gaya.nilaiRingkasan}>
                {barberTerpilih?.nama ?? "-"}
              </Text>
            </View>

            <View style={gaya.pemisah} />

            <View style={gaya.barisRingkasan}>
              <Text style={gaya.labelRingkasan}>Subtotal</Text>

              <Text style={gaya.nilaiRingkasan}>
                {formatRupiah(subtotalPerkiraan)}
              </Text>
            </View>

            {discountPersenPerkiraan > 0 ? (
              <>
                <View style={gaya.pemisah} />

                <View style={gaya.barisRingkasan}>
                  <Text style={gaya.labelDiscount}>
                    Member Discount {discountPersenPerkiraan}%
                  </Text>

                  <Text style={gaya.nilaiDiscount}>
                    -{formatRupiah(diskonPerkiraan)}
                  </Text>
                </View>
              </>
            ) : null}

            <View style={gaya.pemisah} />

            <View style={gaya.barisTotal}>
              <Text style={gaya.labelTotal}>Perkiraan Total</Text>

              <Text style={gaya.nilaiTotal}>
                {formatRupiah(totalPerkiraan)}
              </Text>
            </View>
          </View>

          <Text style={gaya.keteranganTotal}>
            Total akhir dihitung saat pesanan dibuat.
          </Text>
        </View>

        <Pressable
          onPress={tanganiBuatOrder}
          disabled={!formulirValid || sedangMenyimpan}
          style={({ pressed }) => [
            gaya.tombolUtama,

            (!formulirValid || sedangMenyimpan) && gaya.tombolTidakAktif,

            pressed && formulirValid && !sedangMenyimpan && gaya.tombolDitekan,
          ]}
        >
          <Text style={gaya.teksTombol}>
            {sedangMenyimpan ? "Membuat pesanan..." : "Buat Pesanan"}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={dropdownPelangganTerbuka}
        transparent
        animationType="fade"
        onRequestClose={tutupDropdownPelanggan}
      >
        <View style={gaya.overlayModal}>
          <Pressable style={gaya.latarModal} onPress={tutupDropdownPelanggan} />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={gaya.keyboardModal}
          >
            <View style={gaya.kartuDropdown}>
              <View style={gaya.headerDropdown}>
                <View>
                  <Text style={gaya.judulDropdown}>Pilih Pelanggan</Text>

                  <Text style={gaya.deskripsiDropdown}>
                    Cari berdasarkan nama atau nomor telepon.
                  </Text>
                </View>

                <Pressable
                  onPress={tutupDropdownPelanggan}
                  style={({ pressed }) => [
                    gaya.tombolTutupDropdown,

                    pressed && gaya.kartuDitekan,
                  ]}
                >
                  <Ionicons name="close" size={22} color="#cbd5e1" />
                </Pressable>
              </View>

              <View style={gaya.kotakPencarian}>
                <Ionicons name="search" size={20} color="#64748b" />

                <TextInput
                  value={kataPencarianPelanggan}
                  onChangeText={aturKataPencarianPelanggan}
                  placeholder="Cari nama atau nomor telepon"
                  placeholderTextColor="#64748b"
                  autoFocus
                  style={gaya.inputPencarian}
                />

                {kataPencarianPelanggan.length > 0 ? (
                  <Pressable onPress={() => aturKataPencarianPelanggan("")}>
                    <Ionicons name="close-circle" size={20} color="#64748b" />
                  </Pressable>
                ) : null}
              </View>

              <FlatList
                data={pelangganAktif}
                keyExtractor={(item) => item.id.toString()}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={gaya.daftarDropdown}
                ItemSeparatorComponent={() => (
                  <View style={gaya.jarakItemDropdown} />
                )}
                renderItem={({ item }) => {
                  const terpilih = item.id === idPelangganTerpilih;

                  return (
                    <Pressable
                      onPress={() => pilihPelanggan(item)}
                      style={({ pressed }) => [
                        gaya.itemDropdown,

                        terpilih && gaya.itemDropdownTerpilih,

                        pressed && gaya.kartuDitekan,
                      ]}
                    >
                      <View style={gaya.informasiDropdown}>
                        <Text style={gaya.namaDropdown}>{item.nama}</Text>

                        <Text style={gaya.detailDropdown}>
                          {item.nomorTelepon}
                        </Text>
                      </View>

                      <View style={gaya.sisiKananDropdown}>
                        <View
                          style={[
                            gaya.badge,

                            item.membership?.isActive
                              ? gaya.badgeMember
                              : gaya.badgeReguler,
                          ]}
                        >
                          <Text style={gaya.teksBadge}>
                            {item.membership?.isActive ? "Member" : "Reguler"}
                          </Text>
                        </View>

                        {terpilih ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#818cf8"
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <View style={gaya.dataKosongDropdown}>
                    <Ionicons name="search-outline" size={34} color="#475569" />

                    <Text style={gaya.judulKosongDropdown}>
                      Pelanggan tidak ditemukan
                    </Text>

                    <Text style={gaya.deskripsiKosongDropdown}>
                      Coba gunakan nama atau nomor telepon yang berbeda.
                    </Text>
                  </View>
                }
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={dropdownBarberTerbuka}
        transparent
        animationType="fade"
        onRequestClose={tutupDropdownBarber}
      >
        <View style={gaya.overlayModal}>
          <Pressable style={gaya.latarModal} onPress={tutupDropdownBarber} />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={gaya.keyboardModal}
          >
            <View style={gaya.kartuDropdown}>
              <View style={gaya.headerDropdown}>
                <View>
                  <Text style={gaya.judulDropdown}>Pilih Barber</Text>

                  <Text style={gaya.deskripsiDropdown}>
                    Cari Barber aktif berdasarkan nama.
                  </Text>
                </View>

                <Pressable
                  onPress={tutupDropdownBarber}
                  style={({ pressed }) => [
                    gaya.tombolTutupDropdown,

                    pressed && gaya.kartuDitekan,
                  ]}
                >
                  <Ionicons name="close" size={22} color="#cbd5e1" />
                </Pressable>
              </View>

              <View style={gaya.kotakPencarian}>
                <Ionicons name="search" size={20} color="#64748b" />

                <TextInput
                  value={kataPencarianBarber}
                  onChangeText={aturKataPencarianBarber}
                  placeholder="Cari nama Barber"
                  placeholderTextColor="#64748b"
                  autoFocus
                  style={gaya.inputPencarian}
                />

                {kataPencarianBarber.length > 0 ? (
                  <Pressable onPress={() => aturKataPencarianBarber("")}>
                    <Ionicons name="close-circle" size={20} color="#64748b" />
                  </Pressable>
                ) : null}
              </View>

              <FlatList
                data={barberTerfilter}
                keyExtractor={(item) => item.id.toString()}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={gaya.daftarDropdown}
                ItemSeparatorComponent={() => (
                  <View style={gaya.jarakItemDropdown} />
                )}
                renderItem={({ item }) => {
                  const terpilih = item.id === idBarberTerpilih;

                  return (
                    <Pressable
                      onPress={() => pilihBarber(item)}
                      style={({ pressed }) => [
                        gaya.itemDropdown,

                        terpilih && gaya.itemDropdownTerpilih,

                        pressed && gaya.kartuDitekan,
                      ]}
                    >
                      <View style={gaya.informasiDropdown}>
                        <Text style={gaya.namaDropdown}>{item.nama}</Text>

                        {item.nomorTelepon ? (
                          <Text style={gaya.detailDropdown}>
                            {item.nomorTelepon}
                          </Text>
                        ) : null}
                      </View>

                      <View style={gaya.sisiKananDropdown}>
                        <Text style={gaya.statusAktif}>Aktif</Text>

                        {terpilih ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#818cf8"
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <View style={gaya.dataKosongDropdown}>
                    <Ionicons name="search-outline" size={34} color="#475569" />

                    <Text style={gaya.judulKosongDropdown}>
                      Barber tidak ditemukan
                    </Text>

                    <Text style={gaya.deskripsiKosongDropdown}>
                      Coba gunakan nama Barber yang berbeda.
                    </Text>
                  </View>
                }
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
    marginBottom: 28,
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

  bagian: {
    marginBottom: 28,
  },

  judulBagian: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  input: {
    minHeight: 50,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    fontSize: 14,
    color: "#ffffff",
    backgroundColor: "#1e293b",
  },

  inputCatatan: {
    height: 100,
    paddingTop: 14,
    paddingBottom: 14,
  },

  dropdownField: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },

  dropdownFieldTerpilih: {
    borderColor: "#4f46e5",
  },

  isiDropdownField: {
    flex: 1,
    marginRight: 10,
  },

  placeholderDropdown: {
    fontSize: 14,
    color: "#64748b",
  },

  nilaiDropdown: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  keteranganDropdown: {
    marginTop: 4,
    fontSize: 12,
    color: "#94a3b8",
  },

  daftarPilihan: {
    gap: 10,
    marginTop: 10,
  },

  kartuService: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },

  kartuTerpilih: {
    borderColor: "#6366f1",
    backgroundColor: "#25294a",
  },

  kartuDitekan: {
    opacity: 0.8,
  },

  informasiPilihan: {
    flex: 1,
    marginRight: 12,
  },

  namaPilihan: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  deskripsiPilihan: {
    marginTop: 5,
    fontSize: 12,
    color: "#94a3b8",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
    borderRadius: 999,
  },

  badgeMember: {
    backgroundColor: "#312e81",
  },

  badgeReguler: {
    backgroundColor: "#334155",
  },

  teksBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },

  statusAktif: {
    marginRight: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#34d399",
  },

  pengaturJumlah: {
    flexDirection: "row",
    alignItems: "center",
  },

  tombolJumlah: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#4f46e5",
  },

  tombolJumlahNonaktif: {
    opacity: 0.3,
  },

  teksJumlah: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },

  nilaiJumlah: {
    minWidth: 36,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    color: "#ffffff",
  },

  kartuRingkasan: {
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    backgroundColor: "#1e293b",
  },

  barisRingkasan: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },

  labelRingkasan: {
    fontSize: 13,
    color: "#94a3b8",
  },

  nilaiRingkasan: {
    maxWidth: "60%",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    color: "#ffffff",
  },

  labelDiscount: {
    fontSize: 13,
    color: "#a5b4fc",
  },

  nilaiDiscount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#a5b4fc",
  },

  pemisah: {
    height: 1,
    backgroundColor: "#334155",
  },

  barisTotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
  },

  labelTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  nilaiTotal: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },

  keteranganTotal: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: "#64748b",
  },

  tombolUtama: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
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

  kartuKesalahan: {
    marginBottom: 24,
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

  cobaLagi: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#a5b4fc",
  },

  overlayModal: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(2, 6, 23, 0.78)",
  },

  latarModal: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  keyboardModal: {
    width: "100%",
    maxHeight: "82%",
  },

  kartuDropdown: {
    width: "100%",
    maxHeight: "100%",
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 20,
    backgroundColor: "#0f172a",
  },

  headerDropdown: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  judulDropdown: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },

  deskripsiDropdown: {
    marginTop: 5,
    fontSize: 12,
    color: "#94a3b8",
  },

  tombolTutupDropdown: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 11,
    backgroundColor: "#1e293b",
  },

  kotakPencarian: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 13,
    backgroundColor: "#1e293b",
  },

  inputPencarian: {
    flex: 1,
    marginHorizontal: 9,
    paddingVertical: 0,
    fontSize: 14,
    color: "#ffffff",
  },

  daftarDropdown: {
    flexGrow: 1,
    paddingBottom: 4,
  },

  jarakItemDropdown: {
    height: 9,
  },

  itemDropdown: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },

  itemDropdownTerpilih: {
    borderColor: "#6366f1",
    backgroundColor: "#25294a",
  },

  informasiDropdown: {
    flex: 1,
    marginRight: 12,
  },

  namaDropdown: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  detailDropdown: {
    marginTop: 5,
    fontSize: 12,
    color: "#94a3b8",
  },

  sisiKananDropdown: {
    flexDirection: "row",
    alignItems: "center",
  },

  dataKosongDropdown: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 44,
    paddingHorizontal: 20,
  },

  judulKosongDropdown: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  deskripsiKosongDropdown: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: "#64748b",
  },
});
