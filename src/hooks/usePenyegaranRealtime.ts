import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { langgananRealtime, type TopikRealtime } from "../layanan/sinyalRealtime";
export function usePenyegaranRealtime(topik: TopikRealtime[], muat: () => void | Promise<void>) {
 const kunci=topik.join(",");
 useFocusEffect(useCallback(()=>langgananRealtime(kunci.split(",") as TopikRealtime[],muat),[kunci,muat]));
}
