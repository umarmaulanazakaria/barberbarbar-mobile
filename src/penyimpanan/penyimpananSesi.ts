import * as SecureStore from "expo-secure-store";

const KUNCI_TOKEN = "barber_barbar_token";

export const simpanToken = async (token: string) => {
  await SecureStore.setItemAsync(KUNCI_TOKEN, token);
};

export const ambilToken = async () => {
  return SecureStore.getItemAsync(KUNCI_TOKEN);
};

export const hapusToken = async () => {
  await SecureStore.deleteItemAsync(KUNCI_TOKEN);
};
