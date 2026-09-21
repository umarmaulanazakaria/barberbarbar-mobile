import { useCallback, useState } from "react";

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import type { RouteProp } from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import TombolKembali from "../komponen/TombolKembali";

import ModalAksi from "../komponen/ModalAksi";

import type { KonfigurasiModalAksi } from "../komponen/ModalAksi";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

import {
  ambilPesananBerdasarkanId,
  ubahStatusPesanan,
} from "../layanan/pesanan";

import type { Layanan } from "../tipe/layanan";

import type { Pesanan, StatusPesanan } from "../tipe/pesanan";

import type { DaftarRutePesanan } from "../navigasi/NavigasiPesanan";

type RuteDetailPesanan = RouteProp<DaftarRutePesanan, "DetailPesanan">;

type NavigasiDetailPesanan = NativeStackNavigationProp<
  DaftarRutePesanan,
  "DetailPesanan"
>;

const formatRupiah = (nilai: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
};

const formatTanggal = (nilai: string) => {
  return new Date(nilai).toLocaleString("id-ID");
};

const ambilLabelStatus = (status: StatusPesanan) => {
  if (status === "WAITING") {
    return "Menunggu";
  }

  if (status === "IN_SERVICE") {
    return "Dilayani";
  }

  if (status === "COMPLETED") {
    return "Selesai";
  }

  return "Dibatalkan";
};

export default function LayarDetailPesanan() {
  const rute = useRoute<RuteDetailPesanan>();

  const navigasi = useNavigation<NavigasiDetailPesanan>();

  const { idPesanan } = rute.params;

  const [pesanan, aturPesanan] = useState<Pesanan | null>(null);

  const [daftarLayanan, aturDaftarLayanan] = useState<Layanan[]>([]);

  const [idLayananBaru, aturIdLayananBaru] = useState<number | null>(null);

  const [sedangMemuat, aturSedangMemuat] = useState(true);

  const [sedangMengubahStatus, aturSedangMengubahStatus] = useState(false);

  const [sedangAksiItem, aturSedangAksiItem] = useState(false);

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

      aturDaftarLayanan(dataLayanan.filter((layanan) => layanan.aktif));
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

  const prosesUbahStatus = async (status: StatusPesanan) => {
    if (sedangMengubahStatus) {
      return;
    }

    try {
      aturSedangMengubahStatus(true);

      aturPesanKesalahan("");

      await ubahStatusPesanan(idPesanan, status);

      await muatData();
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangMengubahStatus(false);
    }
  };

  const jalankanAksiItem = async (aksi: () => Promise<unknown>) => {
    if (sedangAksiItem) {
      return;
    }

    try {
      aturSedangAksiItem(true);

      aturPesanKesalahan("");

      await aksi();

      await muatData();
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangAksiItem(false);
    }
  };

  const tanganiTambahService = () => {
    if (!pesanan || idLayananBaru === null) {
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
    if (!pesanan) {
      return;
    }

    if (pesanan.items.length <= 1) {
      aturKonfigurasiModal({
        judul: "Service Tidak Dapat Dihapus",
        pesan: "Order harus memiliki minimal satu Service.",
        teksTombolUtama: "OK",
        saatTombolUtama: () => {},
      });

      return;
    }

    aturKonfigurasiModal({
      judul: "Hapus Service",
      pesan: `Hapus ${namaLayanan} dari Order ini?`,
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

  const tanganiMulaiService = () => {
    aturKonfigurasiModal({
      judul: "Mulai Service",
      pesan: "Ubah status Order menjadi sedang dilayani?",
      teksTombolUtama: "Mulai",
      saatTombolUtama: () => {
        void prosesUbahStatus("IN_SERVICE");
      },
      teksTombolKedua: "Batal",
    });
  };

  const tanganiSelesaikanService = () => {
    aturKonfigurasiModal({
      judul: "Selesaikan Service",
      pesan: "Tandai seluruh Service pada Order ini sebagai selesai?",
      teksTombolUtama: "Selesaikan",
      saatTombolUtama: () => {
        void prosesUbahStatus("COMPLETED");
      },
      teksTombolKedua: "Batal",
    });
  };

  const tanganiBatalkanOrder = () => {
    aturKonfigurasiModal({
      judul: "Batalkan Order",
      pesan: "Order yang dibatalkan tidak dapat dilanjutkan kembali.",
      teksTombolUtama: "Batalkan Order",
      saatTombolUtama: () => {
        void prosesUbahStatus("CANCELLED");
      },
      teksTombolKedua: "Kembali",
      variasiTombolUtama: "bahaya",
    });
  };

  const tanganiPayment = () => {
    navigasi.navigate("PaymentPesanan", {
      idPesanan,
    });
  };

  if (sedangMemuat) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.loading}>
          <ActivityIndicator size="large" color="#818cf8" />

          <Text style={gaya.teksLoading}>Memuat Detail Order...</Text>
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

  const bolehEditItem =
    pesanan.statusPembayaran === "UNPAID" &&
    (pesanan.status === "WAITING" ||
      pesanan.status === "IN_SERVICE" ||
      pesanan.status === "COMPLETED");

  const layananTersedia = daftarLayanan.filter(
    (layanan) => !pesanan.items.some((item) => item.layananId === layanan.id),
  );

  return (
    <SafeAreaView style={gaya.areaAman}>
      <ScrollView
        contentContainerStyle={gaya.konten}
        showsVerticalScrollIndicator={false}
      >
        <TombolKembali onPress={() => navigasi.goBack()} />
        <View style={gaya.kepala}>
          <Text style={gaya.nomorPesanan}>{pesanan.nomorPesanan}</Text>

          <Text style={gaya.judul}>Detail Order</Text>

          <Text style={gaya.deskripsi}>
            {formatTanggal(pesanan.checkInTime)}
          </Text>
        </View>

        {pesanKesalahan ? (
          <View style={gaya.kartuKesalahan}>
            <Text style={gaya.teksKesalahan}>{pesanKesalahan}</Text>
          </View>
        ) : null}

        <View style={gaya.kartuUtama}>
          <View style={gaya.barisStatus}>
            <View>
              <Text style={gaya.labelKecil}>Status Order</Text>

              <Text style={gaya.nilaiStatus}>
                {ambilLabelStatus(pesanan.status)}
              </Text>
            </View>

            <View style={gaya.statusPayment}>
              <Text style={gaya.labelKecil}>Payment</Text>

              <Text
                style={[
                  gaya.nilaiPayment,

                  pesanan.statusPembayaran === "PAID"
                    ? gaya.paymentPaid
                    : gaya.paymentUnpaid,
                ]}
              >
                {pesanan.statusPembayaran}
              </Text>
            </View>
          </View>

          <View style={gaya.pemisah} />

          <View style={gaya.barisInformasi}>
            <Text style={gaya.labelInformasi}>Pelanggan</Text>

            <Text style={gaya.nilaiInformasi}>{pesanan.pelanggan.nama}</Text>
          </View>

          <View style={gaya.barisInformasi}>
            <Text style={gaya.labelInformasi}>Barber</Text>

            <Text style={gaya.nilaiInformasi}>{pesanan.barber.nama}</Text>
          </View>

          <View style={gaya.barisInformasi}>
            <Text style={gaya.labelInformasi}>Catatan</Text>

            <Text style={gaya.nilaiInformasi}>{pesanan.catatan || "-"}</Text>
          </View>
        </View>

        <View style={gaya.bagian}>
          <View style={gaya.kepalaBagian}>
            <Text style={gaya.judulBagian}>Service</Text>

            {bolehEditItem ? (
              <Text style={gaya.labelDapatDiubah}>Dapat diubah</Text>
            ) : null}
          </View>

          <View style={gaya.daftarService}>
            {pesanan.items.map((item) => (
              <View key={item.id} style={gaya.kartuService}>
                <View style={gaya.barisService}>
                  <View style={gaya.informasiService}>
                    <Text style={gaya.namaService}>{item.namaLayanan}</Text>

                    <Text style={gaya.detailService}>
                      {formatRupiah(item.harga)} / item
                      {" • "}
                      {item.durasiMenit} menit
                    </Text>
                  </View>

                  <Text style={gaya.totalService}>
                    {formatRupiah(item.subtotal)}
                  </Text>
                </View>

                {bolehEditItem ? (
                  <View style={gaya.areaAksiItem}>
                    <View style={gaya.pengaturJumlah}>
                      <Pressable
                        onPress={() => tanganiUbahQty(item.id, item.qty - 1)}
                        disabled={sedangAksiItem || item.qty <= 1}
                        style={[
                          gaya.tombolJumlah,

                          (sedangAksiItem || item.qty <= 1) &&
                            gaya.tombolTidakAktif,
                        ]}
                      >
                        <Text style={gaya.teksJumlah}>−</Text>
                      </Pressable>

                      <Text style={gaya.nilaiJumlah}>{item.qty}</Text>

                      <Pressable
                        onPress={() => tanganiUbahQty(item.id, item.qty + 1)}
                        disabled={sedangAksiItem || item.qty >= 20}
                        style={[
                          gaya.tombolJumlah,

                          (sedangAksiItem || item.qty >= 20) &&
                            gaya.tombolTidakAktif,
                        ]}
                      >
                        <Text style={gaya.teksJumlah}>+</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() =>
                        tanganiHapusItem(item.id, item.namaLayanan)
                      }
                      disabled={sedangAksiItem || pesanan.items.length <= 1}
                      style={[
                        gaya.tombolHapus,

                        (sedangAksiItem || pesanan.items.length <= 1) &&
                          gaya.tombolTidakAktif,
                      ]}
                    >
                      <Text style={gaya.teksHapus}>Hapus</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={gaya.qtyReadonly}>Qty: {item.qty}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {bolehEditItem && layananTersedia.length > 0 ? (
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

                      terpilih && gaya.kartuLayananTerpilih,

                      pressed && gaya.tombolDitekan,
                    ]}
                  >
                    <View style={gaya.informasiLayanan}>
                      <Text style={gaya.namaService}>{layanan.nama}</Text>

                      <Text style={gaya.detailService}>
                        {formatRupiah(layanan.harga)}
                        {" • "}
                        {layanan.durasiMenit} menit
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
              disabled={idLayananBaru === null || sedangAksiItem}
              style={({ pressed }) => [
                gaya.tombolTambahService,

                (idLayananBaru === null || sedangAksiItem) &&
                  gaya.tombolTidakAktif,

                pressed &&
                  idLayananBaru !== null &&
                  !sedangAksiItem &&
                  gaya.tombolDitekan,
              ]}
            >
              <Text style={gaya.teksTombol}>
                {sedangAksiItem ? "Memproses..." : "Tambah Service"}
              </Text>
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

        {pesanan.status === "WAITING" ? (
          <>
            <Pressable
              onPress={tanganiMulaiService}
              disabled={sedangMengubahStatus || sedangAksiItem}
              style={({ pressed }) => [
                gaya.tombolUtama,

                (sedangMengubahStatus || sedangAksiItem) &&
                  gaya.tombolTidakAktif,

                pressed &&
                  !sedangMengubahStatus &&
                  !sedangAksiItem &&
                  gaya.tombolDitekan,
              ]}
            >
              <Text style={gaya.teksTombol}>
                {sedangMengubahStatus ? "Memproses..." : "Mulai Service"}
              </Text>
            </Pressable>

            <Pressable
              onPress={tanganiBatalkanOrder}
              disabled={sedangMengubahStatus || sedangAksiItem}
              style={({ pressed }) => [
                gaya.tombolBatalkan,

                (sedangMengubahStatus || sedangAksiItem) &&
                  gaya.tombolTidakAktif,

                pressed &&
                  !sedangMengubahStatus &&
                  !sedangAksiItem &&
                  gaya.tombolDitekan,
              ]}
            >
              <Text style={gaya.teksBatalkan}>Batalkan Order</Text>
            </Pressable>
          </>
        ) : null}

        {pesanan.status === "IN_SERVICE" ? (
          <>
            <Pressable
              onPress={tanganiSelesaikanService}
              disabled={sedangMengubahStatus || sedangAksiItem}
              style={({ pressed }) => [
                gaya.tombolUtama,

                (sedangMengubahStatus || sedangAksiItem) &&
                  gaya.tombolTidakAktif,

                pressed &&
                  !sedangMengubahStatus &&
                  !sedangAksiItem &&
                  gaya.tombolDitekan,
              ]}
            >
              <Text style={gaya.teksTombol}>
                {sedangMengubahStatus ? "Memproses..." : "Selesaikan Service"}
              </Text>
            </Pressable>

            <Pressable
              onPress={tanganiBatalkanOrder}
              disabled={sedangMengubahStatus || sedangAksiItem}
              style={({ pressed }) => [
                gaya.tombolBatalkan,

                (sedangMengubahStatus || sedangAksiItem) &&
                  gaya.tombolTidakAktif,

                pressed &&
                  !sedangMengubahStatus &&
                  !sedangAksiItem &&
                  gaya.tombolDitekan,
              ]}
            >
              <Text style={gaya.teksBatalkan}>Batalkan Order</Text>
            </Pressable>
          </>
        ) : null}

        {pesanan.status === "COMPLETED" &&
        pesanan.statusPembayaran === "UNPAID" ? (
          <Pressable
            onPress={tanganiPayment}
            disabled={sedangAksiItem}
            style={({ pressed }) => [
              gaya.tombolPayment,

              sedangAksiItem && gaya.tombolTidakAktif,

              pressed && !sedangAksiItem && gaya.tombolDitekan,
            ]}
          >
            <Text style={gaya.teksTombol}>Lanjut ke Payment</Text>
          </Pressable>
        ) : null}

        {pesanan.statusPembayaran === "PAID" ? (
          <View style={gaya.kartuSelesai}>
            <Text style={gaya.judulSelesai}>Payment Selesai</Text>

            <Text style={gaya.deskripsiSelesai}>
              Invoice: {pesanan.pembayaran?.nomorInvoice ?? "-"}
            </Text>
          </View>
        ) : null}

        {pesanan.status === "CANCELLED" ? (
          <View style={gaya.kartuDibatalkan}>
            <Text style={gaya.judulDibatalkan}>Order Dibatalkan</Text>

            <Text style={gaya.deskripsiDibatalkan}>
              Order ini tidak dapat dilanjutkan.
            </Text>
          </View>
        ) : null}

        {pesanan.riwayatStatus.length > 0 ? (
          <View style={gaya.bagian}>
            <Text style={gaya.judulBagian}>Riwayat Status</Text>

            <View style={gaya.kartuRiwayat}>
              {pesanan.riwayatStatus.map((riwayat, index) => (
                <View key={riwayat.id}>
                  <View style={gaya.barisRiwayat}>
                    <View>
                      <Text style={gaya.statusRiwayat}>
                        {ambilLabelStatus(riwayat.status)}
                      </Text>

                      <Text style={gaya.tanggalRiwayat}>
                        {formatTanggal(riwayat.diubahPada)}
                      </Text>
                    </View>

                    <Text style={gaya.penggunaRiwayat}>
                      {riwayat.pengguna?.name ?? "System"}
                    </Text>
                  </View>

                  {index < pesanan.riwayatStatus.length - 1 ? (
                    <View style={gaya.pemisahRiwayat} />
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}
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
    fontSize: 13,
    color: "#94a3b8",
  },

  kartuUtama: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    backgroundColor: "#1e293b",
  },

  barisStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statusPayment: {
    alignItems: "flex-end",
  },

  labelKecil: {
    fontSize: 12,
    color: "#94a3b8",
  },

  nilaiStatus: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  nilaiPayment: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "700",
  },

  paymentPaid: {
    color: "#34d399",
  },

  paymentUnpaid: {
    color: "#fbbf24",
  },

  pemisah: {
    height: 1,
    marginVertical: 16,
    backgroundColor: "#334155",
  },

  barisInformasi: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
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

  bagian: {
    marginTop: 28,
  },

  kepalaBagian: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  judulBagian: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  labelDapatDiubah: {
    marginBottom: 12,
    fontSize: 11,
    fontWeight: "700",
    color: "#818cf8",
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

  barisService: {
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

  detailService: {
    marginTop: 5,
    fontSize: 12,
    color: "#94a3b8",
  },

  totalService: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },

  qtyReadonly: {
    marginTop: 12,
    fontSize: 12,
    color: "#94a3b8",
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

  kartuLayananTerpilih: {
    borderColor: "#6366f1",
    backgroundColor: "#25294a",
  },

  informasiLayanan: {
    flex: 1,
    marginRight: 12,
  },

  tandaTerpilih: {
    fontSize: 18,
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
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },

  tombolUtama: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    borderRadius: 14,
    backgroundColor: "#4f46e5",
  },

  tombolPayment: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    borderRadius: 14,
    backgroundColor: "#059669",
  },

  tombolBatalkan: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 14,
  },

  teksBatalkan: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f87171",
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

  kartuSelesai: {
    marginTop: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#065f46",
    borderRadius: 16,
    backgroundColor: "#052e2b",
  },

  judulSelesai: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6ee7b7",
  },

  deskripsiSelesai: {
    marginTop: 6,
    fontSize: 13,
    color: "#a7f3d0",
  },

  kartuDibatalkan: {
    marginTop: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 16,
    backgroundColor: "#450a0a",
  },

  judulDibatalkan: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fca5a5",
  },

  deskripsiDibatalkan: {
    marginTop: 6,
    fontSize: 13,
    color: "#fecaca",
  },

  kartuRiwayat: {
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    backgroundColor: "#1e293b",
  },

  barisRiwayat: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },

  statusRiwayat: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },

  tanggalRiwayat: {
    marginTop: 4,
    fontSize: 11,
    color: "#64748b",
  },

  penggunaRiwayat: {
    fontSize: 12,
    color: "#94a3b8",
  },

  pemisahRiwayat: {
    height: 1,
    backgroundColor: "#334155",
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

  deskripsiDataTidakDitemukan: {
    marginTop: 8,
    fontSize: 13,
    textAlign: "center",
    color: "#94a3b8",
  },
});
