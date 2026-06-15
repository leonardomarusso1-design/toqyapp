import { Camera, MessageCircle, Star, Wifi, CreditCard } from "lucide-react";

const buttons = [
  { label: "WhatsApp", icon: MessageCircle },
  { label: "Instagram", icon: Camera },
  { label: "Pix", icon: CreditCard },
  { label: "Avaliar no Google", icon: Star },
  { label: "Wi-Fi", icon: Wifi },
];

export function PhoneMockup() {
  return (
    <div className="mx-auto w-full max-w-[330px] rounded-[2.8rem] border border-white/15 bg-black p-3 shadow-glow">
      <div className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-gradient-to-b from-night-850 to-night-950 p-5">
        <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-white/15" />
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/15 text-2xl font-black text-gold-500">
            BA
          </div>
          <h3 className="mt-4 text-xl font-black">Barbearia Andrian</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Agendamentos, redes sociais, avaliação e Wi-Fi em um só lugar.
          </p>
        </div>
        <div className="mt-6 space-y-3">
          {buttons.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-black">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">Criado com Toqy</p>
      </div>
    </div>
  );
}
