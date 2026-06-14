"use client";

import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import type { ToqyButton, ToqyLinkType, ToqySite } from "@/lib/types";
import { buttonTypeOptions, defaultLabelForType, syncModulesFromButtons } from "@/lib/buttonSync";
import { generateId, normalizeInstagram } from "@/lib/security";

type Props = { site: ToqySite; onChange: (site: ToqySite) => void };
const input = "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500";
const label = "text-sm font-black text-slate-800";

export function ButtonEditor({ site, onChange }: Props) {
  function commit(next: ToqySite) { onChange(syncModulesFromButtons({ ...next, updatedAt: new Date().toISOString() })); }
  function updateButton(id: string, patch: Partial<ToqyButton>) { commit({ ...site, buttons: site.buttons.map((button) => button.id === id ? { ...button, ...patch } : button) }); }
  function addButton() { commit({ ...site, buttons: [...site.buttons, { id: generateId("btn"), label: "Novo botão", type: "custom", url: "", enabled: true }] }); }
  function removeButton(id: string) { commit({ ...site, buttons: site.buttons.filter((button) => button.id !== id) }); }
  function duplicateButton(button: ToqyButton) { commit({ ...site, buttons: [...site.buttons, { ...button, id: generateId("btn"), label: `${button.label} cópia` }] }); }
  function moveButton(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= site.buttons.length) return;
    const buttons = [...site.buttons];
    [buttons[index], buttons[target]] = [buttons[target], buttons[index]];
    commit({ ...site, buttons });
  }
  function updateContact(patch: Partial<ToqySite["contact"]>) { commit({ ...site, contact: { ...site.contact, ...patch } }); }
  function updateLinks(patch: Partial<ToqySite["links"]>) { commit({ ...site, links: { ...site.links, ...patch } }); }
  function destinationFields(button: ToqyButton) {
    switch (button.type) {
      case "whatsapp": return <div className="grid gap-4 md:grid-cols-2"><Field title="Número do WhatsApp" value={site.contact.whatsapp} onChange={(v) => updateContact({ whatsapp: v })} placeholder="5511999999999" /><label className="md:col-span-2"><span className={label}>Mensagem padrão</span><textarea className={input} rows={3} value={site.contact.whatsappMessage} onChange={(e) => updateContact({ whatsappMessage: e.target.value })} /></label></div>;
      case "instagram": return <Field title="Usuário ou link do Instagram" value={site.contact.instagram ?? ""} onChange={(v) => updateContact({ instagram: v })} onBlur={(v) => updateContact({ instagram: normalizeInstagram(v) })} placeholder="@usuario" />;
      case "phone": return <Field title="Telefone" value={site.contact.phone} onChange={(v) => updateContact({ phone: v })} placeholder="5511999999999" />;
      case "maps": return <Field title="Link do Google Maps" value={site.links.googleMapsUrl ?? ""} onChange={(v) => updateLinks({ googleMapsUrl: v })} placeholder="https://maps.google.com/..." />;
      case "review": return <Field title="Link de avaliação Google" value={site.links.googleReviewUrl ?? ""} onChange={(v) => updateLinks({ googleReviewUrl: v })} placeholder="https://g.page/r/..." />;
      case "booking": return <Field title="Link de agendamento" value={site.links.bookingUrl ?? ""} onChange={(v) => updateLinks({ bookingUrl: v })} placeholder="https://..." />;
      case "website": return <Field title="Link do site" value={site.contact.website ?? ""} onChange={(v) => updateContact({ website: v })} placeholder="https://..." />;
      case "email": return <Field title="E-mail" value={site.contact.email ?? ""} onChange={(v) => updateContact({ email: v })} placeholder="contato@empresa.com" />;
      case "menu": return <Field title="Link do cardápio" value={site.links.menuUrl ?? ""} onChange={(v) => updateLinks({ menuUrl: v })} placeholder="https://..." />;
      case "wifi": return <Notice text="Este botão abre o modal de Wi-Fi. Configure rede e senha na etapa Pix e Wi-Fi." />;
      case "pix": return <Notice text="Este botão abre o modal Pix. Configure chave Pix na etapa Pix e Wi-Fi." />;
      case "pixHub": return <Notice text="Este botão abre a experiência Pix Hub. Configure os dados Pix na etapa Pix e Wi-Fi." />;
      case "catalog": return <Notice text="Este botão leva até o catálogo. Configure produtos/serviços na etapa Catálogo." />;
      default: return <Field title="Link de destino" value={button.url ?? ""} onChange={(v) => updateButton(button.id, { url: v })} placeholder="https://..." />;
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div><h2 className="text-2xl font-black text-slate-950">Links e Botões</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">Adicione, remova, organize e configure os botões. O preview muda na hora.</p></div>
        <button type="button" onClick={addButton} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" />Adicionar botão</button>
      </div>
      <div className="mt-5 grid gap-4">
        {site.buttons.length ? site.buttons.map((button, index) => {
          const meta = buttonTypeOptions.find((item) => item.type === button.type) ?? buttonTypeOptions[buttonTypeOptions.length - 1];
          return (
            <article key={button.id} className={`rounded-3xl border p-4 ${button.enabled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-80"}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0"><p className="text-lg font-black text-slate-950">{button.label || meta.label}</p><p className="mt-1 text-sm text-slate-500">{meta.description}</p></div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => moveButton(index, -1)} className="rounded-xl border border-slate-200 p-2 text-slate-700 disabled:opacity-30" disabled={index === 0}><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveButton(index, 1)} className="rounded-xl border border-slate-200 p-2 text-slate-700 disabled:opacity-30" disabled={index === site.buttons.length - 1}><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => duplicateButton(button)} className="rounded-xl border border-slate-200 p-2 text-slate-700"><Copy className="h-4 w-4" /></button>
                  <button type="button" onClick={() => removeButton(button.id)} className="rounded-xl border border-red-200 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <Field title="Nome do botão" value={button.label} onChange={(v) => updateButton(button.id, { label: v })} />
                <label><span className={label}>Tipo do botão</span><select className={input} value={button.type} onChange={(e) => updateButton(button.id, { type: e.target.value as ToqyLinkType, label: button.label || defaultLabelForType(e.target.value as ToqyLinkType) })}>{buttonTypeOptions.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</select></label>
                <label className="flex items-end gap-2 pb-3 text-sm font-black text-slate-700"><input type="checkbox" checked={button.enabled} onChange={(e) => updateButton(button.id, { enabled: e.target.checked })} />Ativo</label>
              </div>
              <div className="mt-4">{destinationFields(button)}</div>
            </article>
          );
        }) : <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Nenhum botão. Clique em “Adicionar botão”.</div>}
      </div>
    </section>
  );
}

function Field({ title, value, onChange, onBlur, placeholder }: { title: string; value: string; onChange: (value: string) => void; onBlur?: (value: string) => void; placeholder?: string }) {
  return <label><span className={label}>{title}</span><input className={input} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={(e) => onBlur?.(e.target.value)} /></label>;
}
function Notice({ text }: { text: string }) { return <p className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-relaxed text-blue-800">{text}</p>; }
