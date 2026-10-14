import * as SecureStore from "expo-secure-store";

const KUNCI_TOKEN = "barber_barbar_token";
let antrian:Promise<unknown>=Promise.resolve();
const antre=<T>(kerja:()=>Promise<T>)=>{const hasil=antrian.then(kerja);antrian=hasil.catch(()=>{});return hasil;};

export const simpanToken = async (token: string) => {
  await antre(()=>SecureStore.setItemAsync(KUNCI_TOKEN, token));
};

export const ambilToken = async () => {
  return antre(()=>SecureStore.getItemAsync(KUNCI_TOKEN));
};

export const hapusToken = async () => {
  await antre(()=>SecureStore.deleteItemAsync(KUNCI_TOKEN));
};
export const hapusTokenJikaSama=(token:string)=>antre(async()=>{
  if(await SecureStore.getItemAsync(KUNCI_TOKEN)!==token)return false;
  await SecureStore.deleteItemAsync(KUNCI_TOKEN);return true;
});
