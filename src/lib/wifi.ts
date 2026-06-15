import type { ToqySite } from "./types";

export function createWifiQrValue(wifi: ToqySite["wifi"]) {
  const type = wifi.encryption === "nopass" ? "nopass" : wifi.encryption || "WPA";
  const password = type === "nopass" ? "" : wifi.password;
  return `WIFI:T:${type};S:${wifi.ssid};P:${password};H:false;;`;
}
