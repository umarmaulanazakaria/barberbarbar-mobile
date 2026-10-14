import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LayarBooking from "../layar/LayarBooking";
import LayarDetailBooking from "../layar/LayarDetailBooking";
export type DaftarRuteBooking={DaftarBooking:undefined;DetailBooking:{idBooking:number}};
const Stack=createNativeStackNavigator<DaftarRuteBooking>();
export default function NavigasiBooking(){return <Stack.Navigator screenOptions={{headerShown:false}}><Stack.Screen name="DaftarBooking" component={LayarBooking}/><Stack.Screen name="DetailBooking" component={LayarDetailBooking}/></Stack.Navigator>;}
