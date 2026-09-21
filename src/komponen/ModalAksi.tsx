import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type VariasiTombolModal = "utama" | "bahaya";

export type KonfigurasiModalAksi = {
  judul: string;
  pesan: string;
  teksTombolUtama: string;
  saatTombolUtama: () => void;
  teksTombolKedua?: string;
  saatTombolKedua?: () => void;
  variasiTombolUtama?: VariasiTombolModal;
  bisaTutupDenganBackdrop?: boolean;
};

type PropertiModalAksi = {
  konfigurasi: KonfigurasiModalAksi | null;
  onTutup: () => void;
};

export default function ModalAksi({ konfigurasi, onTutup }: PropertiModalAksi) {
  const tampil = konfigurasi !== null;

  const bolehTutup = konfigurasi?.bisaTutupDenganBackdrop ?? true;

  const variasiTombolUtama = konfigurasi?.variasiTombolUtama ?? "utama";

  if (!konfigurasi) {
    return null;
  }

  const tanganiTombolUtama = () => {
    onTutup();
    konfigurasi.saatTombolUtama();
  };

  const tanganiTombolKedua = () => {
    onTutup();
    konfigurasi.saatTombolKedua?.();
  };

  return (
    <Modal
      visible={tampil}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (bolehTutup) {
          onTutup();
        }
      }}
    >
      <View style={gaya.overlay}>
        {bolehTutup ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={onTutup} />
        ) : null}

        <View style={gaya.kartu}>
          <Text style={gaya.judul}>{konfigurasi.judul}</Text>

          <Text style={gaya.pesan}>{konfigurasi.pesan}</Text>

          <View style={gaya.areaTombol}>
            {konfigurasi.teksTombolKedua ? (
              <Pressable
                onPress={tanganiTombolKedua}
                style={({ pressed }) => [
                  gaya.tombolSekunder,
                  pressed && gaya.tombolDitekan,
                ]}
              >
                <Text style={gaya.teksTombolSekunder}>
                  {konfigurasi.teksTombolKedua}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={tanganiTombolUtama}
              style={({ pressed }) => [
                gaya.tombolUtama,
                variasiTombolUtama === "bahaya" && gaya.tombolBahaya,
                pressed && gaya.tombolDitekan,
              ]}
            >
              <Text style={gaya.teksTombolUtama}>
                {konfigurasi.teksTombolUtama}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const gaya = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
  },

  kartu: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 20,
    backgroundColor: "#1e293b",
  },

  judul: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },

  pesan: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#cbd5e1",
  },

  areaTombol: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    marginTop: 22,
  },

  tombolSekunder: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 10,
    borderRadius: 12,
    backgroundColor: "transparent",
  },

  teksTombolSekunder: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
  },

  tombolUtama: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 10,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
  },

  tombolBahaya: {
    backgroundColor: "#7f1d1d",
  },

  teksTombolUtama: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  tombolDitekan: {
    opacity: 0.85,
  },
});
