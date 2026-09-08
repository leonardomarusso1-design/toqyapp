"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
// Limpeza (2026-09-06, auditoria externa): ChevronLeft e MessageCircle
// saíram do import — nenhum dos dois era renderizado (o carrossel usa
// swipe/scroll e o WhatsApp usa o WhatsAppIcon próprio abaixo).
// ChevronRight VOLTOU no mesmo dia (mockup da auditoria externa): a seta
// à direita dos botões grandes é parte da hierarquia primário/secundário.
import {
  CalendarCheck,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Globe2,
  Image as ImageIcon,
  Images,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Save,
  Share2,
  Star,
  Wifi,
  X,
} from "lucide-react";
import type { BusinessHours, CatalogItem, CatalogLayout, ColorValue, ToqyButton, ToqyLinkType, ToqySite } from "@/lib/types";
import { buttonHref, createVCard, googleMapsExternalUrl, mapsQuery, pixPayload, wazeExternalUrl, whatsappUrl, wifiPayload } from "@/lib/buttonUtils";
import { resolveBodyBlockOrder } from "@/lib/bodyBlocks";
import { ensureUrl, normalizeInstagram } from "@/lib/security";
import { getPlan, resolvePlanTier } from "@/lib/subscriptions";
import { generateSlotsForDay } from "@/lib/bookingSlots";
import { colorSwatch, resolveColorStyle } from "@/lib/colorRoles";
import { analytics, eventTypeForButtonType } from "@/lib/analytics";
import { StickerIcon } from "./StickerIcon";
import { LeadCaptureModal } from "./LeadCaptureForm";
import { bioSiteFontById } from "@/lib/bioSiteFonts";
import { TrackingPixels } from "./TrackingPixels";

// Ícones originais (2026-07-16, pedido do Leonardo) — PNGs próprios em vez
// dos SVGs de marca genéricos abaixo. Mesma assinatura (className) das
// funções antigas de propósito: todos os ~15 call sites deste arquivo
// continuam funcionando sem mudar nada além da definição aqui. Cor fixa do
// PNG (não usa currentColor) — troca a adaptação dinâmica de cor por
// identidade visual própria, que foi o pedido.
const WhatsAppIcon = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/images/icons/whatsapp.png" alt="WhatsApp" className={`${className ?? ""} object-contain`} />
);

const InstagramIcon = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/images/icons/instagram.png" alt="Instagram" className={`${className ?? ""} object-contain`} />
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.84a8.16 8.16 0 004.77 1.52V6.91a4.85 4.85 0 01-1-.22z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/images/icons/facebook.png" alt="Facebook" className={`${className ?? ""} object-contain`} />
);

const PhoneIcon2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.3 2.28a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const MapPinIcon2 = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/images/icons/localizacao.png" alt="Localização" className={`${className ?? ""} object-contain`} />
);

const WifiIcon2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
  </svg>
);

const PixIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.764 2.337a1.8 1.8 0 012.47 0l1.862 1.848a.6.6 0 00.424.174h2.63a1.8 1.8 0 011.746 1.747v2.629a.6.6 0 00.175.424l1.847 1.862a1.8 1.8 0 010 2.47l-1.847 1.862a.6.6 0 00-.175.424v2.629a1.8 1.8 0 01-1.747 1.747h-2.629a.6.6 0 00-.424.175l-1.861 1.847a1.8 1.8 0 01-2.471 0l-1.862-1.847a.6.6 0 00-.424-.175H6.85a1.8 1.8 0 01-1.747-1.747v-2.629a.6.6 0 00-.174-.424L3.08 13.47a1.8 1.8 0 010-2.47l1.848-1.862a.6.6 0 00.174-.424V6.085A1.8 1.8 0 016.85 4.338h2.629a.6.6 0 00.424-.174l1.862-1.847z"/>
  </svg>
);

// Ícones de marca reais (2026-07-16, pedido do Leonardo: "preciso dos
// ícones originais") — path data oficial da Simple Icons (simple-icons.org,
// licença CC0/MIT, livre pra usar logos de marca), mesmo padrão de
// currentColor do TikTokIcon/PixIcon acima — herdam a cor do contexto
// (branco no círculo social, cor do texto do botão grande).
const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

// Selo completo (2026-09-01, achado ao vivo: ícone antigo era só o
// triângulo em currentColor, então dependia de um círculo de fundo
// externo pra ficar com cara de "YouTube" — inconsistente com
// whatsapp/instagram/facebook, que já são o selo pronto, sem fundo
// extra). Fundo vermelho arredondado + triângulo branco embutidos no
// mesmo SVG, igual ícone oficial — não precisa de nenhuma cor externa.
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48">
    <rect x="1" y="9" width="46" height="30" rx="9" fill="#FF0000" />
    <path d="M19 16.5v15l14-7.5-14-7.5z" fill="#fff" />
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

// X (Twitter), Pinterest e Threads — path data oficial da Simple Icons
// (simple-icons.org, CC0), baixado direto do CDN (jsdelivr) em 2026-09-05
// (pedido do Leonardo: "ícones oficiais... cores reais"). currentColor,
// mesmo padrão do TikTok/LinkedIn/Telegram/Spotify acima.
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/>
  </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"/>
  </svg>
);

// iFood, Waze, PicPay, Mercado Pago e Behance — path data oficial da Simple
// Icons, baixado direto do CDN em 2026-09-05 (ICO-01: apps mais relevantes
// pro público real do Toqy — restaurante/delivery, "como chegar" e
// pagamento no Brasil, além de portfólio pra fotógrafos). currentColor,
// mesmo padrão das marcas acima.
const IFoodIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.428 1.67c-4.65 0-7.184 4.149-7.184 6.998 0 2.294 2.2 3.299 4.25 3.299l-.006-.006c4.244 0 7.184-3.854 7.184-6.998 0-2.29-2.175-3.293-4.244-3.293zm11.328 0c-4.65 0-7.184 4.149-7.184 6.998 0 2.294 2.2 3.299 4.25 3.299l-.006-.006C21.061 11.96 24 8.107 24 4.963c0-2.29-2.18-3.293-4.244-3.293zM14.172 14.52l2.435 1.834c-2.17 2.07-6.124 3.525-9.353 3.17A8.913 8.913 0 01.23 14.541H0a9.598 9.598 0 008.828 7.758c3.814.24 7.323-.905 9.947-3.13l-.004.007 1.08 2.988 1.555-7.623-7.234-.02Z"/>
  </svg>
);

const WazeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.218 0C9.915 0 6.835 1.49 4.723 4.148c-1.515 1.913-2.31 4.272-2.31 6.706v1.739c0 .894-.62 1.738-1.862 1.813-.298.025-.547.224-.547.522-.05.82.82 2.31 2.012 3.502.82.844 1.788 1.515 2.832 2.036a3 3 0 0 0 2.955 3.528 2.966 2.966 0 0 0 2.931-2.385h2.509c.323 1.689 2.086 2.856 3.974 2.21 1.64-.546 2.36-2.409 1.763-3.924a12.84 12.84 0 0 0 1.838-1.465 10.73 10.73 0 0 0 3.18-7.65c0-2.882-1.118-5.589-3.155-7.625A10.899 10.899 0 0 0 13.218 0zm0 1.217c2.558 0 4.967.994 6.78 2.807a9.525 9.525 0 0 1 2.807 6.78A9.526 9.526 0 0 1 20 17.585a9.647 9.647 0 0 1-6.78 2.807h-2.46a3.008 3.008 0 0 0-2.93-2.41 3.03 3.03 0 0 0-2.534 1.367v.024a8.945 8.945 0 0 1-2.41-1.788c-.844-.844-1.316-1.614-1.515-2.11a2.858 2.858 0 0 0 1.441-.846 2.959 2.959 0 0 0 .795-2.036v-1.789c0-2.11.696-4.197 2.012-5.861 1.863-2.385 4.62-3.726 7.6-3.726zm-2.41 5.986a1.192 1.192 0 0 0-1.191 1.192 1.192 1.192 0 0 0 1.192 1.193A1.192 1.192 0 0 0 12 8.395a1.192 1.192 0 0 0-1.192-1.192zm7.204 0a1.192 1.192 0 0 0-1.192 1.192 1.192 1.192 0 0 0 1.192 1.193 1.192 1.192 0 0 0 1.192-1.193 1.192 1.192 0 0 0-1.192-1.192zm-7.377 4.769a.596.596 0 0 0-.546.845 4.813 4.813 0 0 0 4.346 2.757 4.77 4.77 0 0 0 4.347-2.757.596.596 0 0 0-.547-.845h-.025a.561.561 0 0 0-.521.348 3.59 3.59 0 0 1-3.254 2.061 3.591 3.591 0 0 1-3.254-2.061.64.64 0 0 0-.546-.348z"/>
  </svg>
);

const PicPayIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.463 1.587v7.537H24V1.587zm1.256 1.256h5.025v5.025h-5.025zm1.256 1.256v2.513h2.513V4.099zM3.77 5.355V8.53h3.376c2.142 0 3.358 1.04 3.358 2.939 0 1.947-1.216 3.011-3.358 3.011H3.769V8.53H0v13.884h3.769v-4.76h3.57c4.333 0 6.815-2.352 6.815-6.32 0-3.771-2.482-5.978-6.814-5.978Z"/>
  </svg>
);

const MercadoPagoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.115 16.479a.93.927 0 0 1-.939-.886c-.002-.042-.006-.155-.103-.155-.04 0-.074.023-.113.059-.112.103-.254.206-.46.206a.816.814 0 0 1-.305-.066c-.535-.214-.542-.578-.521-.725.006-.038.007-.08-.02-.11l-.032-.03h-.034c-.027 0-.055.012-.093.039a.788.786 0 0 1-.454.16.7.699 0 0 1-.253-.05c-.708-.27-.65-.928-.617-1.126.005-.041-.005-.072-.03-.092l-.05-.04-.047.043a.728.726 0 0 1-.505.203.73.728 0 0 1-.732-.725c0-.4.328-.722.732-.722.364 0 .675.27.721.63l.026.195.11-.165c.01-.018.307-.46.852-.46.102 0 .21.016.316.05.434.13.508.52.519.68.008.094.075.1.09.1.037 0 .064-.024.083-.045a.746.744 0 0 1 .54-.225c.128 0 .263.03.402.09.69.293.379 1.158.374 1.167-.058.144-.061.207-.005.244l.027.013h.02c.03 0 .07-.014.134-.035.093-.032.235-.08.367-.08a.944.942 0 0 1 .94.93.936.934 0 0 1-.94.928zm7.302-4.171c-1.138-.98-3.768-3.24-4.481-3.77-.406-.302-.685-.462-.928-.533a1.559 1.554 0 0 0-.456-.07c-.182 0-.376.032-.58.095-.46.145-.918.505-1.362.854l-.023.018c-.414.324-.84.66-1.164.73a1.986 1.98 0 0 1-.43.049c-.362 0-.687-.104-.81-.258-.02-.025-.007-.066.04-.125l.008-.008 1-1.067c.783-.774 1.525-1.506 3.23-1.545h.085c1.062 0 2.12.469 2.24.524a7.03 7.03 0 0 0 3.056.724c1.076 0 2.188-.263 3.354-.795a9.135 9.11 0 0 0-.405-.317c-1.025.44-2.003.66-2.946.66-.962 0-1.925-.229-2.858-.68-.05-.022-1.22-.567-2.44-.57-.032 0-.065 0-.096.002-1.434.033-2.24.536-2.782.976-.528.013-.982.138-1.388.25-.361.1-.673.186-.979.185-.125 0-.35-.01-.37-.012-.35-.01-2.115-.437-3.518-.962-.143.1-.28.203-.415.31 1.466.593 3.25 1.053 3.812 1.089.157.01.323.027.491.027.372 0 .744-.103 1.104-.203.213-.059.446-.123.692-.17l-.196.194-1.017 1.087c-.08.08-.254.294-.14.557a.705.703 0 0 0 .268.292c.243.162.677.27 1.08.271.152 0 .297-.015.43-.044.427-.095.874-.448 1.349-.82.377-.296.913-.672 1.323-.782a1.494 1.49 0 0 1 .37-.05.611.611 0 0 1 .095.005c.27.034.533.125 1.003.472.835.62 4.531 3.815 4.566 3.846.002.002.238.203.22.537-.007.186-.11.352-.294.466a.902.9 0 0 1-.484.15.804.802 0 0 1-.428-.124c-.014-.01-1.28-1.157-1.746-1.543-.074-.06-.146-.115-.22-.115a.122.122 0 0 0-.096.045c-.073.09.01.212.105.294l1.48 1.47c.002 0 .184.17.204.395.012.244-.106.447-.35.606a.957.955 0 0 1-.526.171.766.764 0 0 1-.42-.127l-.214-.206a21.035 20.978 0 0 0-1.08-1.009c-.072-.058-.148-.112-.221-.112a.127.127 0 0 0-.094.038c-.033.037-.056.103.028.212a.698.696 0 0 0 .075.083l1.078 1.198c.01.01.222.26.024.511l-.038.048a1.18 1.178 0 0 1-.1.096c-.184.15-.43.164-.527.164a.8.798 0 0 1-.147-.012c-.106-.018-.178-.048-.212-.089l-.013-.013c-.06-.06-.602-.609-1.054-.98-.059-.05-.133-.11-.21-.11a.128.128 0 0 0-.096.042c-.09.096.044.24.1.293l.92 1.003a.204.204 0 0 1-.033.062c-.033.044-.144.155-.479.196a.91.907 0 0 1-.122.007c-.345 0-.712-.164-.902-.264a1.343 1.34 0 0 0 .13-.576 1.368 1.365 0 0 0-1.42-1.357c.024-.342-.025-.99-.697-1.274a1.455 1.452 0 0 0-.575-.125c-.146 0-.287.025-.42.075a1.153 1.15 0 0 0-.671-.564 1.52 1.515 0 0 0-.494-.085c-.28 0-.537.08-.767.242a1.168 1.165 0 0 0-.903-.43 1.173 1.17 0 0 0-.82.335c-.287-.217-1.425-.93-4.467-1.613a17.39 17.344 0 0 1-.692-.189 4.822 4.82 0 0 0-.077.494l.67.157c3.108.682 4.136 1.391 4.309 1.525a1.145 1.142 0 0 0-.09.442 1.16 1.158 0 0 0 1.378 1.132c.096.467.406.821.879 1.003a1.165 1.162 0 0 0 .415.08c.09 0 .179-.012.266-.034.086.22.282.493.722.668a1.233 1.23 0 0 0 .457.094c.122 0 .241-.022.355-.063a1.373 1.37 0 0 0 1.269.841c.37.002.726-.147.985-.41.221.121.688.341 1.163.341.06 0 .118-.002.175-.01.47-.059.689-.24.789-.382a.571.57 0 0 0 .048-.078c.11.032.234.058.373.058.255 0 .501-.086.75-.265.244-.174.418-.424.444-.637v-.01c.083.017.167.026.251.026.265 0 .527-.082.773-.242.48-.31.562-.715.554-.98a1.28 1.279 0 0 0 .978-.194 1.04 1.04 0 0 0 .502-.808 1.088 1.085 0 0 0-.16-.653c.804-.342 2.636-1.003 4.795-1.483a4.734 4.721 0 0 0-.067-.492 27.742 27.667 0 0 0-5.049 1.62zm5.123-.763c0 4.027-5.166 7.293-11.537 7.293-6.372 0-11.538-3.266-11.538-7.293 0-4.028 5.165-7.293 11.539-7.293 6.371 0 11.537 3.265 11.537 7.293zm.46.004c0-4.272-5.374-7.755-12-7.755S.002 7.277.002 11.55L0 12.004c0 4.533 4.695 8.203 11.999 8.203 7.347 0 12-3.67 12-8.204z"/>
  </svg>
);

const BehanceIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Zm-.235 12.9c.308.004.616-.029.916-.099a2.18 2.18 0 0 0 .766-.332c.228-.158.411-.371.534-.619.142-.317.208-.663.191-1.009a2.08 2.08 0 0 0-.642-1.715 2.618 2.618 0 0 0-1.696-.505h-3.54v4.279h3.471Zm13.635-5.967a2.13 2.13 0 0 0-1.654-.619 2.336 2.336 0 0 0-1.163.259 2.474 2.474 0 0 0-.738.62 2.359 2.359 0 0 0-.396.792c-.074.239-.12.485-.137.734h4.769a3.239 3.239 0 0 0-.679-1.785l-.002-.001Zm-13.813-.648a2.254 2.254 0 0 0 1.423-.433c.399-.355.607-.88.56-1.413a1.916 1.916 0 0 0-.178-.891 1.298 1.298 0 0 0-.495-.533 1.851 1.851 0 0 0-.711-.274 3.966 3.966 0 0 0-.835-.073H3.241v3.631h3.293v-.014ZM21.62 5.122h-5.976v1.527h5.976V5.122Z"/>
  </svg>
);

const DriveIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z"/>
  </svg>
);

const iconByType: Partial<Record<ToqyLinkType, React.ComponentType<{ className?: string }>>> = {
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  phone: PhoneIcon2,
  maps: MapPinIcon2,
  wifi: WifiIcon2,
  pix: PixIcon,
  pixHub: QrCode,
  catalog: FileText,
  review: Star,
  booking: CalendarCheck,
  website: Globe2,
  email: Mail,
  menu: FileText,
  pdf: FileText,
  drive: DriveIcon,
  image: ImageIcon,
  custom: LinkIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  telegram: TelegramIcon,
  spotify: SpotifyIcon,
  twitter: TwitterIcon,
  pinterest: PinterestIcon,
  threads: ThreadsIcon,
  ifood: IFoodIcon,
  waze: WazeIcon,
  picpay: PicPayIcon,
  mercadopago: MercadoPagoIcon,
  behance: BehanceIcon,
};

// Tipos cujo ícone é uma imagem própria já colorida (2026-07-16) — usados
// pra pular o círculo de fundo no quick-row de ícones sociais (ver
// socialButtons.map abaixo) e pro controle de tamanho pequeno/médio/grande.
const IMAGE_ICON_TYPES: ToqyLinkType[] = ["whatsapp", "instagram", "facebook", "maps", "youtube"];

const SOCIAL_ICON_SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

// Figurinhas decorativas (2026-09-05, posição livre desde 2026-09-06) —
// x/y arrastável dentro do header do perfil (ver STICKER_SIZE_CLASS).
const STICKER_SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "h-10 w-10 text-4xl",
  md: "h-14 w-14 text-5xl",
  lg: "h-20 w-20 text-6xl",
};

// Música de fundo (2026-09-06, 2ª revisão do recurso de música — o
// Leonardo testou o player visível <audio controls> e pediu pra tirar:
// "tire o de deixar o player da música aparecendo"). Toca sozinha, sem
// controles visíveis, no volume que o dono define. SEM slot em
// bodyBlockOrder de propósito — é ambiente, não ocupa lugar no layout.
//
// Limitação real de navegador (documentada aqui, não é bug do Toqy):
// autoplay COM SOM é bloqueado por padrão pela maioria dos navegadores
// até o visitante interagir com a página — nenhum site contorna isso
// 100%. Mitigação padrão de mercado: tenta tocar imediatamente; se o
// navegador bloquear, um listener de "primeiro toque/clique em
// qualquer lugar" dispara o play — na prática começa a tocar assim que
// o visitante toca em qualquer botão do próprio biosite.
const BackgroundMusicPlayer = ({ url, volume }: { url: string; volume: number }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.min(1, Math.max(0, volume / 100));
    const tryPlay = () => { audio.play().catch(() => {}); };
    tryPlay();
    const onFirstInteraction = () => tryPlay();
    document.addEventListener("click", onFirstInteraction, { once: true });
    document.addEventListener("touchstart", onFirstInteraction, { once: true });
    return () => {
      document.removeEventListener("click", onFirstInteraction);
      document.removeEventListener("touchstart", onFirstInteraction);
    };
  }, [url, volume]);
  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <audio ref={audioRef} src={url} loop autoPlay hidden />;
};

// Converte um link normal do Spotify (faixa/álbum/playlist) pro formato
// de embed oficial (open.spotify.com/embed/...) — sem precisar de API
// key, mesmo espírito do embed de Instagram já usado no Toqy.
function toSpotifyEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes("/embed/")) return url;
    return `https://open.spotify.com/embed${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

// Botão do Spotify (2026-09-06) — molde do "Music Link" do Linktree que
// o Leonardo mandou print: 3 formatos de exibição, sem precisar de OAuth
// de conta (isso fica pro roadmap) — só um link direto pra uma
// faixa/álbum/playlist.
const SpotifyLinkBlock = ({ url, label, display, site }: { url: string; label: string; display: "icon" | "button" | "preview"; site: ToqySite }) => {
  if (display === "preview") {
    return (
      <div className="overflow-hidden rounded-2xl">
        <iframe
          src={toSpotifyEmbedUrl(url)}
          width="100%"
          height="152"
          style={{ border: 0, borderRadius: 12 }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify"
        />
      </div>
    );
  }
  if (display === "icon") {
    // Mesmo padrão dos ícones de imagem própria (whatsapp/instagram, ver
    // IMAGE_ICON_TYPES) — sem círculo de fundo, o próprio SVG já é colorido.
    return (
      <div className="flex justify-center">
        <button type="button" onClick={() => window.open(url, "_blank", "noopener,noreferrer")} aria-label={label}
          className="flex items-center justify-center p-1 transition active:scale-90 hover:scale-105">
          <SpotifyIcon className="h-12 w-12" />
        </button>
      </div>
    );
  }
  return (
    <button type="button" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-center text-sm font-black shadow-md backdrop-blur-xl transition active:scale-[0.98]"
      style={buttonStyle(site).button}>
      <SpotifyIcon className="h-5 w-5 shrink-0" />
      <span style={buttonStyle(site).text}>{label}</span>
    </button>
  );
};

// Tamanho do h1 (nome do negócio), 2026-07-16 — "md" é o text-2xl de sempre.
const NAME_FONT_SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

type Modal = "wifi" | "pix" | "booking" | "maps" | null;

function radiusClass(site: ToqySite) {
  if (site.theme.buttonRadius === "pill") return "rounded-full";
  if (site.theme.buttonRadius === "rounded") return "rounded-[1.55rem]";
  return "rounded-2xl";
}

function logoSize(site: ToqySite) {
  if (site.profile.logoSize === "small") return "h-20 w-20";
  if (site.profile.logoSize === "large") return "h-32 w-32";
  return "h-28 w-28";
}

function logoShape(site: ToqySite) {
  if (site.profile.logoShape === "circle") return "rounded-full";
  if (site.profile.logoShape === "rounded") return "rounded-[2rem]";
  return "rounded-2xl";
}

// Fundo de imagem "fixo" (2026-07-16) — bug real corrigido: a imagem era
// aplicada com backgroundAttachment: "scroll" (nunca fixo de verdade) direto
// no container que cresce com o conteúdo (min-h-screen, mas mais alto se a
// página tiver mais conteúdo que 1 tela) — background-size: "cover" recalcula
// contra essa altura CRESCENTE, esticando a imagem cada vez mais conforme
// mais seções eram adicionadas. background-attachment: fixed também não é
// confiável no Safari/iOS. Fix: camada position:fixed separada (ver
// backgroundImageUrl() abaixo) — altura sempre = viewport, nunca estica,
// conteúdo rola livremente por cima.
//
// Segundo bug real corrigido (2026-07-15): biosite é um formato de CELULAR
// (conteúdo em <main class="max-w-[430px]">), mas a camada de fundo usava
// inset:0 do viewport inteiro. Num navegador desktop isso espalhava a
// imagem pela tela toda (ex: 1920px), sem nenhuma relação com a coluna
// estreita de conteúdo por cima — e o crop do "cover" mudava a cada
// resize da janela, então preview/publicado nunca mostravam o mesmo
// pedaço da imagem. E no preview embutido (LiveBioSitePreview/PhoneMockup),
// como não havia containing block pra position:fixed dentro da moldura, o
// código caía pra position:absolute — que, dentro de um ancestral
// min-h-screen (crescente com o conteúdo do catálogo), esticava o "cover"
// por várias telas de altura, ficando quase liso/sem imagem visível.
// Fix: a camada de fundo agora é SEMPRE position:fixed (ver PhoneMockup.tsx,
// que ganhou um `transform` só pra virar o containing block do fixed
// dentro da moldura do celular simulado) e a imagem em si fica presa a uma
// coluna central de max-w-[430px] — a mesma largura do <main> — em vez de
// esticar pelo viewport inteiro. Fora dessa coluna (telas largas), quem
// preenche é o mesmo gradiente do tema (themeGradient), não a foto.
// Otimização de imagem (2026-09-01, auditoria de performance) — fotos
// reais de cliente (Supabase Storage) chegam sem nenhum redimensionamento;
// uma delas tinha 1,9MB pra aparecer num card de ~190px na vitrine da
// landing. Passava pelo otimizador de imagem do próprio Next.js (rota
// /_next/image) pedindo uma largura compatível com onde a imagem realmente
// aparece. DESATIVADO (2026-09-08, bug real reportado ao vivo: "a imagem
// foi, mas não aparece no preview"). Causa raiz achada testando a URL de
// produção direto: /_next/image estava devolvendo 402
// "OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED" pra QUALQUER transformação
// ainda não cacheada — cota de Image Optimization da Vercel estourada.
// Imagem já vista antes (cache do w= específico) continuava servindo 200,
// por isso só imagem NOVA (upload que acabou de acontecer, preview
// incluído) quebrava — o resto do site "parecia" normal. Isso não afetava
// só o preview do editor: TODO visitante vendo uma foto nova de qualquer
// bio site (logo, catálogo, capa) estava vendo imagem quebrada.
// Como as imagens de upload já passam pelo sharp no servidor (webp,
// máx. 2000px, ver src/lib/imageStorage.ts) o redimensionamento do Next
// Image era, na prática, redundante pra elas -- só as URLs coladas via
// "Usar URL" (ImageUploadField) escapam desse pré-processamento, e mesmo
// essas preferem carregar no tamanho real a não carregar nada. Link direto
// pro Supabase Storage/URL original, sem depender de cota paga da Vercel.
function optimizedImageUrl(url: string | undefined, _width: number, _quality = 75): string | undefined {
  return url;
}

function backgroundImageUrl(site: ToqySite): string | undefined {
  const plaque = site.plaqueTheme?.useSameBackground && site.plaqueTheme.backgroundImageUrl;
  const image = plaque ? site.plaqueTheme?.backgroundImageUrl : site.profile.backgroundImageUrl;
  return (site.theme.backgroundType === "image" || plaque) && image ? image : undefined;
}

// Bug real corrigido (2026-07-16): botão de link personalizado ("Link
// personalizado"/tipo custom, sem cor de marca) caía no círculo
// site.theme.primary + ícone site.theme.text — se os dois fossem
// parecidos/escuros no tema daquele site (aconteceu de verdade: fundo
// escuro + texto escuro), o ícone genérico (LinkIcon) ficava invisível,
// virando um círculo sólido sem nada dentro. Em vez de confiar cegamente
// em theme.text, calcula a cor de maior contraste (branco ou quase-preto)
// contra o fundo real do círculo — garante que sempre dá pra ver alguma
// coisa, seja qual for a combinação de cores do tema.
function readableIconColor(bgColor: string, fallback: string): string {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(bgColor.trim());
  if (!match) return fallback;
  const hex = match[1].length === 3 ? match[1].split("").map((c) => c + c).join("") : match[1];
  const int = parseInt(hex, 16);
  const [r, g, b] = [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
  return luminance > 0.45 ? "#111318" : "#ffffff";
}

function backgroundOverlayGradient(site: ToqySite): string {
  // Bug real reportado ao vivo (2026-09-07, toqy.com.br/b/yakisabor):
  // "site esprimido" — texto do perfil (nome/subtítulo/localização/
  // descrição) ilegível, colidindo com o que está desenhado NA PRÓPRIA
  // imagem de fundo. Causa: o degradê tinha um "vale" bem no meio (15%
  // no escuro, 5% no claro) — exatamente onde o cabeçalho do perfil
  // fica, por baixo do avatar. Ficava mais escuro em cima e embaixo (pros
  // botões) e mais claro bem ali no meio, o pior lugar possível pra ficar
  // fraco. Trocado por um degradê que só ESCURECE (nunca volta a
  // clarear) — protege o texto do cabeçalho sem depender de onde ele cai.
  const isDark = site.theme.mode === "dark";
  return isDark
    ? "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.6) 100%)"
    : "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.22) 45%, rgba(0,0,0,0.35) 100%)";
}

function themeGradient(site: ToqySite): string {
  return `radial-gradient(circle at 50% 0%, ${site.theme.primary}33, transparent 34%), linear-gradient(160deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})`;
}

function backgroundStyle(site: ToqySite): React.CSSProperties {
  // Bug real corrigido (2026-07-16): backgroundColor sólido aqui tampava a
  // camada de imagem (position:fixed, -z-10, ver render abaixo) — o
  // container normal (z-index:auto) fica NA FRENTE de um filho com z-index
  // negativo no mesmo contexto de empilhamento, escondendo a imagem inteira
  // atrás de uma cor sólida. Com imagem, este container fica transparente —
  // quem pinta o fundo é só a camada fixa (que já leva seu próprio
  // themeGradient como "letterbox" fora da coluna de 430px, ver render).
  if (backgroundImageUrl(site)) return {};
  // Role unificado (2026-09-06) — 1 controle só (sólido OU gradiente) no
  // lugar dos 2 campos separados de antes (background + gradientTo).
  // Sites que nunca tocaram nesse role continuam exatamente como antes
  // (fallback pro backgroundType/themeGradient de sempre).
  const role = site.theme.colors?.pageBackground;
  if (role) return resolveColorStyle(role, "bg", site.theme.background);
  if (site.theme.backgroundType === "solid") return { background: site.theme.background };
  return { background: themeGradient(site) };
}

// Limpeza (2026-09-06, auditoria externa): a função solidBg() foi removida —
// era um stub que ignorava o argumento e devolvia {} sempre, e nenhum ponto
// do componente a chamava.

function glassCard(site: ToqySite): React.CSSProperties {
  const isLight = site.theme.mode === "light";
  return {
    background: isLight ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.12)",
    borderColor: isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.18)",
    boxShadow: isLight ? "0 18px 45px rgba(15,23,42,.10)" : "0 20px 70px rgba(0,0,0,.20)",
  };
}

// `buttonOverride` (2026-09-07, referência Coonexta: "alterar as cores de
// cada botão individualmente") — cor de UM botão específico, definida no
// editor (ButtonEditor.tsx). Quando presente, vence a cor global de
// "Fundo dos botões" só pro fundo; texto/borda continuam vindo do role
// global (não faz sentido pedir separadamente pra cada botão, e evita
// contraste ruim se a pessoa só trocar o fundo). Sem valor, comportamento
// idêntico a antes desta feature existir.
// Devolve DOIS estilos separados — botão (fundo+borda) e texto — em vez de
// um objeto só (2026-09-08, bug real reportado ao vivo: "o texto gradiente
// não funciona"). Causa: texto em modo gradiente resolve pra
// `{backgroundImage, backgroundClip:"text", color:"transparent", ...}` (ver
// resolveColorStyle) — misturado num objeto ÚNICO aplicado no MESMO
// elemento que já usa `background`/`backgroundImage` pro preenchimento do
// botão, as duas propriedades colidem (só uma sobrevive) e o código antigo
// ainda extraía só `.color` do resultado, descartando backgroundImage/
// backgroundClip por completo — sobrava `color: "transparent"` sozinho,
// texto literalmente invisível. Agora quem chama aplica `.button` no
// elemento do botão e `.text` no <span> do rótulo — dois elementos, cada
// propriedade no seu lugar, sem conflito.
function buttonStyle(site: ToqySite, buttonOverride?: ColorValue): { button: React.CSSProperties; text: React.CSSProperties } {
  const colors = site.theme.colors;
  const fill = site.theme.buttonFill;
  const text = resolveColorStyle(colors?.buttonText, "text", site.theme.mode === "light" ? "#ffffff" : "#F8FAFC");
  if (buttonOverride) return {
    button: {
      ...resolveColorStyle(buttonOverride, "bg", site.theme.primary),
      borderColor: colorSwatch(colors?.buttonBorder, "rgba(255,255,255,0.18)"),
    },
    text,
  };
  // Glass e Gradiente (legado, seletor "Preenchimento") ignoram cores
  // granulares de FUNDO — são automáticos; o texto/borda continua
  // respeitando o role granular (solid ou gradiente via colorSwatch).
  if (fill === "glass") return {
    button: {
      background: site.theme.mode === "light" ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.13)",
      borderColor: colorSwatch(colors?.buttonBorder, site.theme.mode === "light" ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.18)"),
    },
    text,
  };
  if (fill === "gradient") return {
    button: {
      background: `linear-gradient(135deg, ${colorSwatch(colors?.buttonBg, site.theme.primary)}, ${site.theme.secondary})`,
      borderColor: "rgba(255,255,255,0.18)",
    },
    text,
  };
  // Sólido (ou gradiente escolhido direto no role buttonBg)
  return {
    button: {
      ...resolveColorStyle(colors?.buttonBg, "bg", site.theme.primary),
      borderColor: colorSwatch(colors?.buttonBorder, "rgba(255,255,255,0.18)"),
    },
    text,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// HIERARQUIA DE BOTÕES + CARD DE HORÁRIO (2026-09-06)
// Origem: mockup conceitual do bio site público entregue pela auditoria
// externa ("Café Aurora"). Princípios que o mockup aplica e que estas
// funções implementam:
//   • UM CTA primário por seção — preenchido, cor cheia, ícone em círculo
//     BRANCO; todas as outras ações viram cards claros, subordinados.
//   • Dois níveis de raio — controles menores e cards principais não podem
//     ter o mesmo arredondamento (senão tudo vira a mesma cápsula).
//   • Área de toque mínima de 44px.
//   • Menos gradiente em área de leitura (o card de horário é sólido).
// ─────────────────────────────────────────────────────────────────────────

// Cor de acento do bio site = a MESMA cor do CTA primário (role "buttonBg",
// com fallback pro theme.primary de sempre). Serve de base pro círculo
// coral claro dos ícones secundários e do horário — derivar daqui evita
// criar mais um role de cor duplicando um conceito que já existe.
function accentColor(site: ToqySite): string {
  return colorSwatch(site.theme.colors?.buttonBg, site.theme.primary);
}

// Mesma cor com opacidade baixa (o "círculo coral clarinho" do mockup).
// Aceita hex de 3 ou 6 dígitos; qualquer outro formato (rgba/named) volta
// intacto — melhor um círculo na cor cheia do que um valor CSS inválido.
function softTint(hex: string, alpha = "1F"): string {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const full = match[1].length === 3 ? match[1].split("").map((c) => c + c).join("") : match[1];
  return `#${full}${alpha}`;
}

// Card claro das ações secundárias. Texto via colorSwatch (não
// resolveColorStyle) de propósito: em modo gradiente o resolver de TEXTO
// devolve `color: transparent` + bg-clip, o que aqui apagaria o texto por
// cima do fundo do próprio card — o swatch entrega uma cor sólida legível.
//
// Fallback de texto encadeia por buttonText ANTES de theme.text (2026-09-08,
// bug real reportado ao vivo: "quando marco destaque, os outros botão fica
// tudo preto" — secondaryButtonText é um role à parte que quase ninguém
// preenche; sem essa cadeia, o texto caía direto no "Texto principal" da
// página inteira, que não tem nenhuma relação com a cor que a pessoa já
// escolheu pros botões, podendo ficar ilegível em cima do card claro.
function secondaryButtonStyle(site: ToqySite): React.CSSProperties {
  const isLight = site.theme.mode === "light";
  const textFallback = colorSwatch(site.theme.colors?.buttonText, site.theme.text);
  return {
    ...resolveColorStyle(site.theme.colors?.secondaryButtonBg, "bg", isLight ? "#FFFFFF" : "rgba(255,255,255,0.10)"),
    color: colorSwatch(site.theme.colors?.secondaryButtonText, textFallback),
    borderColor: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.14)",
    boxShadow: isLight ? "0 6px 18px rgba(15,23,42,0.06)" : "0 8px 22px rgba(0,0,0,0.20)",
  };
}

const WEEKDAY_COUNT = 7;

function parseMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

// "09:00" → "9h" | "18:30" → "18h30" (formato do mockup, e o jeito que
// negócio local escreve horário no Brasil).
function formatHour(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;
  return match[2] === "00" ? `${Number(match[1])}h` : `${Number(match[1])}h${match[2]}`;
}

// Estado "aberto agora" + a frase do dia. Recebe `now` de fora de propósito:
// quem chama é um componente que só calcula DEPOIS de montar no navegador
// (ver BusinessHoursCard) — o bio site é renderizado no servidor e um
// `new Date()` durante o render daria divergência de hidratação.
function businessHoursStatus(hours: BusinessHours, now: Date): { open: boolean; label: string } {
  const dayFor = (weekday: number) => hours.days.find((day) => day.weekday === weekday);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const today = dayFor(now.getDay());

  const openNowToday = (() => {
    if (!today || today.closed) return false;
    const start = parseMinutes(today.open);
    const end = parseMinutes(today.close);
    if (start === null || end === null) return false;
    // Expediente que vira a madrugada (close <= open): hoje ele vale do
    // horário de abertura até a meia-noite.
    return end > start ? minutesNow >= start && minutesNow < end : minutesNow >= start;
  })();

  // ...e a "sobra" do expediente de ONTEM que ainda não fechou (ex: abriu
  // ontem 18h, fecha 02h — às 00h30 de hoje o negócio está aberto).
  const openNowFromYesterday = (() => {
    const yesterday = dayFor((now.getDay() + WEEKDAY_COUNT - 1) % WEEKDAY_COUNT);
    if (!yesterday || yesterday.closed) return false;
    const start = parseMinutes(yesterday.open);
    const end = parseMinutes(yesterday.close);
    if (start === null || end === null || end > start) return false;
    return minutesNow < end;
  })();

  return {
    open: openNowToday || openNowFromYesterday,
    label: !today || today.closed ? "Fechado hoje" : `Aberto hoje • ${formatHour(today.open)} às ${formatHour(today.close)}`,
  };
}

// Card de horário do mockup: ícone de relógio em círculo coral claro,
// linha de horário em negrito, endereço embaixo (reaproveita
// profile.location — não inventa campo novo) e selo verde/cinza à direita.
const BusinessHoursCard = ({ site }: { site: ToqySite }) => {
  const hours = site.businessHours;
  // "Aberto agora" depende do relógio de QUEM VISITA, e esta página é
  // renderizada no servidor — calcular no primeiro render quebraria a
  // hidratação. Fica nulo até montar; enquanto isso o selo é renderizado
  // invisível (`invisible`, não removido) pra não empurrar o layout quando
  // aparecer. Re-checa de minuto em minuto pra virar de aberto pra fechado
  // sozinho com a página aberta.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!hours?.enabled || !hours.days.length || hours.showOnSite === false) return null;

  const status = now ? businessHoursStatus(hours, now) : null;
  const accent = accentColor(site);
  const isLight = site.theme.mode === "light";
  // Verde/cinza fixos de propósito: "aberto"/"fechado" é status semântico
  // (mesma convenção do Google/Maps), não identidade visual do negócio —
  // deixar o dono pintar isso de qualquer cor só tornaria a informação
  // menos legível. A cor "de marca" do card fica nos roles hoursCardBg/
  // hoursText, esses sim configuráveis.
  const badge = status?.open
    ? { background: "#DCFCE7", color: "#15803D", text: "Aberto" }
    : { background: isLight ? "#F1F5F9" : "rgba(255,255,255,0.14)", color: isLight ? "#475569" : "#E2E8F0", text: "Fechado" };

  return (
    <section
      // rounded-[1.25rem] (20px) = nível "card principal" do mockup, contra
      // o rounded-full do círculo/selo — os dois níveis de raio que a
      // auditoria pediu, pra nada parecer a mesma cápsula.
      className="mt-4 flex items-center gap-3 rounded-[1.25rem] border px-4 py-3"
      style={{
        ...resolveColorStyle(site.theme.colors?.hoursCardBg, "bg", isLight ? "#FFFFFF" : "rgba(255,255,255,0.10)"),
        borderColor: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.14)",
        boxShadow: isLight ? "0 6px 18px rgba(15,23,42,0.06)" : "0 8px 22px rgba(0,0,0,0.20)",
      }}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: softTint(accent) }}>
        <Clock className="h-5 w-5" style={{ color: accent }} />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-black leading-snug" style={{ color: colorSwatch(site.theme.colors?.hoursText, site.theme.text) }}>
          {status?.label ?? "Horário de funcionamento"}
        </p>
        {site.profile.location ? (
          <p className="mt-0.5 truncate text-xs font-semibold" style={{ color: colorSwatch(site.theme.colors?.location, site.theme.muted) }}>
            {site.profile.location}
          </p>
        ) : null}
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${status ? "" : "invisible"}`}
        style={{ background: badge.background, color: badge.color }}
      >
        {badge.text}
      </span>
    </section>
  );
};

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "T";
}

function uniqueGroups(items: CatalogItem[]) {
  const groups = new Map<string, CatalogItem[]>();
  items.forEach((item) => {
    const key = item.category?.trim() || "Destaques";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return Array.from(groups.entries());
}

// Chave de agrupamento (2026-07-16, subcategorias): normalmente é só a
// categoria do item. Mas quando a categoria está em modo "Subcategorias"
// (ex: "Home Office" com Cadeiras/Mesas/Estantes dentro) e o item tem uma
// subcategoria preenchida, a chave vira categoria+subcategoria — assim
// "Cadeiras" e "Mesas" viram capas SEPARADAS (cada uma com sua própria
// galeria), em vez de tudo cair numa capa só de "Home Office".
function groupKey(item: CatalogItem): string {
  if (item.displaySection === "subcategorias" && item.subcategory?.trim()) {
    return `${item.category?.trim() || "Destaques"}::${item.subcategory.trim()}`;
  }
  return item.category?.trim() || "Destaques";
}

// Correção de bug real reportado por cliente (2026-07-16): antes desta
// função, uma categoria com várias fotos (ex: "Diretoria" com 5 fotos)
// aparecia com as 5 fotos soltas, como cards separados, direto na página
// principal do catálogo — clicar em qualquer uma abria a galeria da
// categoria (CategoryGalleryModal) mostrando os MESMOS itens já visíveis,
// sem nada de "escondido" de verdade (o clique parecia não fazer nada).
// Agora a página principal mostra só 1 card por categoria (ou por
// categoria+subcategoria, ver groupKey acima) — o primeiro item cadastrado
// nela, na ordem em que foi criado — com o badge "+N" (já existente)
// indicando quantas fotos a mais existem. As demais fotos só aparecem ao
// clicar na foto e abrir a galeria. Grupo com 1 item só não muda em nada
// (nunca teve o que esconder). Usado em toda renderização "achatada"
// (grid/stack/scroller simples e as seções destaque/carrossel/grade/lista/
// padrão) — NÃO no layout "Por categoria" (grouped/category-carousel), que
// mostra cada categoria inteira de propósito, como um modo de exibição
// alternativo e deliberado.
function representativeItemsByCategory(items: CatalogItem[]): CatalogItem[] {
  const seen = new Set<string>();
  const result: CatalogItem[] = [];
  items.forEach((item) => {
    const key = groupKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
}

export function PublicBioSite({ site, publicUrl, instanceId, onStickerMove, enableBackgroundMusic = false, enableTrackingPixels = false }: { site: ToqySite; publicUrl?: string; instanceId?: string; onStickerMove?: (id: string, x: number, y: number) => void; enableBackgroundMusic?: boolean; enableTrackingPixels?: boolean }) {
  const [modal, setModal] = useState<Modal>(null);
  const [qrModal, setQrModal] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [draggingSticker, setDraggingSticker] = useState<string | null>(null);

  // URL e id do catálogo — quando publicUrl/instanceId são omitidos, comportamento
  // idêntico ao anterior (window.location.href e id fixo "catalogo-toqy"). Necessário
  // pra renderizar várias instâncias simultâneas (vitrine da landing/galeria de templates)
  // sem que todas mostrem o mesmo QR Code ou disputem o mesmo id de scroll.
  const url = publicUrl ?? (typeof window !== "undefined" ? window.location.href : "");
  const catalogId = instanceId ? `catalogo-toqy-${instanceId}` : "catalogo-toqy";

  // Analytics real (2026-07-16) — só conta como "visualização" quando é a
  // página pública de verdade (sem instanceId), nunca as instâncias de
  // vitrine/showcase da landing (que reusam este mesmo componente pra
  // mostrar vários bio sites de exemplo na mesma página).
  useEffect(() => {
    if (instanceId) return;
    analytics.trackPageView(site.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id, instanceId]);

  // Helper: resolve role de cor granular (sólido ou gradiente) já como
  // CSSProperties prontas pra espalhar no style={} — ver colorRoles.ts.
  // Todo uso de col() aqui é kind="text" (cor de texto).
  const col = (key: keyof NonNullable<typeof site.theme.colors>, fallback: string) =>
    resolveColorStyle(site.theme.colors?.[key], "text", fallback);
  const [copied, setCopied] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>();

  // Gating real de plano (2026-07-13) — antes disso, Catálogo/Pix/Wi-Fi
  // ficavam liberados pra QUALQUER plano no site público, mesmo Gratuito,
  // porque nada aqui checava site.ownerPlan (só a quantidade de bio sites
  // era travada, em outro lugar do app). site.ownerPlan é gravado no
  // save/fetch do bio site (ver biositeSync.ts, api/biosite/save) — se por
  // algum motivo vier vazio, cai em "free" (mais restritivo, nunca libera
  // por engano).
  const plan = getPlan(resolvePlanTier(site.ownerPlan));
  const activeButtons = site.buttons
    .filter((button) => button.enabled)
    .filter((button) => {
      if ((button.type === "pix" || button.type === "pixHub") && !plan.hasPix) return false;
      if (button.type === "wifi" && !plan.hasWifi) return false;
      if (button.type === "catalog" && !plan.hasCatalog) return false;
      return true;
    });
  const activeCatalog = plan.hasCatalog ? site.catalog.filter((item) => item.enabled) : [];
  const catalogLayout: CatalogLayout = site.catalogLayout ?? "carousel";
  const vcard = useMemo(() => createVCard(site), [site]);

  async function copyText(value: string, key: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  async function shareSite() {
    if (navigator.share) {
      try {
        await navigator.share({ title: site.profile.name, text: site.profile.description, url });
      } catch (err) {
        // AbortError = usuário fechou o menu de compartilhamento — não é erro real
        if (err instanceof Error && err.name === "AbortError") return;
        await copyText(url, "share");
      }
    } else {
      await copyText(url, "share");
    }
  }

  function downloadVCard() {
    const pageUrl = url || site.contact.website;
    const contactCard = site.contact.website || !pageUrl ? vcard : vcard.replace("END:VCARD", `URL:${pageUrl}\nEND:VCARD`);
    const blob = new Blob([contactCard], { type: "text/vcard;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${site.slug || "toqy"}.vcf`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  function handleButton(button: ToqyButton) {
    analytics.trackButtonClick(eventTypeForButtonType(button.type), site.id, button.id, button.label);
    if (button.type === "wifi") return setModal("wifi");
    if (button.type === "pix" || button.type === "pixHub") return setModal("pix");
    // "Como chegar" com mapa embutido (2026-09-08, pedido real com print
    // de referência) — só abre o modal se tiver endereço pra mostrar;
    // sem isso, comportamento de sempre (abre o link direto, se houver).
    if (button.type === "maps" && mapsQuery(site)) return setModal("maps");
    // Agendamento nativo (2026-09-07): só abre o modal se houver ao menos
    // 1 serviço habilitado — senão comportamento de sempre, link externo.
    if (button.type === "booking" && site.services?.some((s) => s.enabled)) return setModal("booking");
    if (button.type === "catalog") {
      document.getElementById(catalogId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const href = buttonHref(site, button);
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  }

  const ButtonIcon = ({ type, color, className }: { type: ToqyLinkType; color?: string; className?: string }) => {
    const Icon = iconByType[type] ?? LinkIcon;
    return <Icon className={className ?? "h-5 w-5 shrink-0"} style={color ? { color } : undefined} />;
  };

  const SOCIAL_TYPES = ["whatsapp", "instagram", "facebook", "tiktok", "linkedin", "youtube", "email"];
  // displayAs="icon" força ícone, displayAs="button" força botão grande, undefined = automático por tipo
  const socialButtons = activeButtons.filter((b) =>
    b.displayAs === "icon" || (!b.displayAs && SOCIAL_TYPES.includes(b.type))
  ).filter(b => b.displayAs !== "button");
  const wifiInline = plan.hasWifi && site.wifi?.enabled && site.wifi.ssid && site.wifi.showInline !== false;
  const mainButtons = activeButtons.filter((b) =>
    b.displayAs === "button" || (!b.displayAs && !SOCIAL_TYPES.includes(b.type) && b.type !== "phone" && !(wifiInline && b.type === "wifi"))
  );

  // Chave de compatibilidade da hierarquia primário/secundário
  // (2026-09-06, mockup da auditoria externa). ENQUANTO NINGUÉM MARCAR um
  // botão como principal, isto é `false` e a lista de botões grandes
  // renderiza exatamente como sempre renderizou — mesma classe, mesmo
  // estilo, sem chevron. É o que garante que nenhum dos bio sites já
  // publicados (clientes pagantes reais) mude de aparência sozinho ao
  // subir esta versão.
  //
  // O estilo "ícone" (grade 3 colunas, theme.buttonStyle === "icon") fica
  // de fora: lá os botões são quadradinhos de mesma altura numa grade, e a
  // ideia de "um preenchido + os outros em card com seta" não se traduz.
  const useButtonHierarchy = site.theme.buttonStyle !== "icon" && mainButtons.some((b) => b.isPrimary === true);
  const accent = accentColor(site);

  const bgImage = backgroundImageUrl(site);
  // Compatibilidade (2026-09-06): musicUrl era o nome antigo do campo,
  // quando o recurso ainda era um player visível — sites salvos antes
  // desta revisão continuam tocando, só que agora como fundo ambiente.
  const backgroundMusicUrl = site.backgroundMusicUrl || site.musicUrl;

  return (
    <div className={`relative min-h-screen w-full ${bioSiteFontById(site.theme.fontFamily)?.variable ?? ""}`} style={{ ...backgroundStyle(site), color: site.theme.text, fontFamily: bioSiteFontById(site.theme.fontFamily)?.cssFamily }}>
      {/* Bug real reportado ao vivo (2026-09-06): sem a flag
          enableBackgroundMusic, a música de um bio site de exemplo tocava
          sozinha na página INICIAL do Toqy (o card de demonstração da
          landing renderiza este mesmo componente) — só a página pública
          de verdade do bio site (ver PublicBioSiteServer.tsx) passa essa
          flag como true. */}
      {enableBackgroundMusic && backgroundMusicUrl ? <BackgroundMusicPlayer url={backgroundMusicUrl} volume={site.backgroundMusicVolume ?? 40} /> : null}
      {enableTrackingPixels ? <TrackingPixels metaPixelId={site.trackingPixels?.metaPixelId} gaMeasurementId={site.trackingPixels?.gaMeasurementId} /> : null}
      {bgImage ? (
        <div className="fixed inset-0 -z-10" style={{ background: themeGradient(site) }}>
          <div
            className="absolute inset-0 mx-auto w-full max-w-[430px]"
            style={{
              // Bug real corrigido (2026-07-16): o gradiente de escurecimento
              // era aplicado SEMPRE que havia imagem de fundo, ignorando
              // site.theme.useBackgroundOverlay por completo (o campo existe
              // no tipo e é setado por templates/onboarding, mas nunca era
              // lido aqui) — mesmo em modo claro o gradiente termina em
              // rgba(0,0,0,0.30) embaixo, então um fundo branco escolhido de
              // propósito sempre saía acinzentado/escurecido na base, sem
              // controle nenhum do usuário pra desligar isso.
              backgroundImage: site.theme.useBackgroundOverlay
                ? `${backgroundOverlayGradient(site)}, url(${optimizedImageUrl(bgImage, 860)})`
                : `url(${optimizedImageUrl(bgImage, 860)})`,
              backgroundSize: "cover",
              // Reposicionável (2026-09-06, resolve o "tela corta" achado
              // ao vivo em toqy.com.br/b/yakisabor): antes era sempre
              // "center top" fixo — uma imagem que não foi desenhada pra
              // proporção de celular cortava texto nas bordas sem
              // nenhum jeito de ajustar. Mesmo padrão de profileImagePosition.
              backgroundPosition: site.profile.backgroundImagePosition ?? "center top",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      ) : null}
      <div className="min-h-screen w-full">
        {/* Vídeo de topo (2026-09-08, redesenhado a partir do "vídeo de
            fundo" antigo — pedido real ao vivo: "eu tava vendo, ele
            substitui a imagem de fundo, não é isso que quero... o vídeo
            que quero é apenas na parte de cima do biosite"). ANTES esse
            mesmo campo (backgroundVideoUrl) tomava a tela inteira e
            escondia a imagem de fundo (ver comentário removido acima).
            Confirmado com o Leonardo (2026-09-08) que nenhum bio site
            real usava esse campo ainda, então reaproveitar o campo em vez
            de criar um novo não quebra ninguém. Agora é uma faixa de
            altura fixa no topo, a imagem/cor de fundo do resto da página
            continua normal atrás/abaixo dela. `-mb-14` puxa o QR/
            Compartilhar + avatar pra cima, sobrepondo a base do vídeo —
            mesmo efeito "foto de capa com avatar por cima" do print de
            referência que o Leonardo mandou. */}
        {site.profile.backgroundVideoUrl ? (
          <div className="relative -mb-14 h-56 w-full overflow-hidden bg-black">
            <video
              src={site.profile.backgroundVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10" />
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-[430px] px-4 py-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setQrModal(true)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black backdrop-blur-xl" style={glassCard(site)}><QrCode className="h-4 w-4" />QR Code</button>
            <button type="button" onClick={shareSite} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black backdrop-blur-xl" style={glassCard(site)}><Share2 className="h-4 w-4" />{copied === "share" ? "Copiado" : "Compartilhar"}</button>
          </div>

          <header ref={headerRef} className="relative text-center">
            {/* Figurinhas decorativas — posição livre x/y (2026-09-06,
                pedido do Leonardo: "mover pela tela do próprio preview,
                como se fosse um Canva"). `onStickerMove` só é passado pelo
                SiteBuilder (editor); no bio site público de verdade o
                sticker fica fixo na posição salva, sem handlers de
                arrastar. */}
            {(site.stickers ?? []).map((sticker) => (
              <div
                key={sticker.id}
                onPointerDown={onStickerMove ? (e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); setDraggingSticker(sticker.id); } : undefined}
                onPointerMove={onStickerMove ? (e) => {
                  if (draggingSticker !== sticker.id) return;
                  const rect = headerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
                  const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
                  onStickerMove(sticker.id, x, y);
                } : undefined}
                onPointerUp={onStickerMove ? () => setDraggingSticker(null) : undefined}
                className={`absolute z-10 flex items-center justify-center drop-shadow-lg ${STICKER_SIZE_CLASS[sticker.size]} ${onStickerMove ? "touch-none cursor-grab select-none active:cursor-grabbing" : "pointer-events-none"}`}
                style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)` }}
              >
                <StickerIcon stickerKey={sticker.key} className="h-full w-full" />
              </div>
            ))}
            <div className={`${logoSize(site)} ${logoShape(site)} relative mx-auto overflow-hidden shadow-2xl`} style={{ border: (site.profile.logoUrl || site.profile.profileImageUrl) ? "none" : `2px solid ${site.theme.primary}88`, background: "transparent" }}>
              {site.profile.logoUrl || site.profile.profileImageUrl ? (
                <img
                  src={optimizedImageUrl(site.profile.logoUrl || site.profile.profileImageUrl, 256)}
                  alt={site.profile.name}
                  loading="eager"
                  fetchPriority="high"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: site.profile.logoFit ?? "cover",
                    objectPosition: site.profile.profileImagePosition ?? "center",
                  }}
                />
              ) : (
                <span className="text-4xl font-black text-white">{getInitials(site.profile.name)}</span>
              )}
            </div>
          <h1 className={`mt-5 ${NAME_FONT_SIZE_CLASS[site.theme.nameFontSize ?? "md"]} font-black leading-tight${site.theme.nameShadow === false ? "" : " drop-shadow-sm"}`} style={{ ...col("name", site.theme.text), textShadow: site.theme.nameShadow === false ? "none" : site.theme.mode === "light" ? "none" : "0 0 10px rgba(0,0,0,0.5)" }}>{site.profile.name}</h1>
            {/* textShadow (2026-09-07, mesmo bug do yakisabor): título,
                localização e descrição não tinham nenhuma proteção contra o
                que estiver desenhado atrás na imagem de fundo — só o nome
                (h1 acima) já tinha. Mesmo valor de sombra do nome. */}
            {site.profile.title ? <p className="mt-1 text-base font-medium" style={{ ...col("title", site.theme.muted), textShadow: site.theme.mode === "light" ? "none" : "0 0 10px rgba(0,0,0,0.5)" }}>{site.profile.title}</p> : null}
            {site.profile.location ? (
              <div className="mt-2 flex flex-col items-center gap-0.5">
              <div className="flex items-start justify-center gap-1">
                {/* Ícone do pin usa colorSwatch (nunca o truque de bg-clip
                    do gradiente) — um SVG <path fill> não tem "texto" pra
                    recortar, então o mesmo resolveColorStyle usado no
                    endereço abaixo deixaria o ícone invisível se o role
                    "location" estivesse em modo gradiente. */}
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: colorSwatch(site.theme.colors?.location, site.theme.muted) }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {/* text-left (2026-07-15) é o padrão: com text-center, um
                    endereço que quebra em 2 linhas fica com a 2ª linha (mais
                    curta) centralizada sob a 1ª — visualmente longe do
                    ícone, que só alinha com a 1ª linha. Com as linhas
                    coladas à esquerda, ambas ficam rente ao ícone.
                    locationAlign="center" (2026-07-16) é opt-in pra quem
                    prefere centralizado mesmo com esse trade-off. */}
                <p className={`${site.theme.locationAlign === "center" ? "text-center" : "text-left"} text-sm font-semibold leading-snug`} style={{ ...col("location", site.theme.muted), textShadow: site.theme.mode === "light" ? "none" : "0 0 10px rgba(0,0,0,0.5)" }}>{site.profile.location}</p>
              </div>
            </div>
            ) : null}
            {site.profile.description ? <p className="mx-auto mt-4 max-w-[350px] text-center text-sm leading-relaxed" style={{ ...col("description", site.theme.muted), textShadow: site.theme.mode === "light" ? "none" : "0 0 10px rgba(0,0,0,0.5)" }}>{site.profile.description}</p> : null}
            {site.profile.logoSignatureUrl ? (
              <img src={optimizedImageUrl(site.profile.logoSignatureUrl, 260)} alt={`${site.profile.name} assinatura`} className="mx-auto mt-4 max-h-20 max-w-[260px] object-contain drop-shadow-lg" />
            ) : null}
            {site.profile.logoText ? (
              <p className="mt-3 tracking-widest drop-shadow-lg" style={{ ...col("logoText", site.theme.text), fontSize: "clamp(13px, 4vw, 20px)", fontFamily: site.profile.logoFont === "serif" || site.profile.logoFont === "italic" ? "Georgia, serif" : site.profile.logoFont === "mono" ? "monospace" : "inherit", fontWeight: !site.profile.logoFont || site.profile.logoFont === "bold" ? 900 : 700, fontStyle: site.profile.logoFont === "italic" ? "italic" : "normal", letterSpacing: "0.15em", textTransform: "uppercase", textShadow: site.theme.mode === "dark" ? "0 2px 12px rgba(0,0,0,0.6)" : "none" }}>{site.profile.logoText}</p>
            ) : null}
          </header>

          <section className="mt-4 grid grid-cols-2 gap-2">
            {site.modules?.saveContact !== false ? <button type="button" onClick={downloadVCard} className={`${radiusClass(site)} flex items-center justify-center gap-2 border px-4 py-3 text-xs font-black backdrop-blur-xl`} style={{ ...glassCard(site), ...col("saveContactText", site.theme.text) }}><Save className="h-4 w-4" />Salvar Contato</button> : null}
            {site.contact.phone ? <button type="button" onClick={() => window.open(`tel:${site.contact.phone.replace(/\D/g, "")}`)} className={`${radiusClass(site)} flex items-center justify-center gap-2 border px-4 py-3 text-xs font-black backdrop-blur-xl`} style={{ ...glassCard(site), ...col("callText", site.theme.text) }}><Phone className="h-4 w-4" />Ligar</button> : null}
          </section>

          {/* Wi-Fi inline — mostra rede e senha sem precisar abrir modal */}
          {wifiInline ? (
            <section className="mt-3 rounded-2xl border px-4 py-2.5 backdrop-blur-xl" style={glassCard(site)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <WifiIcon2 className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="text-xs font-black truncate" style={col("wifiText", site.theme.text)}>
                    Wi-Fi: <span className="font-mono">{site.wifi.ssid}</span>
                    {site.wifi.password ? <> &nbsp;·&nbsp; Senha: <span className="font-mono">{site.wifi.password}</span></> : null}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(site.wifi.password || site.wifi.ssid, "wifi")}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-black transition"
                  style={{ background: site.theme.primary + "22", color: site.theme.primary }}
                >
                  {copied === "wifi" ? "Copiado!" : "Copiar senha"}
                </button>
              </div>
            </section>
          ) : null}

          {socialButtons.length ? (
            <section className="mt-3 flex items-center justify-center gap-3">
              {socialButtons.map((button) => {
                const brandColor: Record<string, string> = {
                  whatsapp: "#25D366", instagram: "#E1306C", facebook: "#1877F2",
                  tiktok: "#010101", linkedin: "#0A66C2", youtube: "#FF0000", email: "#EA4335",
                  telegram: "#26A5E4", spotify: "#1DB954", twitter: "#000000",
                  pinterest: "#E60023", threads: "#000000",
                  ifood: "#EA1D2C", waze: "#33CCFF", picpay: "#21C25E",
                  mercadopago: "#00B1EA", behance: "#1769FF",
                };
                const isBrandType = button.type in brandColor;
                // Precisa vir ANTES do bloco de IMAGE_ICON_TYPES abaixo —
                // ver o bug real corrigido logo ali.
                const translucent = Boolean(site.theme.socialIconTranslucent) || site.theme.socialIconStyle === "glass";

                // Ícones com imagem própria (2026-07-16, pedido do Leonardo:
                // "tira esse contorno, deixa só os ícones com as cores
                // deles") — whatsapp/instagram/facebook/maps agora são PNGs
                // já coloridos (ver WhatsAppIcon/InstagramIcon/FacebookIcon/
                // MapPinIcon2 acima), então o círculo de fundo + tint de cor
                // do padrão antigo só duplicava contorno em cima do ícone.
                // Renderiza sem bg/sombra, só o ícone maior, tamanho
                // controlável em socialIconSize (padrão "md").
                //
                // Bug real corrigido (2026-09-06, reportado ao vivo depois
                // do fix estrutural anterior: "translúcido ainda não
                // funciona"): estes 5 tipos (whatsapp/instagram/facebook/
                // maps/youtube) são justamente os mais usados, e o "sem
                // bg" acima faz o toggle "translúcido" não ter NENHUM
                // efeito visível neles — o círculo nem existe pra ficar
                // translúcido. Modo translúcido agora é uma exceção: volta
                // a mostrar um fundo suave (mesma cor de marca, alpha
                // baixo) atrás do ícone. Sem translúcido, mantém o
                // comportamento de 2026-07-16 (sem fundo nenhum).
                if (IMAGE_ICON_TYPES.includes(button.type)) {
                  const sizeClass = SOCIAL_ICON_SIZE_CLASS[site.theme.socialIconSize ?? "md"];
                  if (!translucent) {
                    return (
                      <button key={button.id} type="button" onClick={() => handleButton(button)} aria-label={button.label}
                        className="flex items-center justify-center p-1 transition active:scale-90 hover:scale-105">
                        <ButtonIcon type={button.type} className={sizeClass} />
                      </button>
                    );
                  }
                  // Fundo translúcido usa a cor ESCOLHIDA no editor
                  // (socialIconBg) quando existir, não mais sempre a cor
                  // fixa da marca (2026-09-08, bug real: "não consigo
                  // mudar o fundo do translúcido, não muda" — antes o
                  // círculo translúcido de WhatsApp/Instagram/Facebook/
                  // Maps/YouTube SEMPRE usava a cor da marca, então
                  // trocar "Fundo dos ícones sociais" no editor não tinha
                  // nenhum efeito visível nesses 5 tipos, os mais usados).
                  // Sem customização, cai na cor de marca de sempre — não
                  // muda nada pra quem nunca mexeu nesse campo.
                  const softBg = `${colorSwatch(site.theme.colors?.socialIconBg, brandColor[button.type] ?? site.theme.primary)}26`;
                  return (
                    <button key={button.id} type="button" onClick={() => handleButton(button)} aria-label={button.label}
                      className="flex h-12 w-12 items-center justify-center rounded-full shadow-md transition active:scale-90 hover:scale-105 backdrop-blur-sm"
                      style={{ background: softBg }}>
                      <ButtonIcon type={button.type} className="h-6 w-6" />
                    </button>
                  );
                }

                // Fix estrutural (2026-09-06, 3ª correção do mesmo bug —
                // as 2 anteriores regrediram porque cor-de-marca e
                // translúcido eram decididos no MESMO cálculo entrelaçado.
                // Agora são 2 passos separados e sequenciais:
                //
                // 1) baseBg = a cor sólida de fundo, cheia, sem opacidade —
                //    cor de marca de verdade se for um ícone reconhecido
                //    (WhatsApp/Instagram/...), senão o role "Fundo dos
                //    ícones sociais" (socialIconBg) escolhido no editor.
                // 2) translucent = flag booleana isolada (não depende de
                //    ser marca ou não) — se ligada, SEMPRE pega o baseBg
                //    (seja qual for) e aplica alpha reduzido por cima, sem
                //    condicional própria por tipo de ícone.
                //
                // socialIconStyle:"glass" (formato antigo) ainda é lido
                // como equivalente a translucent=true, pra não quebrar
                // bio sites salvos antes desta correção.
                // Mesmo fix do bloco IMAGE_ICON_TYPES acima: em modo
                // translúcido, socialIconBg (se configurado) vence a cor
                // de marca — sem isso, o campo "Fundo dos ícones sociais"
                // não tinha efeito nenhum em ícone de marca translúcido.
                const solidBg = isBrandType ? brandColor[button.type] : colorSwatch(site.theme.colors?.socialIconBg, site.theme.primary);
                const baseBg = translucent ? colorSwatch(site.theme.colors?.socialIconBg, solidBg) : solidBg;
                const bg = translucent ? `${baseBg}26` : baseBg;
                // Bug real corrigido (2026-07-16): ícone branco fixo quebrava
                // (sumia) quando o fundo caía no fallback theme.primary (tipo
                // sem cor de marca, ex: mapa/localização) E o usuário definia
                // a cor do ícone como branco — branco no branco, invisível.
                // Marcas (whatsapp/instagram/...) sempre têm fundo saturado o
                // suficiente pra branco ficar legível; pro fallback, calcula
                // contraste de verdade contra o fundo real do círculo em vez
                // de confiar cegamente numa cor de texto que podia coincidir.
                const iconColor = isBrandType
                  ? (translucent ? baseBg : "#fff")
                  : (translucent ? site.theme.text : readableIconColor(baseBg, site.theme.text));
                return (
                  <button key={button.id} type="button" onClick={() => handleButton(button)} aria-label={button.label}
                    className="flex h-12 w-12 items-center justify-center rounded-full shadow-md transition active:scale-90 hover:scale-105 backdrop-blur-sm"
                    style={{ background: bg }}>
                    <ButtonIcon type={button.type} color={iconColor} />
                  </button>
                );
              })}
            </section>
          ) : null}

          {(site.promoCard?.enabled ?? true) ? (
            <section className="mt-5 rounded-[1.75rem] border p-4 backdrop-blur-xl" style={glassCard(site)}>
              <p className="text-sm font-black">{site.promoCard?.title || "Mais praticidade em um só lugar"}</p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: site.theme.muted }}>{site.promoCard?.description || "Acesse contatos, Pix, Wi-Fi, catálogo, rotas e avaliações sem procurar em vários lugares."}</p>
              <button type="button" onClick={() => document.getElementById(catalogId)?.scrollIntoView({ behavior: "smooth" })} className="mt-3 rounded-full px-4 py-2 text-xs font-black" style={{ background: site.theme.text, color: site.theme.background }}>{site.promoCard?.buttonLabel || "Ver mais"}</button>
            </section>
          ) : null}

          {/* Blocos reordenáveis do corpo (2026-09-06, pedido do Leonardo:
              "o Toqy não pode prender as pessoas a uma coisa só") — a
              pessoa arrasta a ordem no editor (ver bodyBlockOrder em
              SiteBuilder.tsx); aqui só renderiza na ordem salva. Sem
              bodyBlockOrder salvo (bio site criado antes desta feature),
              usa a ordem padrão de sempre. Bio site salvo com uma ordem
              ANTIGA (sem o bloco "hours", que só existe desde 2026-09-06)
              ganha o bloco novo reencaixado na posição padrão dele — ver
              resolveBodyBlockOrder em src/lib/bodyBlocks.ts. */}
          {resolveBodyBlockOrder(site.bodyBlockOrder).map((blockType) => {
            if (blockType === "buttons") {
              if (!mainButtons.length) return null;
              return (
                <section key="buttons" className={site.theme.buttonStyle === "icon" ? "mt-5 grid grid-cols-3 gap-3" : "mt-5 space-y-3"}>
                  {mainButtons.map((button) => {
                    const showIcon = site.theme.mainButtonDisplay !== "text-only";
                    if (site.theme.buttonStyle === "icon") {
                      { const s = buttonStyle(site, button.color); return <button key={button.id} type="button" onClick={() => handleButton(button)} className={`${radiusClass(site)} flex min-h-24 flex-col items-center justify-center gap-2 border p-3 text-center text-xs font-black shadow-lg transition active:scale-[0.98] ${button.pulse ? "pulse-attention" : ""}`} style={s.button}>{showIcon ? <ButtonIcon type={button.type} /> : null}<span style={s.text}>{button.label}</span></button>; }
                    }
                    // Hierarquia do mockup (só quando algum botão foi
                    // marcado como principal — ver useButtonHierarchy):
                    // o primário fica preenchido com a cor cheia e o
                    // ícone num círculo BRANCO; os demais viram cards
                    // claros com o ícone num círculo da mesma cor em
                    // opacidade baixa. Os dois ganham a seta à direita e
                    // min-h-[56px] (acima dos 44px mínimos de toque).
                    if (useButtonHierarchy) {
                      const isPrimary = button.isPrimary === true;
                      const primary = isPrimary ? buttonStyle(site, button.color) : null;
                      return (
                        <button
                          key={button.id}
                          type="button"
                          onClick={() => handleButton(button)}
                          className={`${radiusClass(site)} flex min-h-[56px] w-full items-center gap-3 border px-3.5 py-3 text-left text-sm font-black transition active:scale-[0.98] ${button.pulse ? "pulse-attention" : ""}`}
                          style={primary ? primary.button : secondaryButtonStyle(site)}
                        >
                          {showIcon ? (
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                              style={{ background: isPrimary ? "rgba(255,255,255,0.95)" : softTint(accent) }}
                            >
                              {/* Ícones de marca (WhatsApp/Instagram/...)
                                  são PNG já colorido e ignoram esta cor —
                                  dentro do círculo branco eles aparecem
                                  com a cor real da marca, que é o que o
                                  visitante reconhece. */}
                              <ButtonIcon type={button.type} color={accent} />
                            </span>
                          ) : null}
                          <span className="min-w-0 flex-1 truncate" style={primary ? primary.text : undefined}>{button.label}</span>
                          <ChevronRight className="h-5 w-5 shrink-0 opacity-70" />
                        </button>
                      );
                    }
                    { const s = buttonStyle(site, button.color); return <button key={button.id} type="button" onClick={() => handleButton(button)} className={`${radiusClass(site)} flex w-full items-center justify-center gap-2 border px-4 py-3.5 text-center text-sm font-black shadow-md backdrop-blur-xl transition active:scale-[0.98] ${button.pulse ? "pulse-attention" : ""}`} style={s.button}>{showIcon ? <ButtonIcon type={button.type} /> : null}<span style={s.text}>{button.label}</span></button>; }
                  })}
                </section>
              );
            }
            if (blockType === "hours") {
              // Renderiza só se o dono configurou (o próprio componente
              // devolve null quando businessHours está ausente/desligado).
              return <BusinessHoursCard key="hours" site={site} />;
            }
            if (blockType === "catalog") {
              return activeCatalog.length ? <CatalogSection key="catalog" site={site} items={activeCatalog} layout={catalogLayout} catalogId={catalogId} /> : null;
            }
            if (blockType === "music") {
              // 2ª revisão (2026-09-06): este bloco não é mais o player de
              // música em si (isso virou ambiente, ver BackgroundMusicPlayer
              // renderizado no topo da página) — é só o botão/ícone/prévia
              // do Spotify, molde do Music Link do Linktree.
              return site.spotifyUrl ? (
                <section key="music" className="mt-4">
                  <SpotifyLinkBlock url={site.spotifyUrl} label={site.spotifyLabel || "Ouça minha música"} display={site.spotifyDisplay ?? "button"} site={site} />
                </section>
              ) : null;
            }
            // Bloco de posts do Instagram desligado (2026-09-08, pedido
            // real: "tire o post do Instagram, não deu muito certo, pode
            // tirar"). site.instagramPosts continua salvo em quem já
            // tinha configurado — só parou de renderizar publicamente.
            if (blockType === "instagram") return null;
            // Formulário de captura virou modal sobreposto (2026-09-08,
            // pedido real: "deveria aparecer sobreposto, com pouca
            // opacidade em cima do biosite... não ficar jogado no meio
            // do biosite") — não tem mais posição no fluxo do corpo, ver
            // <LeadCaptureModal> renderizado fora deste loop, junto dos
            // outros modais (QR/Pix/Wi-Fi). Continua em
            // DEFAULT_BODY_BLOCK_ORDER só por compatibilidade com a
            // ordem já salva de bio sites antigos (ver bodyBlocks.ts).
            if (blockType === "leadForm") return null;
            return null;
          })}

          <footer className="mt-8 pb-6 text-center text-xs font-bold leading-relaxed" style={{ color: site.theme.muted }}>
            <p style={{ color: site.theme.muted }}>© {new Date().getFullYear()} {site.profile.name}. Todos os direitos reservados.</p>
            {/* Selo "Criado com TOQY" vs. marca do revendedor (white label).
                Histórico: o white label tinha sido REMOVIDO do produto em
                2026-09-01 ("nenhum plano promete mais esconder este selo",
                decisão do Leonardo). Decisão REVISTA em 2026-09-06 a pedido
                do primeiro assinante do plano Agência (R$99,90/mês, até 100
                bio sites): ele revende os bio sites pros clientes DELE e
                precisa entregar com a marca da própria agência, não com a
                do Toqy. Agora é recurso EXCLUSIVO do plano Agência.

                Este é o gate que vale de verdade — o do editor
                (SiteBuilder.tsx) é só conveniência de UI. A checagem aqui é
                contra `plan`, resolvido de site.ownerPlan, que é gravado
                pelo servidor no save (ver biositeSync.ts e
                api/biosite/save) e não pelo cliente: se alguém editar o
                JSON do bio site na mão pra ligar `whiteLabel` num plano
                menor, o selo do Toqy continua aparecendo.

                Padrão seguro: só esconde o selo se o dono for Agência E
                tiver marcado a opção E tiver de fato uma marca (nome ou
                logo) pra colocar no lugar — senão o rodapé ficaria vazio,
                que é pior que o selo pros dois lados. */}
            {(() => {
              const whiteLabel = plan.hasWhiteLabel ? site.whiteLabel : undefined;
              const brandName = whiteLabel?.brandName?.trim();
              const brandLogoUrl = whiteLabel?.brandLogoUrl?.trim();
              const hideBadge = Boolean(whiteLabel?.hideToqyBadge) && Boolean(brandName || brandLogoUrl);

              if (!hideBadge) {
                return (
                  <p className="mt-1" style={{ color: site.theme.muted }}>
                    Criado com{" "}
                    <a href="https://toqy.com.br" target="_blank" rel="noreferrer" className="font-black underline-offset-4 hover:underline" style={resolveColorStyle(site.theme.colors?.footerCreditText, "text", site.theme.primary)}>
                      TOQY
                    </a>
                  </p>
                );
              }

              const brand = (
                <span className="inline-flex items-center justify-center gap-2 align-middle">
                  {brandLogoUrl ? <img src={optimizedImageUrl(brandLogoUrl, 160)} alt={brandName || "Logo"} loading="lazy" decoding="async" className="max-h-6 w-auto object-contain" /> : null}
                  {brandName ? <span className="font-black">{brandName}</span> : null}
                </span>
              );
              // Mesmo tratamento de todo link externo do bio site
              // (ensureUrl em security.ts): completa "suaempresa.com.br"
              // pra https:// e, de quebra, impede que um esquema perigoso
              // (javascript:, data:) digitado no editor vire href de
              // verdade — vira "https://javascript:...", inofensivo.
              const brandUrl = ensureUrl(whiteLabel?.brandUrl);

              return (
                <p className="mt-1" style={{ color: site.theme.muted }}>
                  {brandUrl ? (
                    <a href={brandUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline" style={resolveColorStyle(site.theme.colors?.footerCreditText, "text", site.theme.primary)}>
                      {brand}
                    </a>
                  ) : (
                    brand
                  )}
                </p>
              );
            })()}
          </footer>
        </main>
      </div>

      {/* Formulário de captura como modal sobreposto, não bloco inline
          (ver nota grande no loop de blocos acima). Renderizado fora do
          fluxo do corpo, incondicional a bodyBlockOrder — o próprio
          componente decide sozinho se aparece (config.enabled + ainda
          não visto/recusado neste navegador + só na página pública de
          verdade, nunca no preview do editor). */}
      <LeadCaptureModal site={site} isPublicInstance={!instanceId} />

      {qrModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={() => setQrModal(false)}>
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="mb-4 text-sm font-black text-slate-500 uppercase tracking-widest">QR Code</p>
            <p className="mb-5 font-black text-slate-900 text-lg">{site.profile.name}</p>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 inline-block">
              <QRCodeSVG value={url} size={200} />
            </div>
            <p className="mt-4 text-xs text-slate-400 break-all max-w-[240px] mx-auto">{url}</p>
            <button onClick={() => { copyText(url, "qr"); }} className="mt-4 block w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white">
              {copied === "qr" ? "✓ Link copiado!" : "Copiar link"}
            </button>
            <button onClick={() => setQrModal(false)} className="mt-2 block w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600">Fechar</button>
          </div>
        </div>
      ) : null}
      {modal === "wifi" ? <WifiModal site={site} onClose={() => setModal(null)} copied={copied} copyText={copyText} /> : null}
      {modal === "maps" ? <MapsModal site={site} onClose={() => setModal(null)} /> : null}
      {modal === "pix" ? <PixModal site={site} onClose={() => setModal(null)} copied={copied} copyText={copyText} selectedAmount={selectedAmount} setSelectedAmount={setSelectedAmount} /> : null}
      {modal === "booking" ? <BookingModal site={site} onClose={() => setModal(null)} isPreview={Boolean(instanceId)} /> : null}
    </div>
  );
}

function CatalogSection({ site, items, layout, catalogId }: { site: ToqySite; items: CatalogItem[]; layout: CatalogLayout; catalogId: string }) {
  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category?.trim() || "Destaques"))), [items]);
  const filteredItems = activeCategory === "Todas" ? items : items.filter((item) => (item.category?.trim() || "Destaques") === activeCategory);

  // Vitrine flutuante por categoria (2026-07-13) — pedido real de clientes
  // do Toqy (ex: restaurante de yakisoba com categoria "Yakisoba de carne"):
  // clicar na FOTO de um item abre uma mini galeria mostrando os outros
  // itens da mesma categoria, sem sair da página. Usa a mesma lista COMPLETA
  // de itens (não a filtrada por activeCategory) — clicar na foto sempre
  // mostra a categoria inteira daquele item, mesmo que a pessoa esteja
  // vendo "Todas" no momento.
  const [galleryCategory, setGalleryCategory] = useState<string | null>(null);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const key = groupKey(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [items]);
  // Só abre a galeria se o grupo (categoria, ou categoria+subcategoria) tiver
  // mais de 1 item — grupo único não tem "mais peças" pra mostrar.
  const openGallery = (key: string) => {
    if ((categoryCounts.get(key) ?? 0) > 1) setGalleryCategory(key);
  };
  const galleryItems = galleryCategory ? items.filter((item) => groupKey(item) === galleryCategory) : [];
  // Título da galeria: se for um grupo de subcategoria, mostra só a parte
  // depois do "::" (ex: "Cadeiras"), não a chave interna inteira.
  const galleryTitle = galleryCategory?.includes("::") ? galleryCategory.split("::")[1] : galleryCategory;
  const whatsapp = whatsappUrl(site);
  const chipStyle = (active: boolean): React.CSSProperties => active
    ? { background: site.theme.primary, color: site.theme.mode === "light" ? "#fff" : "#06111F", borderColor: "transparent" }
    : { background: site.theme.mode === "light" ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.10)", color: site.theme.text, borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.16)" };

  // Agrupa itens por displaySection — itens com seção específica aparecem separados.
  // Bug real corrigido (2026-07-16): antes, cada modo (carrossel/grade/lista/
  // subcategorias) era um BLOCO FIXO, sempre renderizado nessa mesma ordem —
  // uma categoria em "Carrossel" aparecia SEMPRE antes de qualquer categoria
  // em "Lista", não importa a posição escolhida pelo cliente em "Exibição por
  // categoria" no editor (relatado com print: categoria configurada por
  // ÚLTIMO na lista aparecia PRIMEIRO no site publicado). Agora a ordem das
  // seções segue a ordem real das categorias no catálogo (mesma ordem
  // reordenável no editor, ver reorderCategory em SiteBuilder.tsx) — cada
  // categoria vira sua própria seção, na posição certa. Categorias sem
  // exibição específica ("padrão") continuam agrupadas numa seção só
  // (necessário pro Estilo padrão do catálogo combinar capas de várias
  // categorias numa grade/carrossel único), posicionada onde a primeira
  // categoria "padrão" apareceria.
  const itemsBySection = useMemo(() => {
    const destaques = filteredItems.filter(i => i.displaySection === "destaque");
    const rest = filteredItems.filter(i => i.displaySection !== "destaque");
    const categoryOrder = Array.from(new Set(rest.map(i => i.category?.trim()).filter((c): c is string => Boolean(c))));
    const modeOf = (category: string) => rest.find(i => i.category?.trim() === category)?.displaySection;
    const padraoCategories = new Set(categoryOrder.filter((cat) => {
      const mode = modeOf(cat);
      return mode !== "carrossel" && mode !== "grade" && mode !== "lista" && mode !== "subcategorias";
    }));
    const padraoItems = rest.filter(i => padraoCategories.has(i.category?.trim() ?? ""));

    type Section =
      | { kind: "padrao"; items: CatalogItem[] }
      | { kind: "category"; mode: "carrossel" | "grade" | "lista" | "subcategorias"; category: string; items: CatalogItem[] };
    const sections: Section[] = [];
    let padraoInserted = false;
    categoryOrder.forEach((category) => {
      if (padraoCategories.has(category)) {
        if (!padraoInserted) { sections.push({ kind: "padrao", items: padraoItems }); padraoInserted = true; }
        return;
      }
      sections.push({
        kind: "category",
        mode: modeOf(category) as "carrossel" | "grade" | "lista" | "subcategorias",
        category,
        items: rest.filter(i => i.category?.trim() === category),
      });
    });
    return { destaques, sections };
  }, [filteredItems]);

  const hasCustomSections = filteredItems.some(i => i.displaySection && i.displaySection !== "padrao");

  function renderLayout(l: CatalogLayout, items2: CatalogItem[]) {
    if (l === "grouped" || l === "category-carousel") {
      return (
        <div className="space-y-7">
          {uniqueGroups(items2).map(([group, groupItems]) => (
            <div key={group}>
              <h3 className="mb-3 text-base font-black" style={{ color: site.theme.muted }}>{group}</h3>
              <CatalogScroller site={site} items={groupItems} onOpenGallery={openGallery} />
            </div>
          ))}
        </div>
      );
    }
    const representative = representativeItemsByCategory(items2);
    if (l === "grid") return <div className="grid grid-cols-2 gap-3">{representative.map((item) => <CatalogCard key={item.id} site={site} item={item} compact onOpenGallery={openGallery} categoryCount={categoryCounts.get(groupKey(item)) ?? 1} />)}</div>;
    if (l === "stack") return <div className="space-y-4">{representative.map((item) => <CatalogCard key={item.id} site={site} item={item} stacked onOpenGallery={openGallery} categoryCount={categoryCounts.get(groupKey(item)) ?? 1} />)}</div>;
    return <CatalogScroller site={site} items={representative} onOpenGallery={openGallery} categoryCounts={categoryCounts} />;
  }

  return (
    <section id={catalogId} className="mt-8 scroll-mt-8">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={resolveColorStyle(site.theme.colors?.catalogSectionLabel, "text", site.theme.accent)}>Catálogo</p>
      {(site.showCatalogTitle ?? true) ? <h2 className="mt-1 text-2xl font-black" style={resolveColorStyle(site.theme.colors?.catalogTitle, "text", site.theme.text)}>{site.catalogTitle || "Produtos e serviços"}</h2> : null}
      {(site.showCatalogSubtitle ?? true) ? <p className="mt-1 text-sm leading-relaxed" style={{ color: site.theme.muted }}>{site.catalogSubtitle || "Selecionados para você. Toque em um item para pedir ou agendar."}</p> : null}

      {categories.length > 1 ? (
        <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          <button type="button" onClick={() => setActiveCategory("Todas")} className="shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-black transition" style={chipStyle(activeCategory === "Todas")}>Todas</button>
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => setActiveCategory(category)} className="shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-black transition" style={chipStyle(activeCategory === category)}>{category}</button>
          ))}
        </div>
      ) : null}

      <div className="mt-5">
        {hasCustomSections ? (
          // Modo por seção: cada categoria aparece separada, na ORDEM em que
          // aparece no catálogo (ver comentário de itemsBySection acima —
          // onOpenGallery não é passado nas seções carrossel/grade/lista
          // porque nada fica "escondido" pra abrir, já mostram tudo).
          <div className="space-y-8">
            {itemsBySection.destaques.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={resolveColorStyle(site.theme.colors?.catalogSectionLabel, "text", site.theme.accent)}>Destaques</p>
                <div className="space-y-4">{itemsBySection.destaques.map(item => <CatalogCard key={item.id} site={site} item={item} stacked />)}</div>
              </div>
            )}
            {itemsBySection.sections.map((section) => {
              if (section.kind === "padrao") {
                // Categorias "padrão" (sem exibição específica escolhida em
                // "Exibição por categoria") respeitam o Estilo padrão do
                // catálogo (renderLayout), agrupadas numa seção só.
                return <div key="padrao">{renderLayout(layout, section.items)}</div>;
              }
              const { category, mode, items } = section;
              if (mode === "carrossel") {
                return (
                  <div key={`carrossel-${category}`}>
                    <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{category}</p>
                    <CatalogScroller site={site} items={items} />
                  </div>
                );
              }
              if (mode === "grade") {
                return (
                  <div key={`grade-${category}`}>
                    <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{category}</p>
                    <div className="grid grid-cols-2 gap-3">{items.map(item => <CatalogCard key={item.id} site={site} item={item} compact />)}</div>
                  </div>
                );
              }
              if (mode === "lista") {
                return (
                  <div key={`lista-${category}`}>
                    <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{category}</p>
                    <div className="space-y-4">{items.map(item => <CatalogCard key={item.id} site={site} item={item} stacked />)}</div>
                  </div>
                );
              }
              // Subcategorias: categoria vira um cabeçalho (ex: "Home
              // Office"), e dentro dela 1 capa por subcategoria (ex:
              // Cadeiras, Mesas, Estantes) lado a lado — cada capa abre a
              // galeria só das fotos daquela subcategoria (groupKey separa
              // por categoria+subcategoria nesse modo).
              return (
                <div key={`subcat-${category}`}>
                  <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{category}</p>
                  <CatalogScroller site={site} items={representativeItemsByCategory(items)} onOpenGallery={openGallery} categoryCounts={categoryCounts} />
                </div>
              );
            })}
          </div>
        ) : (
          // Modo sem seções customizadas — nenhuma categoria tem exibição
          // específica, tudo segue o Estilo padrão do catálogo.
          renderLayout(layout, filteredItems)
        )}
      </div>

      {(whatsapp || site.catalogWaLabel) ? (
        <div className="mt-5 rounded-[1.5rem] border p-4 text-center backdrop-blur-xl" style={{ background: site.theme.mode === "light" ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.08)", borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.16)" }}>
          <p className="text-sm font-black" style={{ color: site.theme.text }}>{site.catalogWaLabel || "Não encontrou o que procura?"}</p>
          {/* Bug real corrigido (2026-07-16): cor do texto vinha fixa em
              "#fff" no código — se o usuário definisse "Cor dos botões"
              (theme.primary) como branco, o botão virava branco-no-branco,
              invisível, sem NENHUM controle de cor pra corrigir (não existia
              picker pra este botão específico). Agora reusa
              catalogActionBg/catalogActionText — os mesmos já editáveis na
              aba Catálogo ("Fundo botão de ação"/"Texto botão de ação"). */}
          {whatsapp ? <button type="button" onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")} className="mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-black" style={{ ...resolveColorStyle(site.theme.colors?.catalogActionBg, "bg", site.theme.primary), ...resolveColorStyle(site.theme.colors?.catalogActionText, "text", site.theme.mode === "light" ? "#fff" : "#06111F") }}><WhatsAppIcon className="h-4 w-4" />Fale com a gente no WhatsApp</button> : null}
        </div>
      ) : null}

      {galleryCategory ? (
        <CategoryGalleryModal site={site} category={galleryTitle ?? galleryCategory} items={galleryItems} onClose={() => setGalleryCategory(null)} />
      ) : null}
    </section>
  );
}

function CatalogScroller({ site, items, onOpenGallery, categoryCounts }: { site: ToqySite; items: CatalogItem[]; onOpenGallery?: (category: string) => void; categoryCounts?: Map<string, number> }) {
  return (
    <div className="flex snap-x gap-4 overflow-x-auto pb-3">
      {items.map((item) => (
        <CatalogCard key={item.id} site={site} item={item} onOpenGallery={onOpenGallery} categoryCount={categoryCounts?.get(groupKey(item)) ?? 1} />
      ))}
    </div>
  );
}

function CatalogCard({ site, item, compact = false, stacked = false, onOpenGallery, categoryCount = 1 }: { site: ToqySite; item: CatalogItem; compact?: boolean; stacked?: boolean; onOpenGallery?: (category: string) => void; categoryCount?: number }) {
  const width = stacked ? "w-full" : compact ? "w-full" : "min-w-[275px]";
  let imageHeight = compact ? "h-28" : "h-52";
  if (!compact) {
    if (item.imageLayout === "horizontal") imageHeight = "h-36";
    if (item.imageLayout === "vertical") imageHeight = "h-72";
  }
  const whatsapp = whatsappUrl(site);
  // Vitrine por categoria: só clicável quando tem mais de 1 item na mesma
  // categoria (senão não há "mais peças" pra mostrar na galeria).
  const canOpenGallery = Boolean(onOpenGallery) && categoryCount > 1;
  const handleImageClick = canOpenGallery ? () => onOpenGallery!(groupKey(item)) : undefined;
  const fitClass = item.imageFit === "contain" ? "object-contain bg-surface" : "object-cover";
  const positionStyle = item.imagePosition ? { objectPosition: item.imagePosition } : undefined;
  return (
    <article className={`${width} snap-start overflow-hidden rounded-[1.6rem] border shadow-xl backdrop-blur`} style={{ ...resolveColorStyle(site.theme.colors?.catalogItemBg, "bg", site.theme.card), borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.14)" }}>
      <div
        className={`${imageHeight} relative ${canOpenGallery ? "cursor-pointer" : ""}`}
        style={{ background: `linear-gradient(135deg, ${site.theme.primary}33, ${site.theme.secondary}44)` }}
        onClick={handleImageClick}
        role={canOpenGallery ? "button" : undefined}
        aria-label={canOpenGallery ? `Ver mais itens de ${item.subcategory?.trim() || item.category?.trim() || "Destaques"}` : undefined}
      >
        {item.videoUrl ? (
          <video src={item.videoUrl} autoPlay loop muted playsInline className={`h-full w-full ${fitClass}`} style={positionStyle} />
        ) : item.imageUrl ? (
          <img src={optimizedImageUrl(item.imageUrl, 500)} alt={item.name} loading="lazy" decoding="async" className={`h-full w-full ${fitClass}`} style={positionStyle} />
        ) : (
          <div className="flex h-full items-center justify-center"><FileText className="h-10 w-10 opacity-60" /></div>
        )}
        {canOpenGallery ? (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-sm">
            <Images className="h-3 w-3" />+{categoryCount - 1}
          </span>
        ) : null}
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        {item.highlight ? <span className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-black" style={{ background: site.theme.colors?.catalogItemHighlight ? colorSwatch(site.theme.colors.catalogItemHighlight, "#b45309") + "22" : "#fef3c7", ...resolveColorStyle(site.theme.colors?.catalogItemHighlight, "text", "#b45309") }}>{item.highlight}</span> : null}
        {/* Item "só foto" (2026-07-16) — nome/descrição agora são opcionais
            (ver BulkCatalogPhotoAdd/SiteBuilder). Sem isso, um item sem nome
            mostrava um <h3> vazio ocupando espaço em branco no card. */}
        {item.name ? <h3 className={compact ? "text-sm font-black leading-tight" : "text-lg font-black"} style={resolveColorStyle(site.theme.colors?.catalogItemName, "text", site.theme.text)}>{item.name}</h3> : null}
        {item.description ? <p className={compact ? "mt-1 line-clamp-3 text-xs leading-relaxed" : "mt-2 text-sm leading-relaxed"} style={resolveColorStyle(site.theme.colors?.catalogItemDesc, "text", site.theme.muted)}>{item.description}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          {item.price ? <span className={compact ? "text-xs font-black" : "font-black"} style={resolveColorStyle(site.theme.colors?.catalogItemPrice, "text", site.theme.accent)}>{item.price}</span> : <span />}
          <div className="flex items-center gap-2">
            {whatsapp && site.showCatalogWhatsapp !== false ? <button type="button" aria-label="Falar no WhatsApp" onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.18)", color: site.theme.text }}><WhatsAppIcon className="h-4 w-4" /></button> : null}
            {/* Bug real corrigido (2026-07-16): botão "Ver" aparecia em TODO
                item enquanto o toggle geral "Botão Ver nos itens" estivesse
                ligado, mesmo em fotos sem nenhum texto/link configurado —
                sem jeito de tirar o botão de UMA foto específica. Agora só
                aparece se o próprio item tem "Texto do botão" ou "Link do
                botão" preenchido — item vazio (só foto) não mostra botão,
                mesmo com o toggle geral ligado. */}
            {site.showCatalogAction !== false && (item.actionLabel || item.actionUrl) ? <button type="button" onClick={() => { const href = item.actionUrl ? ensureUrl(item.actionUrl) : whatsapp; if (href) window.open(href, "_blank", "noopener,noreferrer"); }} className="rounded-full px-4 py-2 text-xs font-black" style={{ ...resolveColorStyle(site.theme.colors?.catalogActionBg, "bg", site.theme.primary), ...resolveColorStyle(site.theme.colors?.catalogActionText, "text", site.theme.mode === "light" ? "#fff" : "#06111F") }}>{item.actionLabel || "Ver"}</button> : null}
          </div>
        </div>
      </div>
    </article>
  );
}

// Vitrine flutuante de categoria (2026-07-13) — abre por cima da página ao
// clicar na foto de um item do catálogo, mostrando os outros itens da MESMA
// categoria em grade. Reusa o ModalShell já usado pelo Pix/Wi-Fi, mesmo
// padrão visual (bottom-sheet no mobile, fecha ao tocar fora ou no X).
function CategoryGalleryModal({ site, category, items, onClose }: { site: ToqySite; category: string; items: CatalogItem[]; onClose: () => void }) {
  const whatsapp = whatsappUrl(site);
  return (
    <ModalShell title={category} onClose={onClose} site={site} icon={<Images className="h-6 w-6" />}>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-[1.2rem] border" style={{ ...resolveColorStyle(site.theme.colors?.catalogItemBg, "bg", site.theme.card), borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.14)" }}>
            <div className="h-28" style={{ background: `linear-gradient(135deg, ${site.theme.primary}33, ${site.theme.secondary}44)` }}>
              {item.videoUrl ? (
                <video src={item.videoUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
              ) : item.imageUrl ? (
                <img src={optimizedImageUrl(item.imageUrl, 260)} alt={item.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center"><FileText className="h-8 w-8 opacity-60" /></div>
              )}
            </div>
            {/* Item "só foto" (2026-07-16): sem nome/preço/link próprio, não
                mostra rodapé nenhum (nome vazio + botão "Ver" abrindo o
                WhatsApp do site por padrão não fazia sentido pra uma foto
                solta de galeria, ex: "Diretoria"). */}
            {(item.name || item.price || item.actionUrl) ? (
              <div className="p-2.5">
                {item.name ? <p className="line-clamp-2 text-xs font-black leading-tight" style={resolveColorStyle(site.theme.colors?.catalogItemName, "text", site.theme.text)}>{item.name}</p> : null}
                {item.price ? <p className="mt-1 text-xs font-black" style={resolveColorStyle(site.theme.colors?.catalogItemPrice, "text", site.theme.accent)}>{item.price}</p> : null}
                <button
                  type="button"
                  onClick={() => { const href = item.actionUrl ? ensureUrl(item.actionUrl) : whatsapp; if (href) window.open(href, "_blank", "noopener,noreferrer"); }}
                  className="mt-2 w-full rounded-full px-2 py-1.5 text-[11px] font-black"
                  style={{ ...resolveColorStyle(site.theme.colors?.catalogActionBg, "bg", site.theme.primary), ...resolveColorStyle(site.theme.colors?.catalogActionText, "text", site.theme.mode === "light" ? "#fff" : "#06111F") }}
                >
                  {item.actionLabel || "Ver"}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function PixModal({ site, onClose, copied, copyText, selectedAmount, setSelectedAmount }: { site: ToqySite; onClose: () => void; copied: string; copyText: (value: string, key: string) => Promise<void>; selectedAmount?: number; setSelectedAmount: (value?: number) => void }) {
  const proofPhone = (site.pix.whatsappProofNumber || site.contact.whatsapp || site.contact.phone).replace(/\D/g, "");
  const proofUrl = proofPhone ? `https://wa.me/${proofPhone}?text=${encodeURIComponent(`Olá! Já realizei o pagamento via Pix${selectedAmount ? ` no valor de R$ ${selectedAmount.toFixed(2).replace(".", ",")}` : ""} e vou enviar o comprovante.`)}` : "";
  return (
    <ModalShell title="Pix inteligente" onClose={onClose} site={site} icon={<CreditCard className="h-6 w-6" />}>
      <div className="rounded-[1.75rem] bg-white p-4 text-center text-slate-950 shadow-xl">
        <div className="mx-auto w-fit rounded-3xl bg-slate-50 p-4"><QRCodeSVG value={pixPayload(site, selectedAmount)} size={190} /></div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Recebedor</p>
        <p className="text-lg font-black">{site.pix.receiver || site.profile.name}</p>
        {site.pix.bank ? <p className="text-xs font-bold text-slate-500">{site.pix.bank}</p> : null}
        {site.pix.quickAmounts.length ? <div className="mt-4 flex flex-wrap justify-center gap-2">{site.pix.quickAmounts.map((amount) => <button key={amount} onClick={() => setSelectedAmount(selectedAmount === amount ? undefined : amount)} className={`rounded-full px-4 py-2 text-xs font-black ${selectedAmount === amount ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>R$ {amount}</button>)}</div> : null}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
          <p className="text-xs font-black text-slate-400">Chave Pix</p>
          <p className="mt-1 break-all font-mono text-sm font-black text-slate-900">{site.pix.key || "Configure a chave Pix"}</p>
        </div>
        <div className="mt-4 grid gap-2">
          <button onClick={() => copyText(site.pix.key, "pix")} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{copied === "pix" ? "Chave copiada" : "Copiar chave Pix"}</button>
          {proofUrl ? <button onClick={() => window.open(proofUrl, "_blank")} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">Já paguei / enviar comprovante</button> : null}
        </div>
      </div>
    </ModalShell>
  );
}

function WifiModal({ site, onClose, copied, copyText }: { site: ToqySite; onClose: () => void; copied: string; copyText: (value: string, key: string) => Promise<void> }) {
  const rawCheckinUrl = site.wifi.checkinUrl || site.links.googleReviewUrl || site.contact.facebook || site.contact.instagram || "";
  const checkinUrl = rawCheckinUrl === site.contact.instagram ? normalizeInstagram(rawCheckinUrl) : ensureUrl(rawCheckinUrl);
  const defaultCheckinLabel = site.wifi.checkinUrl
    ? "Fazer check-in"
    : site.links.googleReviewUrl
    ? "Avaliar no Google"
    : site.contact.facebook
    ? "Curtir no Facebook"
    : site.contact.instagram
    ? "Seguir no Instagram"
    : "Fazer check-in / avaliar";
  return (
    <ModalShell title="Rede Wi-Fi" onClose={onClose} site={site} icon={<Wifi className="h-6 w-6" />}>
      <div className="rounded-[1.75rem] bg-white p-4 text-center text-slate-950 shadow-xl">
        <p className="mx-auto max-w-[260px] text-sm font-bold text-slate-500">Escaneie o QR Code para conectar. Depois aproveite para seguir ou avaliar o estabelecimento.</p>
        <div className="mx-auto mt-4 w-fit rounded-3xl bg-slate-50 p-4"><QRCodeSVG value={wifiPayload(site)} size={190} /></div>
        <div className="mt-4 grid gap-2 text-left">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-black text-slate-400">Rede</p><p className="font-black">{site.wifi.ssid || "Rede Wi-Fi"}</p></div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"><div><p className="text-xs font-black text-slate-400">Senha</p><p className="font-mono font-black">{site.wifi.password || "sem senha"}</p></div><button onClick={() => copyText(site.wifi.password, "wifi")} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"><Copy className="mr-1 inline h-3 w-3" />{copied === "wifi" ? "Copiado" : "Copiar"}</button></div>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-xs font-black text-slate-400">Depois de conectar</p>
          {checkinUrl ? <button onClick={() => window.open(checkinUrl, "_blank", "noopener,noreferrer")} className="mt-3 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"><MapPin className="mr-2 inline h-4 w-4" />{site.wifi.checkinLabel || defaultCheckinLabel}</button> : null}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {site.contact.instagram ? <button onClick={() => window.open(normalizeInstagram(site.contact.instagram), "_blank", "noopener,noreferrer")} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700"><InstagramIcon className="mr-1 inline h-4 w-4" />Instagram</button> : null}
            {site.contact.facebook ? <button onClick={() => window.open(ensureUrl(site.contact.facebook), "_blank", "noopener,noreferrer")} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700"><Globe2 className="mr-1 inline h-4 w-4" />Facebook</button> : null}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

// "Como chegar" (2026-09-08, pedido real com print de referência: card
// com endereço, mapa com pino, botão "Maps" e opção de Waze).
//
// O mapa EMBUTIDO foi removido no mesmo dia (bug real reportado ao vivo,
// com print): "Este conteúdo está bloqueado. Entre em contato com o
// proprietário do site para corrigir o problema." — mensagem do PRÓPRIO
// Google. Causa: o truque de embed sem chave de API
// (maps.google.com/maps?output=embed) na verdade injeta uma API KEY
// COMPARTILHADA do Google por trás (confirmado inspecionando o HTML
// devolvido) — não é uma chave nossa, é uma chave interna que MILHÕES de
// sites usando esse mesmo truque compartilham. O Google pode (e
// aparentemente estava, na hora do teste) throttlar/bloquear essa chave
// compartilhada sem aviso nenhum, a qualquer momento — inviável pra um
// produto pago com clientes reais. Ficam o endereço e os botões "Maps"/
// "Waze" (deep links de verdade, sem depender de embed nenhum — sempre
// funcionam). Mapa visual embutido de verdade exigiria uma API key
// PRÓPRIA do Google Maps Embed API (tem cota gratuita generosa, mas
// precisa o Leonardo criar um projeto no Google Cloud — fora do escopo
// desta correção).
function MapsModal({ site, onClose }: { site: ToqySite; onClose: () => void }) {
  const googleUrl = googleMapsExternalUrl(site);
  const wazeUrl = wazeExternalUrl(site);
  return (
    <ModalShell title="Como chegar" onClose={onClose} site={site} icon={<MapPin className="h-6 w-6" />}>
      <div className="rounded-[1.75rem] bg-white p-4 text-slate-950 shadow-xl">
        <p className="text-sm font-bold text-slate-600">{site.profile.location || site.profile.name}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {googleUrl ? (
            <button onClick={() => window.open(googleUrl, "_blank", "noopener,noreferrer")} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700">
              <ExternalLink className="h-4 w-4" /> Maps
            </button>
          ) : null}
          {wazeUrl ? (
            <button onClick={() => window.open(wazeUrl, "_blank", "noopener,noreferrer")} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700">
              <WazeIcon className="h-4 w-4" /> Waze
            </button>
          ) : null}
        </div>
        {googleUrl ? (
          <button onClick={() => window.open(googleUrl, "_blank", "noopener,noreferrer")} className="mt-2 w-full rounded-2xl px-4 py-3 text-sm font-black text-white" style={{ background: site.theme.primary }}>
            <MapPin className="mr-2 inline h-4 w-4" />Nossa Localização
          </button>
        ) : null}
      </div>
    </ModalShell>
  );
}

// Agendamento nativo (2026-09-07, referência Coonexta) — fluxo "escolher
// serviço → escolher dia → escolher horário → confirmar" dentro do
// próprio modal. Horários vêm de /api/biosite-booking/available (nunca
// expõe quem reservou, só a lista de "HH:MM" livres); confirmar chama
// /api/biosite-booking, que recalcula tudo de novo no servidor.
//
// isPreview (2026-09-08, bug real reportado ao vivo: "coloco horário de
// funcionamento, ok... quando vou em serviço e coloco agendar, marco a
// data, fala que não tem horário disponível") — dentro do EDITOR
// (instanceId setado), a rota /available consulta o bio site já SALVO
// no banco: um site novo ainda não publicado (ou horário editado mas
// ainda não clicou "Salvar") não existe lá ainda, ou existe com os
// dados ANTIGOS — a prévia sempre batia "sem horário disponível" sem
// explicar por quê. Em preview, calcula os horários DIRETO do estado em
// memória (mesma função pura generateSlotsForDay do servidor), sem rede
// — reflete exatamente o que está sendo editado agora, salvo ou não.
// ponytail: não sabe quais horários já foram reservados nesse caso (só
// o banco sabe) — mostra todos os horários possíveis do expediente,
// suficiente pra testar a configuração; horários de fato ocupados só
// somem na PÁGINA PÚBLICA real (fetch de verdade, embaixo).
function BookingModal({ site, onClose, isPreview }: { site: ToqySite; onClose: () => void; isPreview?: boolean }) {
  const services = (site.services ?? []).filter((s) => s.enabled);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const minDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setTime("");
    setSlots([]);
    if (!serviceId || !date) return;
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    if (isPreview) {
      const [year, month, day] = date.split("-").map(Number);
      const weekday = new Date(year, month - 1, day).getDay();
      setSlots(generateSlotsForDay(site.businessHours, weekday, service.durationMinutes, site.bookingSlotMinutes ?? 30, []));
      return;
    }

    setLoadingSlots(true);
    fetch(`/api/biosite-booking/available?bioSiteId=${encodeURIComponent(site.id)}&serviceId=${encodeURIComponent(serviceId)}&date=${date}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, date, site.id, isPreview]);

  async function confirm() {
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/biosite-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bioSiteId: site.id, serviceId, name, phone, notes, date, time }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível confirmar.");
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Não foi possível confirmar.");
    }
  }

  if (!services.length) return null;

  if (status === "done") {
    return (
      <ModalShell title="Agendamento" onClose={onClose} site={site} icon={<CalendarCheck className="h-6 w-6" />}>
        <div className="rounded-[1.75rem] bg-white p-6 text-center text-slate-950 shadow-xl">
          <p className="text-lg font-black">Agendamento confirmado! ✅</p>
          <p className="mt-2 text-sm font-bold text-slate-500">{name}, seu horário em {date?.split("-").reverse().join("/")} às {time} está reservado.</p>
          <button onClick={onClose} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Fechar</button>
        </div>
      </ModalShell>
    );
  }

  const canConfirm = date && time && name.trim() && phone.trim() && status !== "sending";

  return (
    <ModalShell title="Agendar horário" onClose={onClose} site={site} icon={<CalendarCheck className="h-6 w-6" />}>
      <div className="rounded-[1.75rem] bg-white p-4 text-slate-950 shadow-xl">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Serviço</span>
          <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}{s.price ? ` — ${s.price}` : ""}</option>)}
          </select>
        </label>

        <label className="mt-3 block">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Dia</span>
          <input type="date" min={minDate} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        {date ? (
          <div className="mt-3">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Horário</span>
            {loadingSlots ? (
              <p className="mt-2 text-sm font-bold text-slate-400">Buscando horários...</p>
            ) : slots.length ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button key={slot} type="button" onClick={() => setTime(slot)} className={`rounded-xl px-3 py-2 text-xs font-black ${time === slot ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>{slot}</button>
                ))}
              </div>
            ) : !site.businessHours?.enabled ? (
              <p className="mt-2 text-sm font-bold text-slate-400">Configure o &ldquo;Horário de funcionamento&rdquo; (aba Aparência) pra liberar horários de agendamento.</p>
            ) : (
              <p className="mt-2 text-sm font-bold text-slate-400">Sem horários disponíveis neste dia.</p>
            )}
          </div>
        ) : null}

        {time ? (
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold" placeholder="Telefone / WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <textarea className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold" rows={2} placeholder="Observações (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
            <button disabled={!canConfirm} onClick={confirm} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{status === "sending" ? "Confirmando..." : "Confirmar agendamento"}</button>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, site, children, icon }: { title: string; onClose: () => void; site: ToqySite; children: React.ReactNode; icon: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}><div className="max-h-[92vh] w-full max-w-[420px] overflow-y-auto rounded-[2rem] border p-4 shadow-2xl" style={{ background: site.theme.card, borderColor: "rgba(255,255,255,0.16)", color: site.theme.text }} onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ ...resolveColorStyle(site.theme.colors?.modalIconBg, "bg", site.theme.primary), color: site.theme.mode === "light" ? "#fff" : "#06111F" }}>{icon}</div><h3 className="text-xl font-black">{title}</h3></div><button onClick={onClose} className="rounded-full p-2" style={{ background: "rgba(255,255,255,.12)" }}><X className="h-5 w-5" /></button></div>{children}</div></div>;
}

export default PublicBioSite;
