import { statusRamah } from '../layanan/teks';
import { useCallback, useEffect, useMemo, useState } from "react";

import { Ionicons } from "@expo/vector-icons";

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import type { RouteProp } from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ambilPesanKesalahan } from "../layanan/api";
import { usePenyegaranRealtime } from "../hooks/usePenyegaranRealtime";

import { ambilPesananAktif, ambilSemuaPesanan } from "../layanan/pesanan";

import type { Pesanan, StatusPesanan } from "../tipe/pesanan";

import type { DaftarRutePesanan } from "../navigasi/NavigasiPesanan";

type NavigasiDaftarPesanan = NativeStackNavigationProp<
  DaftarRutePesanan,
  "DaftarPesanan"
>;

type RuteDaftarPesanan = RouteProp<DaftarRutePesanan, "DaftarPesanan">;

type KelompokHistory = {
  kunci: string;
  hari: number;
  bulan: number;
  tahun: number;
  pesanan: Pesanan[];
};

const namaBulan = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const formatRupiah = (nilai: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
};

const ambilLabelStatus = (status: StatusPesanan) => statusRamah(status);
const ambilDaftarService = (pesanan: Pesanan) => {
  return pesanan.items
    .map((item) => `${item.namaLayanan} ×${item.qty}`)
    .join(", ");
};

const duaDigit = (nilai: number) => nilai.toString().padStart(2, "0");

const buatKunciTanggal = (tanggalIso: string) => {
  const tanggal = new Date(tanggalIso);

  return `${tanggal.getFullYear()}-${duaDigit(
    tanggal.getMonth() + 1,
  )}-${duaDigit(tanggal.getDate())}`;
};

const buatKunciHariIni = () => {
  const hariIni = new Date();

  return `${hariIni.getFullYear()}-${duaDigit(
    hariIni.getMonth() + 1,
  )}-${duaDigit(hariIni.getDate())}`;
};

const apakahHariIni = (tanggalIso: string) => {
  return buatKunciTanggal(tanggalIso) === buatKunciHariIni();
};

const formatTanggalPanjang = (hari: number, bulan: number, tahun: number) => {
  return `${hari} ${namaBulan[bulan - 1]} ${tahun}`;
};

const formatInputTanggal = (nilai: string) => {
  const angka = nilai.replace(/\D/g, "").slice(0, 8);

  if (angka.length <= 2) {
    return angka;
  }

  if (angka.length <= 4) {
    return `${angka.slice(0, 2)}/${angka.slice(2)}`;
  }

  return `${angka.slice(0, 2)}/${angka.slice(2, 4)}/${angka.slice(4)}`;
};

const ubahInputTanggalKeKunci = (nilai: string) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(nilai)) {
    return null;
  }

  const [hariTeks, bulanTeks, tahunTeks] = nilai.split("/");

  const hari = Number(hariTeks);
  const bulan = Number(bulanTeks);
  const tahun = Number(tahunTeks);

  const tanggal = new Date(tahun, bulan - 1, hari);

  if (
    tanggal.getFullYear() !== tahun ||
    tanggal.getMonth() !== bulan - 1 ||
    tanggal.getDate() !== hari
  ) {
    return null;
  }

  return `${tahun}-${duaDigit(bulan)}-${duaDigit(hari)}`;
};

export default function LayarPesanan() {
  const navigasi = useNavigation<NavigasiDaftarPesanan>();

  const rute = useRoute<RuteDaftarPesanan>();

  const modeDaftar = rute.params?.mode ?? "history";

  const menampilkanHistory = modeDaftar === "history";
  const menampilkanHariIni = modeDaftar === "hariIni";

  const [daftarPesanan, aturDaftarPesanan] = useState<Pesanan[]>([]);

  const [sedangMemuat, aturSedangMemuat] = useState(true);

  const [sedangRefresh, aturSedangRefresh] = useState(false);

  const [pesanKesalahan, aturPesanKesalahan] = useState("");

  const [tanggalHistoryTerpilih, aturTanggalHistoryTerpilih] = useState<
    string | null
  >(null);

  const [tahunTerpilih, aturTahunTerpilih] = useState(new Date().getFullYear());

  const [bulanTerpilih, aturBulanTerpilih] = useState<number | null>(null);

  const [filterTanggal, aturFilterTanggal] = useState("");

  const [modalBulanTerbuka, aturModalBulanTerbuka] = useState(false);

  useEffect(() => {
    aturDaftarPesanan([]);
    aturPesanKesalahan("");
    aturSedangMemuat(true);
    aturTanggalHistoryTerpilih(null);
  }, [modeDaftar]);

  const muatPesanan = useCallback(async () => {
    try {
      aturPesanKesalahan("");

      const data =
        modeDaftar === "aktif"
          ? await ambilPesananAktif()
          : await ambilSemuaPesanan();

      const dataDitampilkan = menampilkanHariIni
        ? data.filter((pesanan) => apakahHariIni(pesanan.dibuatPada))
        : data;

      aturDaftarPesanan(dataDitampilkan);
    } catch (error) {
      aturPesanKesalahan(ambilPesanKesalahan(error));
    } finally {
      aturSedangMemuat(false);
      aturSedangRefresh(false);
    }
  }, [modeDaftar, menampilkanHariIni]);

  usePenyegaranRealtime(["pesanan","booking","pembayaran","pelanggan"],muatPesanan);
  useFocusEffect(
    useCallback(() => {
      void muatPesanan();
    }, [muatPesanan]),
  );

  const kelompokHistory = useMemo(() => {
    const kelompok = new Map<string, KelompokHistory>();
    const hariIni = buatKunciHariIni();

    daftarPesanan.forEach((pesanan) => {
      const tanggal = new Date(pesanan.dibuatPada);
      const kunci = buatKunciTanggal(pesanan.dibuatPada);

      if (kunci === hariIni) {
        return;
      }

      const dataKelompok = kelompok.get(kunci);

      if (dataKelompok) {
        dataKelompok.pesanan.push(pesanan);
        return;
      }

      kelompok.set(kunci, {
        kunci,
        hari: tanggal.getDate(),
        bulan: tanggal.getMonth() + 1,
        tahun: tanggal.getFullYear(),
        pesanan: [pesanan],
      });
    });

    return Array.from(kelompok.values())
      .map((item) => ({
        ...item,

        pesanan: [...item.pesanan].sort(
          (a, b) =>
            new Date(b.dibuatPada).getTime() - new Date(a.dibuatPada).getTime(),
        ),
      }))
      .sort((a, b) => b.kunci.localeCompare(a.kunci));
  }, [daftarPesanan]);

  const daftarTahun = useMemo(() => {
    const tahun = new Set<number>();

    tahun.add(new Date().getFullYear());

    kelompokHistory.forEach((item) => {
      tahun.add(item.tahun);
    });

    return Array.from(tahun).sort((a, b) => b - a);
  }, [kelompokHistory]);

  useEffect(() => {
    if (!menampilkanHistory) {
      return;
    }

    if (!daftarTahun.includes(tahunTerpilih)) {
      aturTahunTerpilih(daftarTahun[0] ?? new Date().getFullYear());
    }
  }, [daftarTahun, menampilkanHistory, tahunTerpilih]);

  const kunciFilterTanggal = useMemo(() => {
    return ubahInputTanggalKeKunci(filterTanggal);
  }, [filterTanggal]);

  const filterTanggalLengkap = filterTanggal.length === 10;

  const filterTanggalTidakValid =
    filterTanggalLengkap && kunciFilterTanggal === null;

  const kelompokHistoryTerfilter = useMemo(() => {
    if (filterTanggalLengkap) {
      if (!kunciFilterTanggal) {
        return [];
      }

      return kelompokHistory.filter(
        (item) => item.kunci === kunciFilterTanggal,
      );
    }

    return kelompokHistory.filter((item) => {
      const cocokTahun = item.tahun === tahunTerpilih;

      const cocokBulan = bulanTerpilih === null || item.bulan === bulanTerpilih;

      return cocokTahun && cocokBulan;
    });
  }, [
    bulanTerpilih,
    filterTanggalLengkap,
    kelompokHistory,
    kunciFilterTanggal,
    tahunTerpilih,
  ]);

  const kelompokTerpilih = useMemo(() => {
    if (!tanggalHistoryTerpilih) {
      return null;
    }

    return (
      kelompokHistory.find((item) => item.kunci === tanggalHistoryTerpilih) ??
      null
    );
  }, [kelompokHistory, tanggalHistoryTerpilih]);

  const tanganiRefresh = () => {
    aturSedangRefresh(true);

    void muatPesanan();
  };

  const tanganiCobaLagi = () => {
    aturSedangMemuat(true);

    void muatPesanan();
  };

  const tanganiBuatPesanan = () => {
    navigasi.navigate("BuatPesanan");
  };

  const tanganiPilihPesanan = (pesanan: Pesanan) => {
    navigasi.navigate("DetailPesanan", {
      idPesanan: pesanan.id,
    });
  };

  const tanganiResetFilter = () => {
    aturTahunTerpilih(new Date().getFullYear());

    aturBulanTerpilih(null);

    aturFilterTanggal("");
  };

  const renderPesanan = ({ item }: { item: Pesanan }) => {
    return (
      <Pressable
        onPress={() => tanganiPilihPesanan(item)}
        style={({ pressed }) => [
          gaya.kartuPesanan,
          pressed && gaya.kartuDitekan,
        ]}
      >
        <View style={gaya.barisAtas}>
          <Text style={gaya.nomorPesanan}>{item.nomorPesanan}</Text>

          <View
            style={[
              gaya.badgeStatus,

              item.status === "WAITING" && gaya.badgeMenunggu,

              item.status === "IN_SERVICE" && gaya.badgeDilayani,

              item.status === "COMPLETED" && gaya.badgeSelesai,

              item.status === "CANCELLED" && gaya.badgeDibatalkan,
            ]}
          >
            <Text style={gaya.teksBadge}>{ambilLabelStatus(item.status)}</Text>
          </View>
        </View>

        <Text style={gaya.namaPelanggan}>{item.pelanggan.nama}</Text>

        <Text style={gaya.informasi}>
          Barber: {item.barber?.nama ?? "Belum ditentukan"}
        </Text>

        <Text style={gaya.informasi}>Layanan: {ambilDaftarService(item)}</Text>

        <View style={gaya.barisPembayaran}>
          <Text style={gaya.labelPembayaran}>Pembayaran</Text>

          <Text
            style={[
              gaya.statusPembayaran,

              item.statusPembayaran === "PAID"
                ? gaya.statusPaid
                : gaya.statusUnpaid,
            ]}
          >
            {item.statusPembayaran}
          </Text>
        </View>

        <View style={gaya.pemisah} />

        <View style={gaya.barisTotal}>
          <Text style={gaya.labelTotal}>Total</Text>

          <Text style={gaya.nilaiTotal}>{formatRupiah(item.total)}</Text>
        </View>
      </Pressable>
    );
  };

  const renderKartuTanggal = ({ item }: { item: KelompokHistory }) => {
    return (
      <Pressable
        onPress={() => aturTanggalHistoryTerpilih(item.kunci)}
        style={({ pressed }) => [
          gaya.kartuTanggal,
          pressed && gaya.kartuDitekan,
        ]}
      >
        <View style={gaya.ikonDokumen}>
          <Ionicons name="document-text-outline" size={27} color="#94a3b8" />
        </View>

        <Text style={gaya.teksTanggalHistory}>
          {formatTanggalPanjang(item.hari, item.bulan, item.tahun)}
        </Text>

        <Ionicons name="chevron-forward" size={28} color="#818cf8" />
      </Pressable>
    );
  };

  if (sedangMemuat && daftarPesanan.length === 0 && !pesanKesalahan) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.loading}>
          <ActivityIndicator size="large" color="#818cf8" />

          <Text style={gaya.teksLoading}>
            {menampilkanHistory ? "Memuat riwayat pesanan..." : "Memuat pesanan..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (pesanKesalahan && daftarPesanan.length === 0) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <View style={gaya.errorHalaman}>
          <Text style={gaya.judulError}>Pesanan belum dapat dimuat</Text>

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

  if (menampilkanHistory && kelompokTerpilih) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <FlatList
          data={kelompokTerpilih.pesanan}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPesanan}
          contentContainerStyle={gaya.kontenDaftar}
          refreshControl={
            <RefreshControl
              refreshing={sedangRefresh}
              onRefresh={tanganiRefresh}
              tintColor="#818cf8"
            />
          }
          ItemSeparatorComponent={() => <View style={gaya.jarakAntarKartu} />}
          ListHeaderComponent={
            <View style={gaya.kepalaTanggalTerpilih}>
              <Pressable
                onPress={() => aturTanggalHistoryTerpilih(null)}
                style={({ pressed }) => [
                  gaya.tombolKembaliHistory,
                  pressed && gaya.kartuDitekan,
                ]}
              >
                <Ionicons name="chevron-back" size={22} color="#ffffff" />
              </Pressable>

              <View style={gaya.judulTanggalTerpilihWrapper}>
                <Text style={gaya.judulTanggalTerpilih}>
                  {formatTanggalPanjang(
                    kelompokTerpilih.hari,
                    kelompokTerpilih.bulan,
                    kelompokTerpilih.tahun,
                  )}
                </Text>

                <Text style={gaya.deskripsiTanggalTerpilih}>
                  Riwayat pesanan pada tanggal ini.
                </Text>
              </View>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  if (menampilkanHistory) {
    return (
      <SafeAreaView style={gaya.areaAman}>
        <FlatList
          data={kelompokHistoryTerfilter}
          keyExtractor={(item) => item.kunci}
          renderItem={renderKartuTanggal}
          contentContainerStyle={gaya.kontenHistory}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={sedangRefresh}
              onRefresh={tanganiRefresh}
              tintColor="#818cf8"
            />
          }
          ItemSeparatorComponent={() => <View style={gaya.jarakAntarTanggal} />}
          ListHeaderComponent={
            <View>
              <View style={gaya.headerHistory}>
                <Text style={gaya.judulHistory}>Riwayat Pesanan</Text>

                <Text style={gaya.deskripsiHistory}>
                  Riwayat pesanan berdasarkan tanggal sebelumnya.
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

              <Text style={gaya.labelFilter}>Tahun</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={gaya.daftarTahun}
              >
                {daftarTahun.map((tahun) => {
                  const aktif =
                    tahunTerpilih === tahun && !filterTanggalLengkap;

                  return (
                    <Pressable
                      key={tahun}
                      onPress={() => {
                        aturTahunTerpilih(tahun);

                        aturFilterTanggal("");
                      }}
                      style={({ pressed }) => [
                        gaya.chipTahun,
                        aktif && gaya.chipTahunAktif,
                        pressed && gaya.kartuDitekan,
                      ]}
                    >
                      <Text
                        style={[
                          gaya.teksChipTahun,

                          aktif && gaya.teksChipTahunAktif,
                        ]}
                      >
                        {tahun}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={gaya.barisFilter}>
                <Pressable
                  onPress={() => aturModalBulanTerbuka(true)}
                  style={({ pressed }) => [
                    gaya.filterBulan,
                    pressed && gaya.kartuDitekan,
                  ]}
                >
                  <Ionicons name="calendar-outline" size={18} color="#cbd5e1" />

                  <Text style={gaya.teksFilterBulan} numberOfLines={1}>
                    {bulanTerpilih === null
                      ? "Semua Bulan"
                      : namaBulan[bulanTerpilih - 1]}
                  </Text>

                  <Ionicons name="chevron-down" size={17} color="#818cf8" />
                </Pressable>

                <View style={gaya.filterTanggalWrapper}>
                  <Ionicons name="search-outline" size={18} color="#64748b" />

                  <TextInput
                    value={filterTanggal}
                    onChangeText={(nilai) =>
                      aturFilterTanggal(formatInputTanggal(nilai))
                    }
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={10}
                    style={gaya.inputTanggal}
                  />

                  {filterTanggal.length > 0 ? (
                    <Pressable onPress={() => aturFilterTanggal("")}>
                      <Ionicons name="close-circle" size={18} color="#64748b" />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {filterTanggalTidakValid ? (
                <Text style={gaya.teksFilterError}>
                  Tanggal tidak valid. Gunakan format DD/MM/YYYY.
                </Text>
              ) : null}

              {bulanTerpilih !== null || filterTanggal.length > 0 ? (
                <Pressable
                  onPress={tanganiResetFilter}
                  style={gaya.resetFilter}
                >
                  <Ionicons name="refresh-outline" size={16} color="#818cf8" />

                  <Text style={gaya.teksResetFilter}>Reset filter</Text>
                </Pressable>
              ) : null}

              <Text style={gaya.judulDaftarHistory}>Riwayat</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={gaya.dataKosongHistory}>
              <Ionicons
                name="document-text-outline"
                size={38}
                color="#475569"
              />

              <Text style={gaya.judulDataKosong}>Belum ada riwayat pesanan</Text>

              <Text style={gaya.deskripsiDataKosong}>
                Tidak ada pesanan pada periode yang dipilih. Pesanan hari ini dapat dilihat pada daftar hari ini.
              </Text>
            </View>
          }
        />

        <Modal
          visible={modalBulanTerbuka}
          transparent
          animationType="fade"
          onRequestClose={() => aturModalBulanTerbuka(false)}
        >
          <View style={gaya.overlayModal}>
            <Pressable
              style={gaya.areaTutupModal}
              onPress={() => aturModalBulanTerbuka(false)}
            />

            <View style={gaya.modalBulan}>
              <Text style={gaya.judulModal}>Pilih Bulan</Text>

              <Pressable
                onPress={() => {
                  aturBulanTerpilih(null);

                  aturFilterTanggal("");

                  aturModalBulanTerbuka(false);
                }}
                style={({ pressed }) => [
                  gaya.opsiBulan,

                  bulanTerpilih === null && gaya.opsiBulanAktif,

                  pressed && gaya.kartuDitekan,
                ]}
              >
                <Text
                  style={[
                    gaya.teksOpsiBulan,

                    bulanTerpilih === null && gaya.teksOpsiBulanAktif,
                  ]}
                >
                  Semua Bulan
                </Text>
              </Pressable>

              <ScrollView style={gaya.daftarBulanModal}>
                {namaBulan.map((bulan, index) => {
                  const nomorBulan = index + 1;

                  const aktif = bulanTerpilih === nomorBulan;

                  return (
                    <Pressable
                      key={bulan}
                      onPress={() => {
                        aturBulanTerpilih(nomorBulan);

                        aturFilterTanggal("");

                        aturModalBulanTerbuka(false);
                      }}
                      style={({ pressed }) => [
                        gaya.opsiBulan,

                        aktif && gaya.opsiBulanAktif,

                        pressed && gaya.kartuDitekan,
                      ]}
                    >
                      <Text
                        style={[
                          gaya.teksOpsiBulan,

                          aktif && gaya.teksOpsiBulanAktif,
                        ]}
                      >
                        {bulan}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={gaya.areaAman}>
      <FlatList
        data={daftarPesanan}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPesanan}
        contentContainerStyle={gaya.kontenDaftar}
        refreshControl={
          <RefreshControl
            refreshing={sedangRefresh}
            onRefresh={tanganiRefresh}
            tintColor="#818cf8"
          />
        }
        ItemSeparatorComponent={() => <View style={gaya.jarakAntarKartu} />}
        ListHeaderComponent={
          <View style={gaya.kepalaDaftar}>
            <View style={gaya.kepala}>
              <View style={gaya.informasiKepala}>
                <Text style={gaya.judul}>
                  {menampilkanHariIni ? "Pesanan Hari Ini" : "Pesanan Aktif"}
                </Text>

                <Text style={gaya.deskripsi}>
                  {menampilkanHariIni
                    ? "Semua pesanan yang dibuat hari ini."
                    : "Kelola pesanan aktif BARBER BARBAR."}
                </Text>
              </View>

              <Pressable
                onPress={tanganiBuatPesanan}
                style={({ pressed }) => [
                  gaya.tombolBuatOrder,
                  pressed && gaya.kartuDitekan,
                ]}
              >
                <Text style={gaya.simbolTambah}>+</Text>

                <Text style={gaya.teksBuatOrder}>Buat Pesanan</Text>
              </Pressable>
            </View>

            {pesanKesalahan && daftarPesanan.length > 0 ? (
              <View style={gaya.kartuPeringatan}>
                <Text style={gaya.teksPeringatan}>
                  Data terbaru belum dapat dimuat.
                </Text>

                <Text style={gaya.detailPeringatan}>{pesanKesalahan}</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={gaya.dataKosong}>
            <Text style={gaya.judulDataKosong}>
              {menampilkanHariIni
                ? "Belum ada pesanan hari ini"
                : "Belum ada pesanan aktif"}
            </Text>

            <Text style={gaya.deskripsiDataKosong}>
              {menampilkanHariIni
                ? "Pesanan yang dibuat hari ini akan tampil di sini."
                : "Buat pesanan baru untuk memulai transaksi."}
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

  kontenHistory: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },

  kepalaDaftar: {
    marginBottom: 14,
  },

  kepala: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
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

  tombolBuatOrder: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
  },

  simbolTambah: {
    marginRight: 6,
    fontSize: 22,
    fontWeight: "300",
    color: "#ffffff",
  },

  teksBuatOrder: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },

  kartuPesanan: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    backgroundColor: "#1e293b",
  },

  kartuDitekan: {
    opacity: 0.8,
  },

  barisAtas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  nomorPesanan: {
    fontSize: 13,
    fontWeight: "700",
    color: "#818cf8",
  },

  badgeStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  badgeMenunggu: {
    backgroundColor: "#78350f",
  },

  badgeDilayani: {
    backgroundColor: "#312e81",
  },

  badgeSelesai: {
    backgroundColor: "#064e3b",
  },

  badgeDibatalkan: {
    backgroundColor: "#7f1d1d",
  },

  teksBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },

  namaPelanggan: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },

  informasi: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#cbd5e1",
  },

  barisPembayaran: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  labelPembayaran: {
    marginRight: 8,
    fontSize: 12,
    color: "#94a3b8",
  },

  statusPembayaran: {
    fontSize: 11,
    fontWeight: "700",
  },

  statusPaid: {
    color: "#34d399",
  },

  statusUnpaid: {
    color: "#fbbf24",
  },

  pemisah: {
    height: 1,
    marginVertical: 16,
    backgroundColor: "#334155",
  },

  barisTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  labelTotal: {
    fontSize: 13,
    color: "#94a3b8",
  },

  nilaiTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  jarakAntarKartu: {
    height: 12,
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

  dataKosongHistory: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },

  judulDataKosong: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  deskripsiDataKosong: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#64748b",
  },

  headerHistory: {
    alignItems: "center",
    marginBottom: 28,
  },

  judulHistory: {
    fontSize: 27,
    fontWeight: "800",
    color: "#ffffff",
  },

  deskripsiHistory: {
    marginTop: 7,
    fontSize: 13,
    textAlign: "center",
    color: "#94a3b8",
  },

  labelFilter: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
  },

  daftarTahun: {
    gap: 10,
    paddingBottom: 18,
  },

  chipTahun: {
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#6366f1",
    borderRadius: 999,
  },

  chipTahunAktif: {
    backgroundColor: "#4f46e5",
  },

  teksChipTahun: {
    fontSize: 15,
    fontWeight: "700",
    color: "#a5b4fc",
  },

  teksChipTahunAktif: {
    color: "#ffffff",
  },

  barisFilter: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },

  filterBulan: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 13,
    backgroundColor: "#1e293b",
  },

  teksFilterBulan: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#e2e8f0",
  },

  filterTanggalWrapper: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 13,
    backgroundColor: "#1e293b",
  },

  inputTanggal: {
    flex: 1,
    marginLeft: 7,
    paddingVertical: 0,
    fontSize: 12,
    color: "#ffffff",
  },

  teksFilterError: {
    marginTop: 2,
    fontSize: 11,
    color: "#fca5a5",
  },

  resetFilter: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },

  teksResetFilter: {
    fontSize: 12,
    fontWeight: "600",
    color: "#818cf8",
  },

  judulDaftarHistory: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  kartuTanggal: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 16,
    backgroundColor: "#1e293b",
  },

  ikonDokumen: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderRadius: 12,
    backgroundColor: "#172033",
  },

  teksTanggalHistory: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  jarakAntarTanggal: {
    height: 12,
  },

  kepalaTanggalTerpilih: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  tombolKembaliHistory: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    backgroundColor: "#1e293b",
  },

  judulTanggalTerpilihWrapper: {
    flex: 1,
  },

  judulTanggalTerpilih: {
    fontSize: 21,
    fontWeight: "800",
    color: "#ffffff",
  },

  deskripsiTanggalTerpilih: {
    marginTop: 4,
    fontSize: 12,
    color: "#94a3b8",
  },

  overlayModal: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
  },

  areaTutupModal: {
    ...StyleSheet.absoluteFill,
  },

  modalBulan: {
    width: "100%",
    maxHeight: "72%",
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 18,
    backgroundColor: "#0f172a",
  },

  judulModal: {
    marginBottom: 14,
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },

  daftarBulanModal: {
    marginTop: 6,
  },

  opsiBulan: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
    marginBottom: 6,
    borderRadius: 11,
    backgroundColor: "#1e293b",
  },

  opsiBulanAktif: {
    backgroundColor: "#3730a3",
  },

  teksOpsiBulan: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cbd5e1",
  },

  teksOpsiBulanAktif: {
    color: "#ffffff",
  },
});
