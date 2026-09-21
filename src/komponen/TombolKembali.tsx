import { Pressable, StyleSheet, Text, View } from "react-native";

type PropertiTombolKembali = {
  onPress: () => void;
  label?: string;
};

export default function TombolKembali({
  onPress,
  label = "Kembali",
}: PropertiTombolKembali) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [gaya.tombol, pressed && gaya.tombolDitekan]}
    >
      <View style={gaya.areaIkon}>
        <Text style={gaya.ikon}>‹</Text>
      </View>

      <Text style={gaya.label}>{label}</Text>
    </Pressable>
  );
}

const gaya = StyleSheet.create({
  tombol: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  tombolDitekan: {
    opacity: 0.65,
  },

  areaIkon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    backgroundColor: "#1e293b",
  },

  ikon: {
    marginTop: -2,
    fontSize: 28,
    fontWeight: "300",
    color: "#ffffff",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#cbd5e1",
  },
});
