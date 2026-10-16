import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { AppState } from "react-native";
import { hariOperasional } from "../layanan/operasionalTerpadu";

// Jam hanya mengatur penyajian; izin tindakan tetap diverifikasi backend.
export function useWaktuOperasional(saatGantiHari: () => void | Promise<void>) {
  const [sekarang, aturSekarang] = useState(Date.now);
  const panggil = useRef(saatGantiHari);
  panggil.current = saatGantiHari;
  const hari = useRef(hariOperasional().mulai);
  useFocusEffect(useCallback(() => {
    const perbarui = () => {
      const waktu = Date.now(), mulai = hariOperasional(waktu).mulai;
      aturSekarang(waktu);
      if (mulai !== hari.current) {
        hari.current = mulai;
        void panggil.current();
      }
    };
    perbarui();
    const interval = setInterval(perbarui, 1000);
    const langganan = AppState.addEventListener("change", status => { if (status === "active") perbarui(); });
    return () => { clearInterval(interval); langganan.remove(); };
  }, []));
  return sekarang;
}
