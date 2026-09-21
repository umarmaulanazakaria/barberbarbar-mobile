import { useCallback, useEffect, useState } from "react";

import TombolKembali from "../komponen/TombolKembali";

import ModalAksi from "../komponen/ModalAksi";

import type { KonfigurasiModalAksi } from "../komponen/ModalAksi";

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
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ambilPesanKesalahan } from "../layanan/api";

import {
  hapusItemPesanan,
  tambahItemPesanan,
  ubahItemPesanan,
} from "../layanan/itemPesanan";

import { ambilSemuaLayanan } from "../layanan/layanan";

import { ambilPesananBerdasarkanId, bayarPesanan } from "../layanan/pesanan";

import type { Layanan } from "../tipe/layanan";

import type { MetodePembayaran, Pesanan } from "../tipe/pesanan";

import type { DaftarRutePesanan } from "../navigasi/NavigasiPesanan";

type RutePayment = RouteProp<DaftarRutePesanan, "PaymentPesanan">;

type NavigasiPayment = NativeStackNavigationProp<
  DaftarRutePesanan,
  "PaymentPesanan"
>;

const daftarMetode: {
  nilai: MetodePembayaran;
  label: string;
}[] = [
  {
    nilai: "CASH",
    label: "Cash",
  },
  {
    nilai: "QRIS",
    label: "QRIS",
  },
  {
    nilai: "CARD",
    label: "Card",
  },
  {
    nilai: "TRANSFER",
    label: "Transfer",
  },
  {
    nilai: "OTHER",
    label: "Other",
  },
];

const daftarNominalCepat = [
  {
    nilai: 10000,
    label: "Rp10rb",
  },
  {
    nilai: 20000,
    label: "Rp20rb",
  },
  {
    nilai: 50000,
    label: "Rp50rb",
  },
  {
    nilai: 100000,
    label: "Rp100rb",
  },
];

const formatRupiah = (nilai: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
};

const hanyaAngka = (nilai: string) => {
  return nilai.replace(/[^0-9]/g, "");
};

export default function LayarPayment() {
  const rute = useRoute<RutePayment>();

  const navigasi = useNavigation<NavigasiPayment>();

  const { idPesanan } = rute.params;

  const [pesanan, aturPesanan] = useState<Pesanan | null>(null);

  const [daftarLayanan, aturDaftarLayanan] = useState<Layanan[]>([]);

  const [idLayananBaru, aturIdLayananBaru] = useState<number | null>(null);

  const [metode, aturMetode] = useState<MetodePembayaran>("CASH");

  const [jumlahDiterima, aturJumlahDiterima] = useState("");

  const [nominalCepatTerpilih, aturNominalCepatTerpilih] = useState<
    number | "PAS" | null
  >(null);

  const [catatan, aturCatatan] = useState("");

  const [sedangMemuat, aturSedangMemuat] = useState(true);

  const [sedangAksi, aturSedangAksi] = useState(false);

  const [pesanKesalahan, aturPesanKesalahan] = useState("");

  const [konfigurasiModal, aturKonfigurasiModal] =
    useState<KonfigurasiModalAksi | null>(null);

  const muatData = useCallback(async () => {
    try {
      aturPesanKesalahan("");

      const [dataPesanan, dataLayanan] = await Promise.all([
        ambilPesananBerdasarkanId(idPesanan),

        ambilSemuaLayanan(),
      ]);

      aturPesanan(dataPesanan);

      aturDaftarLayanan(dataLayanan.filter((item) => item.aktif));
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangMemuat(false);
    }
  }, [idPesanan]);

  useFocusEffect(
    useCallback(() => {
      aturSedangMemuat(true);

      void muatData();
    }, [muatData]),
  );

  useEffect(() => {
    if (nominalCepatTerpilih === "PAS" && pesanan) {
      aturJumlahDiterima(String(pesanan.total));
    }
  }, [nominalCepatTerpilih, pesanan?.total]);

  const jalankanAksiItem = async (aksi: () => Promise<unknown>) => {
    if (sedangAksi) {
      return;
    }

    try {
      aturSedangAksi(true);

      aturPesanKesalahan("");

      await aksi();

      await muatData();
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangAksi(false);
    }
  };

  const tanganiTambahService = () => {
    if (!idLayananBaru || !pesanan) {
      return;
    }

    void jalankanAksiItem(async () => {
      await tambahItemPesanan({
        pesananId: pesanan.id,

        layananId: idLayananBaru,

        qty: 1,
      });

      aturIdLayananBaru(null);
    });
  };

  const tanganiUbahQty = (idItem: number, qty: number) => {
    if (qty < 1 || qty > 20) {
      return;
    }

    void jalankanAksiItem(async () => {
      await ubahItemPesanan(idItem, {
        qty,
      });
    });
  };

  const tanganiHapusItem = (idItem: number, namaLayanan: string) => {
    aturKonfigurasiModal({
      judul: "Hapus Service",
      pesan: `Hapus ${namaLayanan} dari Order?`,
      teksTombolUtama: "Hapus",
      saatTombolUtama: () => {
        void jalankanAksiItem(async () => {
          await hapusItemPesanan(idItem);
        });
      },
      teksTombolKedua: "Batal",
      variasiTombolUtama: "bahaya",
    });
  };

  const tanganiNominalCepat = (nilai: number | "PAS") => {
    if (!pesanan) {
      return;
    }

    aturNominalCepatTerpilih(nilai);

    aturJumlahDiterima(String(nilai === "PAS" ? pesanan.total : nilai));
  };

  const nominalDiterima = Number(jumlahDiterima || 0);

  const kembalian = pesanan ? Math.max(0, nominalDiterima - pesanan.total) : 0;

  const paymentValid =
    pesanan !== null &&
    pesanan.status === "COMPLETED" &&
    pesanan.statusPembayaran === "UNPAID" &&
    nominalDiterima >= pesanan.total;

  const prosesPayment = async () => {
    if (!pesanan || !paymentValid || sedangAksi) {
      return;
    }

    try {
      aturSedangAksi(true);

      aturPesanKesalahan("");

      const hasil = await bayarPesanan(pesanan.id, {
        metode,

        jumlahDiterima: nominalDiterima,

        ...(catatan.trim()
          ? {
              catatan: catatan.trim(),
            }
          : {}),
      });

      aturPesanan((pesananSaatIni) => {
        if (!pesananSaatIni) {
          return null;
        }

        return {
          ...pesananSaatIni,

          statusPembayaran: "PAID",

          pembayaran: hasil.data.pembayaran,
        };
      });

      aturJumlahDiterima("");

      aturNominalCepatTerpilih(null);

      aturCatatan("");

      void muatData();

      aturKonfigurasiModal({
        judul: "Payment Berhasil",
        pesan: `Invoice ${
          hasil.data.pembayaran.nomorInvoice
        }\nKembalian: ${formatRupiah(hasil.data.pembayaran.kembalian)}`,
        teksTombolUtama: "Selesai",
        saatTombolUtama: () => {
          navigasi.goBack();
        },
        bisaTutupDenganBackdrop: false,
      });
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangAksi(false);
    }
  };

  const tanganiPayment = () => {
    if (!paymentValid) {
      return;
    }

    aturKonfigurasiModal({
      judul: "Konfirmasi Payment",
      pesan: `Bayar ${pesanan?.nomorPesanan} dengan metode ${metode}?`,
      teksTombolUtama: "Bayar",
      saatTombolUtama: () => {
        void prosesPayment();
      },
      teksTombolKedua: "Batal",
    });
  };

  if (sedangMemuat) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.loading}>
          <ActivityIndicator size="large" color="#818cf8" />

          <Text style={gaya.teksLoading}>Menyiapkan Payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pesanan) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.dataTidakDitemukan}>
          <Text style={gaya.judulDataTidakDitemukan}>
            Order tidak ditemukan
          </Text>

          <Text style={gaya.deskripsiDataTidakDitemukan}>
            {pesanKesalahan || "Data Order tidak tersedia."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const layananTersedia = daftarLayanan.filter(
    (layanan) => !pesanan.items.some((item) => item.layananId === layanan.id),
  );

  if (pesanan.status !== "COMPLETED") {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.dataTidakDitemukan}>
          <Text style={gaya.judulDataTidakDitemukan}>
            Payment belum tersedia
          </Text>

          <Text style={gaya.deskripsiDataTidakDitemukan}>
            Service harus diselesaikan terlebih dahulu.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (pesanan.statusPembayaran === "PAID") {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.dataTidakDitemukan}>
          <Text style={gaya.judulPaymentSelesai}>Payment Sudah Selesai</Text>

          <Text style={gaya.deskripsiDataTidakDitemukan}>
            Invoice: {pesanan.pembayaran?.nomorInvoice ?? "-"}
          </Text>
        </View>

        <ModalAksi
          konfigurasi={konfigurasiModal}
          onTutup={() => aturKonfigurasiModal(null)}
        />
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
          <Text style={gaya.nomorPesanan}>{pesanan.nomorPesanan}</Text>

          <Text style={gaya.judul}>Payment</Text>

          <Text style={gaya.deskripsi}>
            Periksa Service sebelum menyelesaikan pembayaran.
          </Text>
        </View>

        {pesanKesalahan ? (
          <View style={gaya.kartuKesalahan}>
            <Text style={gaya.teksKesalahan}>{pesanKesalahan}</Text>
          </View>
        ) : null}

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Service</Text>

          <View style={gaya.daftarService}>
            {pesanan.items.map((item) => (
              <View key={item.id} style={gaya.kartuService}>
                <View style={gaya.barisServiceAtas}>
                  <View style={gaya.informasiService}>
                    <Text style={gaya.namaService}>{item.namaLayanan}</Text>

                    <Text style={gaya.hargaService}>
                      {formatRupiah(item.harga)} / item
                    </Text>
                  </View>

                  <Text style={gaya.subtotalService}>
                    {formatRupiah(item.subtotal)}
                  </Text>
                </View>

                <View style={gaya.areaAksiItem}>
                  <View style={gaya.pengaturJumlah}>
                    <Pressable
                      onPress={() => tanganiUbahQty(item.id, item.qty - 1)}
                      disabled={sedangAksi || item.qty <= 1}
                      style={[
                        gaya.tombolJumlah,

                        (sedangAksi || item.qty <= 1) && gaya.tombolTidakAktif,
                      ]}
                    >
                      <Text style={gaya.teksJumlah}>−</Text>
                    </Pressable>

                    <Text style={gaya.nilaiJumlah}>{item.qty}</Text>

                    <Pressable
                      onPress={() => tanganiUbahQty(item.id, item.qty + 1)}
                      disabled={sedangAksi || item.qty >= 20}
                      style={[
                        gaya.tombolJumlah,

                        (sedangAksi || item.qty >= 20) && gaya.tombolTidakAktif,
                      ]}
                    >
                      <Text style={gaya.teksJumlah}>+</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => tanganiHapusItem(item.id, item.namaLayanan)}
                    disabled={sedangAksi || pesanan.items.length <= 1}
                    style={[
                      gaya.tombolHapus,

                      (sedangAksi || pesanan.items.length <= 1) &&
                        gaya.tombolTidakAktif,
                    ]}
                  >
                    <Text style={gaya.teksHapus}>Hapus</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        {layananTersedia.length > 0 ? (
          <View style={gaya.bagian}>
            <Text style={gaya.judulBagian}>Tambah Service</Text>

            <View style={gaya.daftarLayanan}>
              {layananTersedia.map((layanan) => {
                const terpilih = layanan.id === idLayananBaru;

                return (
                  <Pressable
                    key={layanan.id}
                    onPress={() => aturIdLayananBaru(layanan.id)}
                    style={({ pressed }) => [
                      gaya.kartuLayanan,

                      terpilih && gaya.kartuTerpilih,

                      pressed && gaya.tombolDitekan,
                    ]}
                  >
                    <View>
                      <Text style={gaya.namaService}>{layanan.nama}</Text>

                      <Text style={gaya.hargaService}>
                        {formatRupiah(layanan.harga)}
                      </Text>
                    </View>

                    {terpilih ? (
                      <Text style={gaya.tandaTerpilih}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={tanganiTambahService}
              disabled={!idLayananBaru || sedangAksi}
              style={({ pressed }) => [
                gaya.tombolTambahService,

                (!idLayananBaru || sedangAksi) && gaya.tombolTidakAktif,

                pressed &&
                  idLayananBaru !== null &&
                  !sedangAksi &&
                  gaya.tombolDitekan,
              ]}
            >
              <Text style={gaya.teksTombol}>Tambah Service</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Ringkasan</Text>

          <View style={gaya.kartuRingkasan}>
            <View style={gaya.barisRingkasan}>
              <Text style={gaya.labelRingkasan}>Subtotal</Text>

              <Text style={gaya.nilaiRingkasan}>
                {formatRupiah(pesanan.subtotal)}
              </Text>
            </View>

            {pesanan.diskon > 0 ? (
              <>
                <View style={gaya.pemisah} />

                <View style={gaya.barisRingkasan}>
                  <Text style={gaya.labelDiscount}>
                    Member Discount {pesanan.discountPercent}%
                  </Text>

                  <Text style={gaya.nilaiDiscount}>
                    -{formatRupiah(pesanan.diskon)}
                  </Text>
                </View>
              </>
            ) : null}

            <View style={gaya.pemisah} />

            <View style={gaya.barisTotal}>
              <Text style={gaya.labelTotal}>Total</Text>

              <Text style={gaya.nilaiTotal}>{formatRupiah(pesanan.total)}</Text>
            </View>
          </View>
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Metode Payment</Text>

          <View style={gaya.areaMetode}>
            {daftarMetode.map((item) => {
              const terpilih = metode === item.nilai;

              return (
                <Pressable
                  key={item.nilai}
                  onPress={() => {
                    aturMetode(item.nilai);

                    if (item.nilai !== "CASH") {
                      aturNominalCepatTerpilih(null);
                    }
                  }}
                  style={({ pressed }) => [
                    gaya.tombolMetode,

                    terpilih && gaya.metodeTerpilih,

                    pressed && gaya.tombolDitekan,
                  ]}
                >
                  <Text
                    style={[
                      gaya.teksMetode,

                      terpilih && gaya.teksMetodeTerpilih,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {metode === "CASH" ? (
            <View style={gaya.areaNominalCepat}>
              <Text style={gaya.labelNominalCepat}>Nominal Cepat</Text>

              <View style={gaya.daftarNominalCepat}>
                {daftarNominalCepat.map((item) => {
                  const terpilih = nominalCepatTerpilih === item.nilai;

                  return (
                    <Pressable
                      key={item.nilai}
                      onPress={() => tanganiNominalCepat(item.nilai)}
                      style={({ pressed }) => [
                        gaya.tombolNominalCepat,

                        terpilih && gaya.nominalCepatTerpilih,

                        pressed && gaya.tombolDitekan,
                      ]}
                    >
                      <Text
                        style={[
                          gaya.teksNominalCepat,

                          terpilih && gaya.teksNominalCepatTerpilih,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={() => tanganiNominalCepat("PAS")}
                  style={({ pressed }) => [
                    gaya.tombolNominalCepat,

                    gaya.tombolUangPas,

                    nominalCepatTerpilih === "PAS" && gaya.nominalCepatTerpilih,

                    pressed && gaya.tombolDitekan,
                  ]}
                >
                  <Text
                    style={[
                      gaya.teksNominalCepat,

                      nominalCepatTerpilih === "PAS" &&
                        gaya.teksNominalCepatTerpilih,
                    ]}
                  >
                    Uang Pas · {formatRupiah(pesanan.total)}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Jumlah Diterima</Text>

          <TextInput
            value={jumlahDiterima}
            onChangeText={(nilai) => {
              aturNominalCepatTerpilih(null);

              aturJumlahDiterima(hanyaAngka(nilai));
            }}
            keyboardType="numeric"
            placeholder="Masukkan jumlah pembayaran"
            placeholderTextColor="#64748b"
            style={gaya.input}
          />

          <View style={gaya.kartuKembalian}>
            <Text style={gaya.labelKembalian}>Kembalian</Text>

            <Text style={gaya.nilaiKembalian}>{formatRupiah(kembalian)}</Text>
          </View>
        </View>

        <View style={gaya.bagian}>
          <Text style={gaya.judulBagian}>Catatan Payment</Text>

          <TextInput
            value={catatan}
            onChangeText={aturCatatan}
            multiline
            maxLength={500}
            placeholder="Catatan (opsional)"
            placeholderTextColor="#64748b"
            textAlignVertical="top"
            style={[gaya.input, gaya.inputCatatan]}
          />
        </View>

        <Pressable
          onPress={tanganiPayment}
          disabled={!paymentValid || sedangAksi}
          style={({ pressed }) => [
            gaya.tombolBayar,

            (!paymentValid || sedangAksi) && gaya.tombolTidakAktif,

            pressed && paymentValid && !sedangAksi && gaya.tombolDitekan,
          ]}
        >
          <Text style={gaya.teksTombol}>
            {sedangAksi
              ? "Memproses..."
              : `Bayar ${formatRupiah(pesanan.total)}`}
          </Text>
        </Pressable>
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
    marginBottom: 26,
  },

  nomorPesanan: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#818cf8",
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

  bagian: {
    marginBottom: 28,
  },

  judulBagian: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  daftarService: {
    gap: 10,
  },

  kartuService: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    backgroundColor: "#1e293b",
  },

  barisServiceAtas: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  informasiService: {
    flex: 1,
    marginRight: 12,
  },

  namaService: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  hargaService: {
    marginTop: 5,
    fontSize: 12,
    color: "#94a3b8",
  },

  subtotalService: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  areaAksiItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },

  pengaturJumlah: {
    flexDirection: "row",
    alignItems: "center",
  },

  tombolJumlah: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#4f46e5",
  },

  teksJumlah: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },

  nilaiJumlah: {
    minWidth: 42,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    color: "#ffffff",
  },

  tombolHapus: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 9,
  },

  teksHapus: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f87171",
  },

  daftarLayanan: {
    gap: 8,
  },

  kartuLayanan: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    backgroundColor: "#1e293b",
  },

  kartuTerpilih: {
    borderColor: "#6366f1",
    backgroundColor: "#25294a",
  },

  tandaTerpilih: {
    fontSize: 16,
    fontWeight: "800",
    color: "#818cf8",
  },

  tombolTambahService: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
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
    fontSize: 13,
    fontWeight: "600",
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
    justifyContent: "space-between",
    paddingVertical: 18,
  },

  labelTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  nilaiTotal: {
    fontSize: 21,
    fontWeight: "800",
    color: "#ffffff",
  },

  areaMetode: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  areaNominalCepat: {
    marginTop: 18,
  },

  labelNominalCepat: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#cbd5e1",
  },

  daftarNominalCepat: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tombolNominalCepat: {
    flexGrow: 1,
    minWidth: "22%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    backgroundColor: "#1e293b",
  },

  tombolUangPas: {
    flexBasis: "100%",
  },

  nominalCepatTerpilih: {
    borderColor: "#6366f1",
    backgroundColor: "#312e81",
  },

  teksNominalCepat: {
    fontSize: 13,
    fontWeight: "700",
    color: "#cbd5e1",
  },

  teksNominalCepatTerpilih: {
    color: "#ffffff",
  },

  tombolMetode: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    backgroundColor: "#1e293b",
  },

  metodeTerpilih: {
    borderColor: "#6366f1",
    backgroundColor: "#312e81",
  },

  teksMetode: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
  },

  teksMetodeTerpilih: {
    color: "#ffffff",
  },

  input: {
    minHeight: 50,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    fontSize: 15,
    color: "#ffffff",
    backgroundColor: "#1e293b",
  },

  inputCatatan: {
    height: 100,
    paddingTop: 14,
    paddingBottom: 14,
  },

  kartuKembalian: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#052e2b",
  },

  labelKembalian: {
    fontSize: 13,
    color: "#a7f3d0",
  },

  nilaiKembalian: {
    fontSize: 19,
    fontWeight: "800",
    color: "#6ee7b7",
  },

  tombolBayar: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#059669",
  },

  tombolTidakAktif: {
    opacity: 0.4,
  },

  tombolDitekan: {
    opacity: 0.8,
  },

  teksTombol: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  kartuKesalahan: {
    marginBottom: 22,
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

  dataTidakDitemukan: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  judulDataTidakDitemukan: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },

  judulPaymentSelesai: {
    fontSize: 18,
    fontWeight: "700",
    color: "#34d399",
  },

  deskripsiDataTidakDitemukan: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#94a3b8",
  },
});
