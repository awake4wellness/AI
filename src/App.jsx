// ═══════════════════════════════════════════════════════════════
// AWAKE4WELLNESS — ARQUITECTURA MODULAR v4.0
// Sistema de plugins: agrega integraciones sin tocar el core
//
// CÓMO AGREGAR UN NUEVO MÓDULO:
// 1. Crear archivo: src/plugins/MiDispositivo.plugin.jsx
// 2. Exportar objeto con la estructura PluginDefinition
// 3. Importar y registrar en pluginRegistry.js
// 4. Listo — aparece automáticamente en sidebar y navegación
//
// NUNCA modifiques: AppShell, CoreServices, PluginRegistry
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, createContext, useContext } from "react";

// ─────────────────────────────────────────────────────────────
// 1. DESIGN SYSTEM (tokens compartidos por todos los plugins)
// ─────────────────────────────────────────────────────────────
export const DS = {
  colors: {
    bg: "#060B16",
    surface: "rgba(255,255,255,0.03)",
    surfaceHover: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.07)",
    text: "#E2E8F0",
    muted: "#64748B",
    dim: "#334155",
    primary: "#38BDF8",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    purple: "#818CF8",
    orange: "#F97316",
    thermo: "#FF4D4D",
    echo: "#6366F1",
    teal: "#2DD4BF",
    pink: "#F472B6",
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  font: "'DM Sans', 'Segoe UI', sans-serif",
};

const dim = (color, opacity = 0.12) => {
  const map = {
    "#38BDF8": `rgba(56,189,248,${opacity})`,
    "#10B981": `rgba(16,185,129,${opacity})`,
    "#F59E0B": `rgba(245,158,11,${opacity})`,
    "#EF4444": `rgba(239,68,68,${opacity})`,
    "#818CF8": `rgba(129,140,248,${opacity})`,
    "#F97316": `rgba(249,115,22,${opacity})`,
    "#FF4D4D": `rgba(255,77,77,${opacity})`,
    "#6366F1": `rgba(99,102,241,${opacity})`,
    "#2DD4BF": `rgba(45,212,191,${opacity})`,
    "#F472B6": `rgba(244,114,182,${opacity})`,
  };
  return map[color] || `${color}20`;
};

// ─────────────────────────────────────────────────────────────
// 2. SHARED UI COMPONENTS (usables por cualquier plugin)
// ─────────────────────────────────────────────────────────────
export function Card({ children, style = {}, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: DS.colors.surface,
        border: `1px solid ${hov && color ? `${color}35` : DS.colors.border}`,
        borderRadius: DS.radius.lg,
        padding: 20,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        transform: hov && onClick ? "translateY(-1px)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Badge({ children, color = DS.colors.primary }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 9px",
      borderRadius: 20, background: dim(color),
      color, border: `1px solid ${color}30`,
    }}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, color = DS.colors.primary, height = 5 }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
    </div>
  );
}

export function Avatar({ name = "", color = DS.colors.primary, size = 40 }) {
  const init = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      background: dim(color), border: `1px solid ${color}35`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.3, fontWeight: 800, color, flexShrink: 0,
    }}>
      {init}
    </div>
  );
}

export function StatCard({ label, value, sub, color, icon }) {
  return (
    <Card color={color}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: dim(color), border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: -1 }}>{value}</div>
          <div style={{ fontSize: 11, color: DS.colors.muted }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: DS.colors.dim }}>{sub}</div>}
        </div>
      </div>
    </Card>
  );
}

export function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#0F1628", border: `1px solid ${DS.colors.border}`, borderRadius: 18, padding: 28, width: "100%", maxWidth: width, maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: DS.colors.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.colors.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <div>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: DS.colors.muted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${DS.colors.border}`, borderRadius: 10, color: DS.colors.text, fontSize: 14, padding: "10px 14px", fontFamily: "inherit", boxSizing: "border-box", outline: "none", ...style }}
      />
    </div>
  );
}

export function Btn({ children, onClick, color = DS.colors.primary, disabled = false, fullWidth = false, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: dim(color), border: `1px solid ${color}35`,
      color, borderRadius: 10, padding: "10px 20px",
      fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1, width: fullWidth ? "100%" : "auto",
      transition: "all 0.2s", fontFamily: "inherit", ...style,
    }}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. CORE SERVICES (auth, db, ai — nunca cambian)
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL = "TU_SUPABASE_URL_AQUI";
const SUPABASE_KEY = "TU_SUPABASE_ANON_KEY_AQUI";
const OPENAI_KEY   = "TU_OPENAI_API_KEY_AQUI";
const IS_DEMO      = SUPABASE_URL.includes("TU_");
const AI_DEMO      = OPENAI_KEY.includes("TU_");

export const CoreServices = {
  // Auth
  async signIn(email, pass) {
    if (IS_DEMO) { localStorage.setItem("a4w_user", JSON.stringify({ email, id: "demo" })); return { user: { email, id: "demo" } }; }
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY }, body: JSON.stringify({ email, password: pass }) });
    const d = await r.json();
    if (d.access_token) { localStorage.setItem("a4w_token", d.access_token); localStorage.setItem("a4w_user", JSON.stringify(d.user)); }
    return d;
  },
  signOut() { localStorage.removeItem("a4w_token"); localStorage.removeItem("a4w_user"); },
  getUser() { try { return JSON.parse(localStorage.getItem("a4w_user")); } catch { return null; } },
  getToken() { return localStorage.getItem("a4w_token"); },

  // Database
  async query(table, filters = {}, cols = "*") {
    if (IS_DEMO) return { data: [], error: null };
    const token = this.getToken();
    const params = Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`).join("&");
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${cols}${params ? "&" + params : ""}`;
    const r = await fetch(url, { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` } });
    const d = await r.json();
    return { data: Array.isArray(d) ? d : [], error: d.error || null };
  },
  async insert(table, body) {
    if (IS_DEMO) return { data: [{ ...body, id: Date.now().toString() }], error: null };
    const token = this.getToken();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}`, "Prefer": "return=representation" }, body: JSON.stringify(Array.isArray(body) ? body : [body]) });
    const d = await r.json();
    return { data: d, error: d.error || null };
  },

  // Storage (for images)
  async uploadFile(bucket, path, file) {
    if (IS_DEMO) return { url: URL.createObjectURL(file), error: null };
    const token = this.getToken();
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, { method: "POST", headers: { "Authorization": `Bearer ${token}`, "apikey": SUPABASE_KEY }, body: file });
    const d = await r.json();
    return { url: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`, error: d.error || null };
  },

  // AI
async askAI(messages, systemPrompt, onChunk) {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-4o", stream: true, max_tokens: 1200, temperature: 0.3, messages: [{ role: "system", content: systemPrompt }, ...messages] }) });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const reader = res.body.getReader(); const dec = new TextDecoder(); let full = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; const lines = dec.decode(value).split("\n").filter(l => l.startsWith("data: ") && !l.includes("[DONE]")); for (const l of lines) { try { const d = JSON.parse(l.slice(6)); const t = d.choices?.[0]?.delta?.content || ""; if (t) { full += t; onChunk && onChunk(full); } } catch {} } }
      return full;
    },
};

// ─────────────────────────────────────────────────────────────
// 4. APP CONTEXT (estado global compartido)
// ─────────────────────────────────────────────────────────────
const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

// ─────────────────────────────────────────────────────────────
// 5. PLUGIN REGISTRY — EL CORAZÓN DEL SISTEMA
// ─────────────────────────────────────────────────────────────
//
// ESTRUCTURA DE UN PLUGIN:
// {
//   id: "mi-plugin",           // único, snake_case
//   name: "Mi Plugin",         // nombre en sidebar
//   icon: "🔌",                // emoji o SVG
//   color: "#38BDF8",          // color del plugin
//   group: "clinical",         // "clinical"|"devices"|"ai"|"business"|"education"
//   version: "1.0.0",
//   description: "...",
//   component: MiPluginScreen, // React component principal
//   // Opcionales:
//   badge: "NEW",              // badge en sidebar
//   patientAction: true,       // mostrar botón en detalle del paciente
//   patientActionLabel: "Abrir en Mi Plugin",
//   onPatientAction: (patient, navigate) => navigate("mi-plugin", patient),
//   settings: [],              // configuración del plugin
//   requiredPermissions: [],   // permisos necesarios
// }

const PLUGIN_GROUPS = {
  clinical:  { label: "Clínico",        icon: "🩺" },
  devices:   { label: "Dispositivos",   icon: "🔌" },
  ai:        { label: "Inteligencia IA",icon: "🧠" },
  business:  { label: "Negocio",        icon: "💼" },
  education: { label: "Educación",      icon: "📚" },
};

// ─── DEMO DATA ────────────────────────────────────────────────
const DEMO_PATIENTS = [
  { id: "1", nombre: "Carlos", apellido: "Mendoza", edad: 34, condicion_principal: "Tendinopatía rotuliana", nivel_actividad: "Atleta", email: "carlos@demo.com" },
  { id: "2", nombre: "Ana Sofía", apellido: "Reyes", edad: 28, condicion_principal: "Esguince tobillo grado II", nivel_actividad: "Moderado", email: "ana@demo.com" },
  { id: "3", nombre: "Jorge", apellido: "Villalobos", edad: 52, condicion_principal: "Artrosis de rodilla", nivel_actividad: "Leve", email: "jorge@demo.com" },
  { id: "4", nombre: "María F.", apellido: "Castro", edad: 41, condicion_principal: "Dolor lumbar crónico", nivel_actividad: "Sedentario", email: "maria@demo.com" },
];
const DEMO_SESSIONS = [
  { id: "s1", paciente_id: "1", numero_sesion: 7, protocolo: "HILT", eva_pre: 6, eva_post: 3, fecha: new Date().toISOString(), notas: "Buena respuesta", duracion_minutos: 20 },
  { id: "s2", paciente_id: "2", numero_sesion: 3, protocolo: "Crioterapia", eva_pre: 8, eva_post: 5, fecha: new Date(Date.now() - 86400000).toISOString(), notas: "Mejoría evidente", duracion_minutos: 15 },
  { id: "s3", paciente_id: "3", numero_sesion: 12, protocolo: "Rehabilitación", eva_pre: 4, eva_post: 2, fecha: new Date(Date.now() - 86400000 * 3).toISOString(), notas: "Excelente progreso", duracion_minutos: 45 },
];

// ─────────────────────────────────────────────────────────────
// 6. BUILT-IN PLUGINS (los que vienen de fábrica)
// ─────────────────────────────────────────────────────────────

// ── PLUGIN: Dashboard ──────────────────────────────────────
function DashboardPlugin({ patients, sessions, navigate }) {
  const { C } = useApp();
  const mejoria = sessions.filter(s => s.eva_pre && s.eva_post).length
    ? Math.round(sessions.filter(s => s.eva_pre && s.eva_post).reduce((a, s) => a + ((s.eva_pre - s.eva_post) / s.eva_pre * 100), 0) / sessions.filter(s => s.eva_pre && s.eva_post).length)
    : 0;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Dashboard Clínico</h2>
        <p style={{ margin: "5px 0 0", color: C.muted, fontSize: 13 }}>{new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard label="Pacientes Activos" value={patients.length} color={C.primary} icon="👥" sub="en seguimiento" />
        <StatCard label="Sesiones Totales" value={sessions.length} color={C.success} icon="📅" sub="registradas" />
        <StatCard label="Mejoría Promedio" value={`${mejoria}%`} color={C.purple} icon="📈" sub="reducción dolor" />
        <StatCard label="Módulos Activos" value={pluginRegistry.length} color={C.warning} icon="🔌" sub="conectados" />
      </div>

      {/* Quick access to plugins */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 16 }}>ACCESO RÁPIDO — MÓDULOS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {pluginRegistry.filter(p => p.id !== "dashboard" && p.id !== "patients").map(plugin => (
            <Card key={plugin.id} color={plugin.color} onClick={() => navigate(plugin.id)} style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{plugin.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{plugin.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{plugin.description}</div>
              {plugin.badge && <div style={{ marginTop: 8 }}><Badge color={plugin.color}>{plugin.badge}</Badge></div>}
            </Card>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 16 }}>ACTIVIDAD RECIENTE</div>
        {sessions.slice(0, 5).map(ses => {
          const pac = patients.find(p => p.id === ses.paciente_id);
          const mej = ses.eva_pre && ses.eva_post ? Math.round((ses.eva_pre - ses.eva_post) / ses.eva_pre * 100) : null;
          return (
            <div key={ses.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <Avatar name={`${pac?.nombre} ${pac?.apellido}`} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{pac?.nombre} {pac?.apellido}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Sesión {ses.numero_sesion} · {ses.protocolo}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {mej !== null && <Badge color={mej > 0 ? C.success : C.danger}>{mej > 0 ? `↓${mej}%` : "="}</Badge>}
                <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{new Date(ses.fecha).toLocaleDateString("es-ES")}</div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── PLUGIN: Patients ───────────────────────────────────────
function PatientsPlugin({ patients, sessions, onAddPatient, navigate }) {
  const { C } = useApp();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const FORM_INIT = { nombre: "", apellido: "", fecha_nacimiento: "", edad: "", sexo: "", telefono: "", email: "", condicion_principal: "", deporte: "", nivel_actividad: "Moderado" };
  const [form, setForm] = useState(FORM_INIT);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = patients.filter(p => `${p.nombre} ${p.apellido} ${p.condicion_principal}`.toLowerCase().includes(search.toLowerCase()));

  async function save() {
    setSaving(true);
    await onAddPatient(form);
    setShowModal(false);
    setForm(FORM_INIT);
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Pacientes</h2>
          <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{patients.length} activos</p>
        </div>
        <Btn onClick={() => setShowModal(true)} color={C.primary}>+ Nuevo Paciente</Btn>
      </div>
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..." style={{ marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {filtered.map(p => {
          const patSess = sessions.filter(s => s.paciente_id === p.id);
          const mej = patSess.filter(s => s.eva_pre && s.eva_post).length
            ? Math.round(patSess.filter(s => s.eva_pre && s.eva_post).reduce((a, s) => a + ((s.eva_pre - s.eva_post) / s.eva_pre * 100), 0) / patSess.filter(s => s.eva_pre && s.eva_post).length)
            : 0;
          return (
            <Card key={p.id} color={C.primary} onClick={() => navigate("patient-detail", p)}>
              <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                <Avatar name={`${p.nombre} ${p.apellido}`} size={46} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{p.nombre} {p.apellido}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {p.edad ? `${p.edad} años` : p.fecha_nacimiento ? new Date().getFullYear() - new Date(p.fecha_nacimiento).getFullYear() + " años" : ""}
                    {p.sexo ? ` · ${p.sexo}` : ""} · {p.nivel_actividad}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <Badge color={C.primary}>{p.condicion_principal}</Badge>
                    {p.deporte && <Badge color={C.teal}>{p.deporte}</Badge>}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[{ l: "Sesiones", v: patSess.length, c: C.primary }, { l: "Mejoría", v: `${mej}%`, c: mej > 50 ? C.success : C.warning }, { l: "Última", v: patSess.length ? new Date(patSess[0].fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) : "—", c: C.muted }].map(m => (
                  <div key={m.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: 9, color: C.muted }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Paciente" width={620}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* Nombre y Apellido */}
          <Input label="Nombre" value={form.nombre} onChange={e => upd("nombre", e.target.value)} placeholder="Carlos" />
          <Input label="Apellido" value={form.apellido} onChange={e => upd("apellido", e.target.value)} placeholder="Mendoza" />

          {/* Fecha de nacimiento */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Fecha de Nacimiento</label>
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={e => upd("fecha_nacimiento", e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: "10px 14px", fontFamily: "inherit", boxSizing: "border-box", outline: "none", colorScheme: "dark" }}
            />
          </div>

          {/* Edad */}
          <Input label="Edad (años)" type="number" value={form.edad} onChange={e => upd("edad", e.target.value)} placeholder="34" />

          {/* Sexo — fila completa */}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>Sexo</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ v: "Masculino", icon: "♂" }, { v: "Femenino", icon: "♀" }, { v: "Otro", icon: "○" }].map(o => (
                <button key={o.v} onClick={() => upd("sexo", o.v)} style={{
                  flex: 1, padding: "11px 8px", borderRadius: 10,
                  border: `1px solid ${form.sexo === o.v ? `${C.teal}50` : C.border}`,
                  background: form.sexo === o.v ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.03)",
                  color: form.sexo === o.v ? C.teal : C.muted,
                  fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}>
                  <span style={{ fontSize: 20 }}>{o.icon}</span> {o.v}
                </button>
              ))}
            </div>
          </div>

          {/* Teléfono y Email */}
          <Input label="Teléfono / WhatsApp" value={form.telefono} onChange={e => upd("telefono", e.target.value)} placeholder="+1 555 0000" />
          <Input label="Email" value={form.email} onChange={e => upd("email", e.target.value)} placeholder="carlos@email.com" />

          {/* Condición principal — fila completa */}
          <div style={{ gridColumn: "1/-1" }}>
            <Input label="Condición Principal" value={form.condicion_principal} onChange={e => upd("condicion_principal", e.target.value)} placeholder="Ej: Tendinopatía rotuliana, Dolor lumbar crónico..." />
          </div>

          {/* Deporte */}
          <Input label="Deporte principal" value={form.deporte} onChange={e => upd("deporte", e.target.value)} placeholder="Ej: Tenis, Pickleball, Golf..." />

          {/* Nivel actividad */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>Nivel de Actividad</label>
            <div style={{ display: "flex", gap: 4 }}>
              {["Sedentario", "Leve", "Moderado", "Activo", "Atleta"].map(o => (
                <button key={o} onClick={() => upd("nivel_actividad", o)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 8,
                  border: `1px solid ${form.nivel_actividad === o ? `${C.primary}50` : C.border}`,
                  background: form.nivel_actividad === o ? C.primaryDim : "rgba(255,255,255,0.03)",
                  color: form.nivel_actividad === o ? C.primary : C.muted,
                  fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                }}>{o}</button>
              ))}
            </div>
          </div>

        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <Btn onClick={() => setShowModal(false)} color={C.muted}>Cancelar</Btn>
          <Btn onClick={save} disabled={saving || !form.nombre} color={C.success}>
            {saving ? "Guardando..." : "✓ Crear Paciente"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HISTORIA CLÍNICA v3 — Integrada con Killer Practical
// 11 secciones · 9 módulos · 4 capas diagnósticas
// ═══════════════════════════════════════════════════════════════
function HistoriaClinicaV3({ patient, C }) {
  const [seccion, setSeccion] = useState("s1");
  const [hc, setHc] = useState({
    // S1 Datos
    nombre: patient?.nombre + " " + patient?.apellido || "",
    fecha_nacimiento: "",
    edad: patient?.edad || "",
    sexo: "",
    documento: "", telefono: "", email: patient?.email || "",
    ocupacion: "", nivel_actividad: patient?.nivel_actividad || "",
    deporte: "", fecha_consulta: new Date().toLocaleDateString("es-ES"),
    // S2 Motivo
    motivo: "", eva: 0, tipo_dolor: [], localizacion: "", patron: "", irradiacion: "",
    // S3 Enfermedad
    inicio: "", evolucion: "", agravantes: "", aliviantes: "", trat_previos: "", estudios_previos: "",
    // S4 Antecedentes
    ant_medicos: "", ant_quirurgicos: "", ant_trauma: "", alergias: "", medicamentos: "", ant_deportivos: "", ant_laborales: "", ant_familiares: "",
    // S4 Killer Practical — lesiones sospechadas
    lesiones_sospecha: {},
    // S5 Evaluación física
    mecanismo: {}, inspeccion: [], palpacion: "", movilidad: "", fuerza: "",
    pruebas_ortopedicas: {}, red_flags: {},
    // S6 Módulos especializados
    psqi: 0, isi: 0, epworth: 0, horas_sueno: 7,
    dix_hallpike: "negativo", dhi: 0, red_flags_vestibular: false,
    cadenas: {}, causa_funcional: "",
    vitD: "", cortisol: "", pcr: "", tsh: "", glucosa: "", magnesio: "",
    suplementos: {},
    // S7 Tecnología
    termografia: {}, ecografia: [],
    // S8 Diagnóstico
    dx_estructural: "", dx_funcional: "", dx_sistemica: "", dx_neurologica: "",
    grado_estructural: "", grado_funcional: "", grado_sistemica: "", grado_neurologica: "",
    dx_principal: "", dx_secundarios: "",
    // S9 Plan
    hilt_potencia: "", hilt_energia: "", hilt_modo: "", hilt_duracion: "", hilt_zona: "", hilt_sesiones: "",
    crioterapia_modalidad: "", crioterapia_timing: "",
    biowave: false, bemer: false, tens: false, acupuntura: false,
    rehab_fase: "",
    // S10 Seguimiento
    seguimiento: [], alta: "",
    // Notas
    notas: "",
  });

  const upd = (k, v) => setHc(p => ({ ...p, [k]: v }));
  const updObj = (k, sk, v) => setHc(p => ({ ...p, [k]: { ...p[k], [sk]: v } }));
  const toggleArr = (k, v) => setHc(p => ({ ...p, [k]: p[k]?.includes(v) ? p[k].filter(x => x !== v) : [...(p[k] || []), v] }));

  const inp = (key, placeholder = "", multiline = false) => multiline
    ? <textarea value={hc[key]} onChange={e => upd(key, e.target.value)} placeholder={placeholder} rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, padding: "9px 12px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
    : <input value={hc[key]} onChange={e => upd(key, e.target.value)} placeholder={placeholder} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, padding: "9px 12px", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />;

  const lbl = (text) => <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 5 }}>{text}</label>;
  const sec = (text) => <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>{text}</div>;
  const h2 = (text, color = C.teal) => <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 10, marginTop: 20 }}>▸ {text}</div>;
  const alertBox = (text, color = C.warning) => <div style={{ background: `${color}10`, border: `1px solid ${color}25`, borderLeft: `4px solid ${color}`, borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: C.muted }}>{text}</div>;

  const checkOpt = (key, value, label, color = C.primary) => (
    <div onClick={() => { const arr = hc[key] || []; upd(key, arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]); }}
      style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 7, cursor: "pointer", background: (hc[key] || []).includes(value) ? `${color}10` : "transparent", border: `1px solid ${(hc[key] || []).includes(value) ? `${color}30` : C.border}`, transition: "all 0.15s" }}>
      <div style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${(hc[key] || []).includes(value) ? color : C.muted}`, background: (hc[key] || []).includes(value) ? `${color}20` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color, flexShrink: 0 }}>{(hc[key] || []).includes(value) ? "✓" : ""}</div>
      <span style={{ fontSize: 12, color: (hc[key] || []).includes(value) ? C.text : C.muted }}>{label}</span>
    </div>
  );

  const toggleOpt = (objKey, field, label, color = C.primary) => (
    <div onClick={() => updObj(objKey, field, !hc[objKey]?.[field])}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 5, background: hc[objKey]?.[field] ? `${color}10` : "transparent", border: `1px solid ${hc[objKey]?.[field] ? `${color}30` : C.border}`, transition: "all 0.15s" }}>
      <span style={{ fontSize: 12, color: hc[objKey]?.[field] ? C.text : C.muted }}>{label}</span>
      <div style={{ width: 32, height: 17, borderRadius: 9, background: hc[objKey]?.[field] ? color : "rgba(255,255,255,0.08)", position: "relative", transition: "background 0.2s" }}>
        <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: hc[objKey]?.[field] ? 17 : 2, transition: "left 0.2s" }} />
      </div>
    </div>
  );

  const kpLesionRow = (id, label, hallazgo, color) => (
    <div key={id} onClick={() => updObj("lesiones_sospecha", id, !hc.lesiones_sospecha?.[id])}
      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: hc.lesiones_sospecha?.[id] ? `${color}10` : "transparent", border: `1px solid ${hc.lesiones_sospecha?.[id] ? `${color}30` : C.border}`, transition: "all 0.15s" }}>
      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${hc.lesiones_sospecha?.[id] ? color : C.muted}`, background: hc.lesiones_sospecha?.[id] ? `${color}20` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color, flexShrink: 0, marginTop: 1 }}>{hc.lesiones_sospecha?.[id] ? "✓" : ""}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: hc.lesiones_sospecha?.[id] ? C.text : C.muted, fontWeight: hc.lesiones_sospecha?.[id] ? 700 : 400 }}>{label}</div>
        <div style={{ fontSize: 10, color: C.dim }}>{hallazgo}</div>
      </div>
    </div>
  );

  const SECCIONES = [
    { id: "s1", label: "👤 Datos" },
    { id: "s2", label: "🎯 Motivo" },
    { id: "s3", label: "📋 Enfermedad" },
    { id: "s4", label: "🦴 Antecedentes + KP" },
    { id: "s5", label: "🔬 Evaluación Física" },
    { id: "s6", label: "🧠 Módulos" },
    { id: "s7", label: "🌡️ Tecnología" },
    { id: "s8", label: "⚕️ Diagnóstico 4C" },
    { id: "s9", label: "⚡ Plan" },
    { id: "s10", label: "📈 Seguimiento" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
      {/* Sidebar navegación */}
      <div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 10, position: "sticky", top: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: 2, padding: "0 6px", marginBottom: 8 }}>HISTORIA CLÍNICA v3</div>
          {SECCIONES.map(s => (
            <button key={s.id} onClick={() => setSeccion(s.id)} style={{ width: "100%", display: "flex", alignItems: "center", padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, textAlign: "left", fontSize: 11, fontWeight: seccion === s.id ? 700 : 400, background: seccion === s.id ? "rgba(45,212,191,0.12)" : "transparent", color: seccion === s.id ? C.teal : C.muted, borderLeft: seccion === s.id ? `2px solid ${C.teal}` : "2px solid transparent" }}>
              {s.label}
            </button>
          ))}
          <div style={{ marginTop: 12, padding: "0 4px" }}>
            <button style={{ width: "100%", padding: "9px", borderRadius: 9, background: "rgba(16,185,129,0.12)", border: `1px solid rgba(16,185,129,0.3)`, color: C.success, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              💾 Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div>
        {/* S1 — Datos del Paciente */}
        {seccion === "s1" && <div>
          {sec("1. DATOS DEL PACIENTE")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* Nombre completo — fila entera */}
            <div style={{ gridColumn: "1/-1" }}>
              {lbl("Nombre completo")}{inp("nombre", "Carlos Mendoza")}
            </div>

            {/* Fecha de nacimiento */}
            <div>
              {lbl("Fecha de nacimiento")}
              <input
                type="date"
                value={hc.fecha_nacimiento}
                onChange={e => upd("fecha_nacimiento", e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, padding: "9px 12px", fontFamily: "inherit", boxSizing: "border-box", outline: "none", colorScheme: "dark" }}
              />
            </div>

            {/* Edad */}
            <div>{lbl("Edad (años)")}{inp("edad", "34")}</div>

            {/* Sexo — fila entera con botones */}
            <div style={{ gridColumn: "1/-1" }}>
              {lbl("Sexo")}
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { v: "Masculino",  icon: "♂" },
                  { v: "Femenino",   icon: "♀" },
                  { v: "Otro",       icon: "○" },
                ].map(o => (
                  <button key={o.v} onClick={() => upd("sexo", o.v)} style={{
                    flex: 1, padding: "10px 8px", borderRadius: 9,
                    border: `1px solid ${hc.sexo === o.v ? `${C.teal}50` : C.border}`,
                    background: hc.sexo === o.v ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.03)",
                    color: hc.sexo === o.v ? C.teal : C.muted,
                    fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <span style={{ fontSize: 18 }}>{o.icon}</span> {o.v}
                  </button>
                ))}
              </div>
            </div>

            {/* Documento */}
            <div>{lbl("Documento de identidad")}{inp("documento", "Ej: 123456789")}</div>

            {/* Teléfono */}
            <div>{lbl("Teléfono / WhatsApp")}{inp("telefono", "+1 555 0000")}</div>

            {/* Email */}
            <div>{lbl("Correo electrónico")}{inp("email", "paciente@email.com")}</div>

            {/* Ocupación */}
            <div>{lbl("Ocupación")}{inp("ocupacion", "Ej: Deportista, Oficinista...")}</div>

            {/* Deporte */}
            <div>{lbl("Deporte principal")}{inp("deporte", "Ej: Tenis, Pickleball, Golf...")}</div>

            {/* Fecha consulta */}
            <div>{lbl("Fecha de consulta")}{inp("fecha_consulta", "")}</div>

            {/* Nivel actividad — fila entera */}
            <div style={{ gridColumn: "1/-1" }}>
              {lbl("Nivel de actividad física")}
              <div style={{ display: "flex", gap: 6 }}>
                {["Sedentario", "Leve", "Moderado", "Activo", "Atleta"].map(o => (
                  <button key={o} onClick={() => upd("nivel_actividad", o)} style={{
                    flex: 1, padding: "9px 6px", borderRadius: 8,
                    border: `1px solid ${hc.nivel_actividad === o ? `${C.teal}50` : C.border}`,
                    background: hc.nivel_actividad === o ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.03)",
                    color: hc.nivel_actividad === o ? C.teal : C.muted,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                  }}>{o}</button>
                ))}
              </div>
            </div>

          </div>
        </div>}

        {/* S2 — Motivo de Consulta */}
        {seccion === "s2" && <div>
          {sec("2. MOTIVO DE CONSULTA")}
          <div style={{ marginBottom: 16 }}>{lbl("Motivo principal")}{inp("motivo", "Descripción detallada del motivo de consulta...", true)}</div>
          <div style={{ marginBottom: 16 }}>
            {lbl("EVA — Escala Visual Analógica (1-10)")}
            <div style={{ display: "flex", gap: 5 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n} onClick={() => upd("eva", n)} style={{ flex: 1, height: 40, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, cursor: "pointer", background: hc.eva === n ? (n <= 3 ? "rgba(16,185,129,0.3)" : n <= 6 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)") : (n <= 3 ? "rgba(16,185,129,0.07)" : n <= 6 ? "rgba(245,158,11,0.07)" : "rgba(239,68,68,0.07)"), border: `1px solid ${hc.eva === n ? (n <= 3 ? C.success : n <= 6 ? C.warning : C.danger) : "rgba(255,255,255,0.06)"}`, color: n <= 3 ? C.success : n <= 6 ? C.warning : C.danger }}>{n}</div>)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              {lbl("Tipo de dolor")}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {["Agudo mecánico", "Crónico persistente", "Quemante / neuropático", "Irradiado", "Nocturno", "Generalizado"].map(t => checkOpt("tipo_dolor", t, t))}
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 14 }}>{lbl("Localización")}{inp("localizacion", "Ej: rodilla derecha, zona lumbar...")}</div>
              <div style={{ marginBottom: 14 }}>{lbl("Patrón temporal")}{inp("patron", "Constante / Intermitente / Al movimiento...")}</div>
              <div>{lbl("Irradiación")}{inp("irradiacion", "¿Se irradia a algún lugar?")}</div>
            </div>
          </div>
        </div>}

        {/* S3 — Enfermedad Actual */}
        {seccion === "s3" && <div>
          {sec("3. ENFERMEDAD ACTUAL")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>{lbl("Inicio de síntomas")}{inp("inicio", "Fecha aproximada o período...")}</div>
            <div>{lbl("Evolución")}{inp("evolucion", "¿Cómo ha progresado?", true)}</div>
            <div>{lbl("Factores agravantes")}{inp("agravantes", "¿Qué empeora los síntomas?", true)}</div>
            <div>{lbl("Factores aliviantes")}{inp("aliviantes", "¿Qué mejora los síntomas?", true)}</div>
            <div>{lbl("Tratamientos previos")}{inp("trat_previos", "Tratamientos anteriores y resultados...", true)}</div>
            <div>{lbl("Estudios previos")}{inp("estudios_previos", "Imágenes, labs, evaluaciones...", true)}</div>
          </div>
        </div>}

        {/* S4 — Antecedentes + Killer Practical */}
        {seccion === "s4" && <div>
          {sec("4. ANTECEDENTES + DIAGNÓSTICO DIFERENCIAL — KILLER PRACTICAL")}
          {alertBox("📋 Integra antecedentes con diagnóstico diferencial según el Killer Practical Manual Clínico. Marca la lesión sospechada según el mecanismo y hallazgos.", C.teal)}

          {h2("4.1 Antecedentes Generales")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <div>{lbl("Antecedentes médicos")}{inp("ant_medicos", "", true)}</div>
            <div>{lbl("Cirugías / procedimientos")}{inp("ant_quirurgicos", "", true)}</div>
            <div>{lbl("Trauma / lesiones previas")}{inp("ant_trauma", "", true)}</div>
            <div>{lbl("Alergias")}{inp("alergias", "")}</div>
            <div>{lbl("Medicamentos actuales")}{inp("medicamentos", "", true)}</div>
            <div>{lbl("Antecedentes deportivos")}{inp("ant_deportivos", "", true)}</div>
          </div>

          {h2("4.2 Lesiones Musculares — Killer Practical", C.success)}
          {alertBox("💪 Mecanismo: contracción excesiva, sobrecarga, fatiga, trauma directo", C.success)}
          {[
            ["dist", "Distensión muscular", "Dolor agudo, espasmo, limitación funcional"],
            ["dsg1", "Desgarro Grado I", "Microrrupturas, dolor localizado sin pérdida funcional total"],
            ["dsg2", "Desgarro Grado II", "Ruptura parcial, hematoma, debilidad moderada"],
            ["dsg3", "Desgarro Grado III ⚠️", "Ruptura completa, pérdida funcional severa"],
            ["cont", "Contractura muscular", "Rigidez y dolor persistente"],
            ["mios", "Miositis", "Dolor, edema y debilidad"],
          ].map(([id, label, hallazgo]) => kpLesionRow(id, label, hallazgo, C.success))}

          {h2("4.3 Lesiones Tendinosas — Killer Practical", C.warning)}
          {alertBox("⚡ Mecanismo: sobrecarga repetitiva, microtrauma crónico, cambio brusco de carga", C.warning)}
          {[
            ["tend_a", "Tendinitis aguda", "Dolor mecánico y sensibilidad al tacto"],
            ["tend_c", "Tendinosis crónica", "Degeneración crónica sin inflamación marcada"],
            ["rot", "Tendinopatía rotuliana", "Dolor infrapatelar, empeora al subir escaleras"],
            ["aqu", "Tendinopatía Aquiles", "Rigidez matutina, dolor en cordón de Aquiles"],
            ["epic", "Epicondilitis lateral", "Dolor lateral codo, Cozen +"],
            ["mang", "Manguito rotador", "Dolor nocturno, limitación abducción, Neer/Hawkins +"],
          ].map(([id, label, hallazgo]) => kpLesionRow(id, label, hallazgo, C.warning))}

          {h2("4.4 Lesiones Ligamentosas — Killer Practical", C.primary)}
          {alertBox("🔵 Mecanismo: trauma, torsión, valgo/varo forzado, caída", C.primary)}
          {[
            ["esq1", "Esguince Grado I", "Estiramiento, dolor leve sin inestabilidad"],
            ["esq2", "Esguince Grado II", "Ruptura parcial, edema, inestabilidad moderada"],
            ["esq3", "Esguince Grado III ⚠️", "Ruptura completa, inestabilidad severa"],
            ["lca", "Lesión LCA", "Inestabilidad, falseo, Lachman +"],
            ["lcm", "Lesión LCM", "Dolor medial, valgo forzado +"],
          ].map(([id, label, hallazgo]) => kpLesionRow(id, label, hallazgo, C.primary))}

          {h2("4.5 Lesiones Articulares — Killer Practical", C.teal)}
          {[
            ["artr", "Artrosis", "Rigidez matutina, dolor progresivo, crepitación"],
            ["meni", "Lesión meniscal", "Bloqueo articular, derrame, McMurray +"],
            ["burs", "Bursitis", "Dolor localizado, edema puntual"],
            ["caps", "Capsulitis adhesiva", "Pérdida global movilidad hombro"],
          ].map(([id, label, hallazgo]) => kpLesionRow(id, label, hallazgo, C.teal))}

          {h2("4.6 Lesiones Neuromusculares — Killer Practical", C.danger)}
          {alertBox("🧠 Buscar: irradiación, parestesias, déficit neurológico, características neuropáticas", C.danger)}
          {[
            ["ciat", "Ciática", "Dolor irradiado lumbo-glúteo-pierna"],
            ["radl", "Radiculopatía lumbar", "Dolor irradiado pierna, déficit motor"],
            ["radc", "Radiculopatía cervical", "Dolor irradiado brazo, parestesias"],
            ["fibr", "Fibromialgia", "Dolor generalizado, 18 tender points"],
            ["piri", "Síndrome piriforme", "Dolor glúteo irradiado, FAIR +"],
          ].map(([id, label, hallazgo]) => kpLesionRow(id, label, hallazgo, C.danger))}

          {Object.values(hc.lesiones_sospecha).filter(Boolean).length > 0 && (
            <div style={{ marginTop: 16, background: "rgba(45,212,191,0.08)", border: `1px solid rgba(45,212,191,0.25)`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, marginBottom: 6 }}>✓ LESIONES SOSPECHADAS ({Object.values(hc.lesiones_sospecha).filter(Boolean).length})</div>
              <div style={{ fontSize: 12, color: C.muted }}>Correlacionar con pruebas ortopédicas en Sección 5 y termografía en Sección 7</div>
            </div>
          )}
        </div>}

        {/* S5 — Evaluación Física + Algoritmo KP */}
        {seccion === "s5" && <div>
          {sec("5. EVALUACIÓN FÍSICA — ALGORITMO KILLER PRACTICAL")}
          {alertBox("🔬 Algoritmo: Historia → Mecanismo → Inspección → Palpación → Movilidad → Fuerza → Pruebas ortopédicas → Red flags", C.teal)}

          {h2("PASO 1 — Mecanismo de Lesión")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 20 }}>
            {[
              ["Contracción excesiva / sprint", "Desgarro muscular Grado I-III"],
              ["Sobrecarga repetitiva crónica", "Tendinosis / Tendinopatía"],
              ["Torsión tobillo o rodilla", "Esguince Grado I-II-III"],
              ["Trauma directo articulación", "Bursitis / Lesión meniscal"],
              ["Pivot / valgo forzado rodilla", "Lesión LCA / LCM"],
              ["Dolor irradiado + parestesias", "Radiculopatía / Ciática / STC"],
              ["Dolor generalizado + fatiga", "Fibromialgia / Miositis"],
              ["Trauma de alta energía", "⚠️ Red flag — descartar fractura"],
            ].map(([mec, lesion]) => (
              <div key={mec} onClick={() => updObj("mecanismo", mec, !hc.mecanismo?.[mec])} style={{ display: "flex", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: hc.mecanismo?.[mec] ? "rgba(45,212,191,0.10)" : "transparent", border: `1px solid ${hc.mecanismo?.[mec] ? "rgba(45,212,191,0.35)" : C.border}`, transition: "all 0.15s" }}>
                <div style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${hc.mecanismo?.[mec] ? C.teal : C.muted}`, background: hc.mecanismo?.[mec] ? "rgba(45,212,191,0.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.teal, flexShrink: 0, marginTop: 1 }}>{hc.mecanismo?.[mec] ? "✓" : ""}</div>
                <div><div style={{ fontSize: 11, color: hc.mecanismo?.[mec] ? C.text : C.muted }}>{mec}</div><div style={{ fontSize: 10, color: C.dim }}>{lesion}</div></div>
              </div>
            ))}
          </div>

          {h2("PASO 2 — Inspección y Palpación")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div>
              {lbl("Hallazgos inspección")}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {["Postura normal", "Actitud antálgica", "Edema visible", "Hematoma", "Atrofia muscular", "Deformidad"].map(h => checkOpt("inspeccion", h, h, C.orange))}
              </div>
            </div>
            <div>{lbl("Palpación (hallazgos)")}{inp("palpacion", "Zona dolorosa, contractura, calor, edema...", true)}</div>
          </div>

          {h2("PASO 3 — Fuerza Muscular (Daniels 0-5)")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            {[["Cuádriceps","Desgarro / Tendinopatía rotuliana"],["Isquiotibiales","Desgarro / Ciática"],["Glúteo mayor","Desgarro / S. Piriforme"],["Gemelos / Sóleo","Desgarro / T. Aquiles"],["Manguito rotador","Tendinosis / Capsulitis"],["Tibial anterior","Desgarro / Radiculopatía L4"]].map(([m, corr]) => (
              <div key={m} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 2 }}>{m}</div>
                <div style={{ fontSize: 9, color: C.dim, marginBottom: 8 }}>KP: {corr}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["D", "I"].map(l => <div key={l} style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>{l}</div>
                    <input type="number" min="0" max="5" placeholder="0-5" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, padding: "5px 8px", textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>)}
                </div>
              </div>
            ))}
          </div>

          {h2("PASO 4 — Pruebas Ortopédicas Específicas")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 20 }}>
            {[
              ["Lachman", "LCA rodilla"],["McMurray", "Meniscos"],["Cozen", "Epicondilitis lateral"],
              ["Neer / Hawkins", "Manguito rotador"],["Phalen / Tinel", "Síndrome túnel carpiano"],
              ["Lasègue / Slump", "Ciática / Radiculopatía"],["Dix-Hallpike", "VPPB vestibular"],
              ["FAIR test", "Síndrome piriforme"],
            ].map(([prueba, estructura]) => (
              <div key={prueba} style={{ display: "flex", gap: 8, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)" }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{prueba}</div><div style={{ fontSize: 10, color: C.dim }}>{estructura}</div></div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["＋", "−"].map(r => <button key={r} onClick={() => updObj("pruebas_ortopedicas", prueba, r)} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${hc.pruebas_ortopedicas?.[prueba] === r ? (r === "＋" ? C.danger : C.success) : C.border}`, background: hc.pruebas_ortopedicas?.[prueba] === r ? (r === "＋" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)") : "transparent", color: r === "＋" ? C.danger : C.success, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{r}</button>)}
                </div>
              </div>
            ))}
          </div>

          {h2("PASO 5 — Red Flags Killer Practical", C.danger)}
          {alertBox("⛔ La presencia de CUALQUIER red flag requiere evaluación urgente y posible derivación.", C.danger)}
          {[
            ["rf_dolor_noc", "Dolor nocturno severo sin causa mecánica"],
            ["rf_perdida_fza", "Pérdida progresiva de fuerza"],
            ["rf_deficit_neuro", "Déficit neurológico agudo"],
            ["rf_fiebre", "Fiebre + dolor musculoesquelético"],
            ["rf_esfinteres", "Pérdida de control de esfínteres ⚠️ URGENTE"],
            ["rf_trombosis", "Sospecha trombosis venosa profunda"],
            ["rf_trauma", "Trauma de alta energía"],
          ].map(([id, label]) => toggleOpt("red_flags", id, label, C.danger))}
        </div>}

        {/* S6 — Módulos Especializados */}
        {seccion === "s6" && <div>
          {sec("6. MÓDULOS DE EVALUACIÓN ESPECIALIZADA")}

          {h2("6.1 Sueño (PSQI · ISI · Epworth)")}
          {alertBox("😴 El sueño impacta directamente el dolor, inflamación y recuperación. Evaluación obligatoria.", C.primary)}
          {[["psqi", "PSQI — Calidad sueño (>5 = alterado)", 21, hc.psqi >= 5], ["isi", "ISI — Insomnio (>7 = subclínico)", 28, hc.isi >= 8], ["epworth", "Epworth — Somnolencia (>10 = excesiva)", 24, hc.epworth >= 10]].map(([k, label, max, alert]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 12, color: C.muted }}>{label}</span><span style={{ fontSize: 13, fontWeight: 800, color: alert ? C.danger : C.success }}>{hc[k]}/{max}</span></div>
              <input type="range" min={0} max={max} value={hc[k]} onChange={e => upd(k, Number(e.target.value))} style={{ width: "100%", accentColor: alert ? C.danger : C.success }} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>{lbl("Horas de sueño / noche")}<input type="range" min={3} max={12} value={hc.horas_sueno} onChange={e => upd("horas_sueno", Number(e.target.value))} style={{ width: "100%", accentColor: C.primary }} /><div style={{ fontSize: 11, color: C.primary, textAlign: "right" }}>{hc.horas_sueno} horas</div></div>

          {h2("6.2 Evaluación Vestibular")}
          <div style={{ marginBottom: 14 }}>
            {lbl("Test Dix-Hallpike (VPPB)")}
            <div style={{ display: "flex", gap: 6 }}>
              {[["negativo", "✓ Negativo", C.success], ["positivo_d", "+ Derecho", C.danger], ["positivo_i", "+ Izquierdo", C.danger]].map(([v, l, c]) => <button key={v} onClick={() => upd("dix_hallpike", v)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${hc.dix_hallpike === v ? `${c}40` : C.border}`, background: hc.dix_hallpike === v ? `${c}15` : "transparent", color: hc.dix_hallpike === v ? c : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{l}</button>)}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 12, color: C.muted }}>DHI Score (/100)</span><span style={{ fontSize: 13, fontWeight: 800, color: hc.dhi >= 60 ? C.danger : hc.dhi >= 28 ? C.warning : C.success }}>{hc.dhi}</span></div>
            <input type="range" min={0} max={100} value={hc.dhi} onChange={e => upd("dhi", Number(e.target.value))} style={{ width: "100%", accentColor: C.teal }} />
          </div>
          {toggleOpt("red_flags", "rf_vestibular", "⛔ Red flags neurológicas vestibulares presentes", C.danger)}

          {h2("6.3 Kinesiología — Cadenas Musculares")}
          {[["posterior", "Cadena posterior (isquio-lumbar-cervical)"], ["anterior", "Cadena anterior (psoas-recto-pectoral)"], ["lat_d", "Lateral derecha"], ["lat_i", "Lateral izquierda"], ["espiral", "Cadena espiral / rotacional"]].map(([id, label]) => (
            <div key={id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: C.text }}>{label}</span><span style={{ fontSize: 11, fontWeight: 700, color: hc.cadenas?.[id] > 0 ? C.orange : C.success }}>{hc.cadenas?.[id] > 0 ? `Tensión ${hc.cadenas[id]}/3` : "Normal"}</span></div>
              <input type="range" min={0} max={3} value={hc.cadenas?.[id] || 0} onChange={e => updObj("cadenas", id, Number(e.target.value))} style={{ width: "100%", accentColor: C.orange }} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>{lbl("Causa funcional identificada")}{inp("causa_funcional", "")}</div>

          {h2("6.4 Perfil Endocrino y Metabólico")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[["vitD", "Vitamina D (>40 ng/mL)"], ["cortisol", "Cortisol AM (6-23 mcg/dL)"], ["pcr", "PCR ultrasens. (<1 mg/L)"], ["tsh", "TSH (0.4-4.0 mIU/L)"], ["glucosa", "Glucosa ayunas (70-99)"], ["magnesio", "Magnesio (1.7-2.2 mg/dL)"]].map(([k, label]) => (
              <div key={k}>{lbl(label)}{inp(k, "Valor...")}</div>
            ))}
          </div>

          {h2("6.5 Nutrición Funcional")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {["Vitamina D3 + K2", "Magnesio glicinato", "Omega-3 EPA/DHA", "Colágeno tipo I/III", "Zinc bisoglicinato", "Vitamina C liposomal", "CoQ10", "Enzimas proteolíticas"].map(s => checkOpt("suplementos", s, s, C.success))}
          </div>
        </div>}

        {/* S7 — Tecnología */}
        {seccion === "s7" && <div>
          {sec("7. EVALUACIÓN CON TECNOLOGÍA")}
          {alertBox("📋 Protocolo TISEM: Aclimatación ≥15 min · Sala 21-25°C · Piel expuesta · Sin cremas ni vendajes", C.teal)}

          {h2("7.1 Termografía FLIR — Métricas TRI / TSI")}
          <div style={{ marginBottom: 14 }}>
            {lbl("TSI Global")}
            <div style={{ display: "flex", gap: 6 }}>
              {[["hipertermico", "🔴 Hipertérmico", C.danger], ["neutro", "🟡 Neutro", C.success], ["hipotermico", "🔵 Hipotérmico", C.primary]].map(([v, l, c]) => <button key={v} onClick={() => updObj("termografia", "tsi", v)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${hc.termografia?.tsi === v ? `${c}40` : C.border}`, background: hc.termografia?.tsi === v ? `${c}15` : "transparent", color: hc.termografia?.tsi === v ? c : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{l}</button>)}
            </div>
          </div>
          {hc.termografia?.tsi && <div style={{ padding: "10px 14px", borderRadius: 9, marginBottom: 14, background: hc.termografia.tsi === "hipertermico" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${hc.termografia.tsi === "hipertermico" ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`, fontSize: 12, color: hc.termografia.tsi === "hipertermico" ? C.danger : C.success }}>
            {hc.termografia.tsi === "hipertermico" ? "✓ Crioterapia INDICADA  |  ✗ Calor CONTRAINDICADO  |  ✓ HILT antiinflamatorio" : hc.termografia.tsi === "hipotermico" ? "✗ Crioterapia CONTRAINDICADA  |  ✓ Calor indicado  |  ✓ Rehabilitación activa" : "Evaluar por clínica y hallazgos ecográficos"}
          </div>}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 12, color: C.muted }}>Asimetría máxima (ΔT °C)</span><span style={{ fontSize: 13, fontWeight: 800, color: (hc.termografia?.asimetria || 0) >= 1.5 ? C.danger : C.success }}>Δ{hc.termografia?.asimetria || 0}°C {(hc.termografia?.asimetria || 0) >= 1.5 ? "⚠️ >umbral crítico" : ""}</span></div>
            <input type="range" min={0} max={5} step={0.1} value={hc.termografia?.asimetria || 0} onChange={e => updObj("termografia", "asimetria", Number(e.target.value))} style={{ width: "100%", accentColor: C.thermo }} />
          </div>
          <div style={{ marginBottom: 20 }}>{lbl("Región más afectada")}{inp("termografia_zona", "Ej: rodilla derecha, isquiotibial derecho...")}</div>

          {h2("7.2 Ecografía Musculoesquelética")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>{lbl("Estructura evaluada")}{inp("eco_estructura", "Ej: tendón rotuliano, LCA...")}</div>
            <div>{lbl("Hallazgo principal")}{inp("eco_hallazgo", "Hipoecoico, engrosamiento, desgarro...")}</div>
            <div>{lbl("Medida (mm)")}{inp("eco_medida", "Ej: 8.2 mm")}</div>
            <div>{lbl("Grado Killer Practical")}
              <div style={{ display: "flex", gap: 5 }}>
                {["Grado I", "Grado II", "Grado III"].map(g => <button key={g} onClick={() => updObj("termografia", "eco_grado", g)} style={{ flex: 1, padding: "8px", borderRadius: 7, border: `1px solid ${hc.termografia?.eco_grado === g ? `${C.warning}40` : C.border}`, background: hc.termografia?.eco_grado === g ? "rgba(245,158,11,0.15)" : "transparent", color: hc.termografia?.eco_grado === g ? C.warning : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{g}</button>)}
              </div>
            </div>
          </div>
        </div>}

        {/* S8 — Diagnóstico 4 Capas */}
        {seccion === "s8" && <div>
          {sec("8. DIAGNÓSTICO INTEGRAL — 4 CAPAS CLÍNICAS")}
          {[
            { id: "estructural", label: "🦴 CAPA ESTRUCTURAL", sub: "Muscular · Tendinosa · Ligamentosa · Articular (Killer Practical)", color: C.warning, key_dx: "dx_estructural", key_grado: "grado_estructural" },
            { id: "funcional", label: "⚙️ CAPA FUNCIONAL", sub: "Biomecánica · Cadenas musculares · Compensaciones", color: C.orange, key_dx: "dx_funcional", key_grado: "grado_funcional" },
            { id: "sistemica", label: "🧬 CAPA SISTÉMICA", sub: "Sueño · Endocrino · Nutrición · Inflamación", color: C.teal, key_dx: "dx_sistemica", key_grado: "grado_sistemica" },
            { id: "neurologica", label: "🧠 CAPA NEUROLÓGICA", sub: "Neuromodulación · Vestibular · Dolor persistente", color: C.purple, key_dx: "dx_neurologica", key_grado: "grado_neurologica" },
          ].map(capa => (
            <div key={capa.id} style={{ background: `${capa.color}08`, border: `1px solid ${capa.color}20`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: capa.color, marginBottom: 3 }}>{capa.label}</div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>{capa.sub}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
                <div>{lbl("Diagnóstico")} <input value={hc[capa.key_dx]} onChange={e => upd(capa.key_dx, e.target.value)} placeholder="Descripción del diagnóstico en esta capa..." style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${capa.color}30`, borderRadius: 8, color: C.text, fontSize: 13, padding: "8px 12px", fontFamily: "inherit", boxSizing: "border-box" }} /></div>
                <div>
                  {lbl("Grado")}
                  <div style={{ display: "flex", gap: 4 }}>
                    {["I", "II", "III"].map(g => <button key={g} onClick={() => upd(capa.key_grado, g)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${hc[capa.key_grado] === g ? `${capa.color}50` : C.border}`, background: hc[capa.key_grado] === g ? `${capa.color}20` : "transparent", color: hc[capa.key_grado] === g ? capa.color : C.muted, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>{g}</button>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>{lbl("Diagnóstico Principal (CIE-10)")}{inp("dx_principal", "Ej: M76.5 Tendinitis rotuliana")}</div>
          <div>{lbl("Diagnósticos Secundarios")}{inp("dx_secundarios", "", true)}</div>
        </div>}

        {/* S9 — Plan de Tratamiento */}
        {seccion === "s9" && <div>
          {sec("9. PLAN DE TRATAMIENTO INTEGRADO")}

          {h2("9.1 Protocolo HILT")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div>{lbl("Potencia pico (W)")}{inp("hilt_potencia", "Ej: 2000")}</div>
            <div>{lbl("Energía total (J/cm²)")}{inp("hilt_energia", "Ej: 1000")}</div>
            <div>{lbl("Duración sesión (min)")}{inp("hilt_duracion", "Ej: 15")}</div>
            <div>{lbl("Número de sesiones")}{inp("hilt_sesiones", "Ej: 8")}</div>
            <div style={{ gridColumn: "1/-1" }}>{lbl("Zona de aplicación")}{inp("hilt_zona", "Ej: tendón rotuliano derecho, zona subacromial")}</div>
            <div style={{ gridColumn: "1/-1" }}>
              {lbl("Modo de aplicación")}
              <div style={{ display: "flex", gap: 6 }}>
                {["Scanning", "Contact", "Mixto"].map(m => <button key={m} onClick={() => upd("hilt_modo", m)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${hc.hilt_modo === m ? `${C.warning}40` : C.border}`, background: hc.hilt_modo === m ? "rgba(245,158,11,0.15)" : "transparent", color: hc.hilt_modo === m ? C.warning : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{m}</button>)}
              </div>
            </div>
          </div>

          {h2("9.2 Crioterapia")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div>
              {lbl("Modalidad")}
              <div style={{ display: "flex", gap: 5 }}>
                {["Localizada", "WBC", "Ambas"].map(m => <button key={m} onClick={() => upd("crioterapia_modalidad", m)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${hc.crioterapia_modalidad === m ? `${C.primary}40` : C.border}`, background: hc.crioterapia_modalidad === m ? "rgba(56,189,248,0.15)" : "transparent", color: hc.crioterapia_modalidad === m ? C.primary : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{m}</button>)}
              </div>
            </div>
            <div>
              {lbl("Timing")}
              <div style={{ display: "flex", gap: 5 }}>
                {["Post-HILT", "Independiente"].map(t => <button key={t} onClick={() => upd("crioterapia_timing", t)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${hc.crioterapia_timing === t ? `${C.primary}40` : C.border}`, background: hc.crioterapia_timing === t ? "rgba(56,189,248,0.15)" : "transparent", color: hc.crioterapia_timing === t ? C.primary : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{t}</button>)}
              </div>
            </div>
          </div>

          {h2("9.3 Neuromodulación")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 20 }}>
            {[["biowave", "🔌 BioWave", C.purple], ["bemer", "🔵 BEMER", C.teal], ["tens", "⚡ TENS / EMS", C.orange], ["acupuntura", "🎯 Acupuntura", C.success]].map(([k, l, c]) => (
              <div key={k} onClick={() => upd(k, !hc[k])} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 9, cursor: "pointer", background: hc[k] ? `${c}10` : "transparent", border: `1px solid ${hc[k] ? `${c}30` : C.border}` }}>
                <span style={{ fontSize: 13, color: hc[k] ? C.text : C.muted, fontWeight: hc[k] ? 700 : 400 }}>{l}</span>
                <div style={{ width: 32, height: 17, borderRadius: 9, background: hc[k] ? c : "rgba(255,255,255,0.08)", position: "relative" }}>
                  <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: hc[k] ? 17 : 2, transition: "left 0.2s" }} />
                </div>
              </div>
            ))}
          </div>

          {h2("9.4 Fase de Rehabilitación")}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {[["1", "Fase 1 — Analgesia / Isométrico"], ["2", "Fase 2 — Carga progresiva / Excéntrico"], ["3", "Fase 3 — Funcional / Retorno deportivo"]].map(([v, l]) => <button key={v} onClick={() => upd("rehab_fase", v)} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${hc.rehab_fase === v ? `${C.orange}40` : C.border}`, background: hc.rehab_fase === v ? "rgba(251,146,60,0.15)" : "transparent", color: hc.rehab_fase === v ? C.orange : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>{l}</button>)}
          </div>
        </div>}

        {/* S10 — Seguimiento */}
        {seccion === "s10" && <div>
          {sec("10. SEGUIMIENTO Y EVOLUCIÓN")}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 100px 1fr", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 6 }}>
              {["#", "Fecha", "EVA Pre", "EVA Post", "ΔT Termo", "Protocolo / Notas"].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>{h}</div>)}
            </div>
            {[1,2,3,4,5,6,7,8].map(n => (
              <div key={n} style={{ display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 100px 1fr", gap: 8, padding: "6px 12px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "flex", alignItems: "center" }}>{n}</div>
                {["", "", "", "", ""].map((_, i) => <input key={i} placeholder={["DD/MM/AA", "0-10", "0-10", "°C", "Protocolo..."][i]} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, padding: "5px 8px", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />)}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            {lbl("Alta / Continuidad")}
            <div style={{ display: "flex", gap: 6 }}>
              {["Alta deportiva", "Mantenimiento", "Continuar protocolo", "Referir especialista"].map(a => <button key={a} onClick={() => upd("alta", a)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${hc.alta === a ? `${C.success}40` : C.border}`, background: hc.alta === a ? "rgba(16,185,129,0.15)" : "transparent", color: hc.alta === a ? C.success : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{a}</button>)}
            </div>
          </div>
          {alertBox("⚠️ Alertas: Sin mejoría EVA tras 4 sesiones · Red flag neurológica · Sueño severamente alterado · Riesgo metabólico · Derivar especialista", C.warning)}
          <div>{lbl("Notas adicionales")}{inp("notas", "Observaciones generales, evolución clínica, próximos pasos...", true)}</div>
          <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.35)", color: C.primary, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>📄 Exportar PDF</button>
            <button style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", color: C.success, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>💾 Guardar Historia</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ── PLUGIN: Patient Detail ─────────────────────────────────
function PatientDetailPlugin({ patient, sessions, onAddSession, navigate, plugins }) {
  const { C } = useApp();
  const [tab, setTab] = useState("sesiones");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ protocolo: "HILT", eva_pre: 5, eva_post: 3, notas: "", duracion_minutos: 30 });
  const patSess = sessions.filter(s => s.paciente_id === patient.id);
  const mej = patSess.filter(s => s.eva_pre && s.eva_post).length ? Math.round(patSess.filter(s => s.eva_pre && s.eva_post).reduce((a, s) => a + ((s.eva_pre - s.eva_post) / s.eva_pre * 100), 0) / patSess.filter(s => s.eva_pre && s.eva_post).length) : 0;

  async function save() { setSaving(true); await onAddSession({ ...form, paciente_id: patient.id, numero_sesion: patSess.length + 1 }); setShowModal(false); setSaving(false); }

  // Get plugins that have patient actions
  const patientPlugins = plugins.filter(p => p.patientAction);

  return (
    <div>
      <button onClick={() => navigate("patients")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }}>← Pacientes</button>
      <Card style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
        <Avatar name={`${patient.nombre} ${patient.apellido}`} size={64} />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>{patient.nombre} {patient.apellido}</h2>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{patient.edad} años · {patient.email}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge color={C.primary}>{patient.condicion_principal}</Badge>
            <Badge color={C.success}>{patSess.length} sesiones</Badge>
            <Badge color={C.warning}>Mejoría {mej}%</Badge>
          </div>
        </div>
        {/* Plugin action buttons — se agregan automáticamente */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {patientPlugins.map(plugin => (
            <button key={plugin.id} onClick={() => plugin.onPatientAction(patient, navigate)} style={{ background: dim(plugin.color), border: `1px solid ${plugin.color}30`, color: plugin.color, borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {plugin.icon} {plugin.patientActionLabel || plugin.name}
            </button>
          ))}
          <Btn onClick={() => setShowModal(true)} color={C.primary}>+ Sesión</Btn>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {["sesiones", "historia", "valoracion"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 16px", border: "none", cursor: "pointer", background: "transparent", fontSize: 13, fontWeight: 700, textTransform: "capitalize", color: tab === t ? C.primary : C.muted, borderBottom: tab === t ? `2px solid ${C.primary}` : "2px solid transparent" }}>
            {t === "sesiones" ? "📅 Sesiones" : t === "historia" ? "📋 Historia" : "💪 Valoración"}
          </button>
        ))}
      </div>

      {tab === "sesiones" && (
        <div>
          {patSess.length === 0 ? <Card style={{ textAlign: "center", padding: 40, color: C.muted }}>Sin sesiones. Crea la primera.</Card>
            : patSess.map(ses => {
              const mej2 = ses.eva_pre && ses.eva_post ? Math.round((ses.eva_pre - ses.eva_post) / ses.eva_pre * 100) : null;
              return (
                <Card key={ses.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Sesión #{ses.numero_sesion} — {ses.protocolo}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{new Date(ses.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" })}</div>
                    </div>
                    {mej2 !== null && <Badge color={mej2 > 0 ? C.success : C.danger}>{mej2 > 0 ? `↓${mej2}% dolor` : "Sin cambio"}</Badge>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[{ l: "EVA Pre", v: ses.eva_pre, c: C.danger }, { l: "EVA Post", v: ses.eva_post, c: C.success }, { l: "Duración", v: ses.duracion_minutos ? `${ses.duracion_minutos}min` : "—", c: C.primary }].map(m => (
                      <div key={m.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px" }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{m.l}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: m.c }}>{m.v ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                  {ses.notas && <div style={{ fontSize: 12, color: C.muted, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 12px", marginTop: 10 }}>{ses.notas}</div>}
                </Card>
              );
            })}
        </div>
      )}

      {tab === "historia" && (
        <HistoriaClinicaV3 patient={patient} C={C} />
      )}

      {tab === "valoracion" && (
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 16 }}>VALORACIÓN MUSCULAR BILATERAL</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {["Cuádriceps", "Isquiotibiales", "Glúteo mayor", "Gemelos", "Tibial anterior", "Rotadores cadera"].map(m => (
              <div key={m} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10 }}>{m}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["D", "I"].map(l => (
                    <div key={l} style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>LADO {l}</div>
                      <input type="number" min="0" max="5" placeholder="0-5" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: "6px 8px", textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}><Btn color={C.success}>✓ Guardar</Btn></div>
        </Card>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Sesión">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Protocolo</label>
            <select value={form.protocolo} onChange={e => setForm(p => ({ ...p, protocolo: e.target.value }))} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: "10px 14px", fontFamily: "inherit" }}>
              {["HILT", "Crioterapia", "Termografía", "Ecografía", "Acupuntura", "Rehabilitación", "Biorresonancia", "TENS", "EMS", "VALD", "InBody", "Bodygee"].map(o => <option key={o} value={o} style={{ background: "#1e293b" }}>{o}</option>)}
            </select>
          </div>
          {[{ k: "eva_pre", l: "EVA Pre (0-10)" }, { k: "eva_post", l: "EVA Post (0-10)" }, { k: "duracion_minutos", l: "Duración (min)" }].map(f => (
            <Input key={f.k} label={f.l} type="number" value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: parseInt(e.target.value) || 0 }))} />
          ))}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Notas</label>
            <textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, padding: "10px 14px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <Btn onClick={() => setShowModal(false)} color={C.muted}>Cancelar</Btn>
          <Btn onClick={save} disabled={saving} color={C.success}>{saving ? "Guardando..." : "✓ Registrar"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ── PLUGIN: FLIR Camera ────────────────────────────────────
function FLIRPlugin({ patient }) {
  const { C } = useApp();
  const [status, setStatus] = useState("disconnected");
  const [captured, setCaptured] = useState(false);
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef(null);
  const [tick, setTick] = useState(0);
  const streaming = status === "streaming";

  useEffect(() => { if (!streaming) return; const id = setInterval(() => setTick(t => t + 1), 120); return () => clearInterval(id); }, [streaming]);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); const w = c.width, h = c.height;
    ctx.fillStyle = "#050A14"; ctx.fillRect(0, 0, w, h);
    if (status === "disconnected") return;
    const g = ctx.createRadialGradient(w * .58, h * .48, 15, w * .5, h * .5, w * .65);
    [["#ff2200", 0], ["#ff8800", .3], ["#ffaa00", .55], ["#220066", .8], ["#000033", 1]].forEach(([c, s]) => g.addColorStop(s, c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (streaming || captured) {
      ctx.fillStyle = "rgba(255,77,77,0.35)"; ctx.beginPath(); ctx.ellipse(w * .62, h * .65, 20, 15, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,77,77,0.8)"; ctx.lineWidth = 1.5; ctx.stroke();
    }
    if (streaming) {
      const y = (tick * 10) % h; ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "10px monospace"; ctx.fillText("34.2°C", w / 2 + 9, h / 2 - 5);
    }
    if (streaming || captured) { ctx.fillStyle = "#44aaff"; ctx.font = "9px monospace"; ctx.fillText("↓29.1°", 6, h - 7); ctx.fillStyle = "#ff4444"; ctx.fillText("↑37.8°", w - 42, h - 7); }
  }, [status, streaming, captured, tick]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>🌡️ Cámara Térmica FLIR</h2><p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{patient ? `${patient.nombre} ${patient.apellido}` : "Sin paciente seleccionado"}</p></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: streaming ? "rgba(16,185,129,0.12)" : "rgba(255,77,77,0.12)", border: `1px solid ${streaming ? "rgba(16,185,129,0.3)" : "rgba(255,77,77,0.3)"}`, borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: streaming ? C.success : C.thermo, display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: streaming ? C.success : C.thermo, animation: streaming ? "pulse 2s infinite" : "none" }} />
            {status === "disconnected" ? "Sin conexión" : status === "connecting" ? "Conectando..." : "● EN VIVO"}
          </div>
          {saved && <Badge color={C.success}>✓ Guardado en HC</Badge>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${streaming ? C.thermo + "60" : C.border}`, marginBottom: 14 }}>
            <canvas ref={canvasRef} width={480} height={320} style={{ display: "block", width: "100%", background: "#050A14" }} />
            {status === "disconnected" && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(5,10,20,0.92)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>FLIR One no conectado</div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>USB-C · Lightning · Bluetooth</div>
            </div>}
            {(streaming || captured) && <div style={{ position: "absolute", top: 10, left: 10 }}><div style={{ background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "4px 10px", fontSize: 10, color: "#fff", fontFamily: "monospace" }}>FLIR ONE Pro</div></div>}
            {streaming && <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(239,68,68,0.75)", borderRadius: 8, padding: "4px 10px", display: "flex", gap: 5, alignItems: "center" }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite" }} /><span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>LIVE</span></div>}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {status === "disconnected" && <Btn onClick={() => { setStatus("connecting"); setTimeout(() => { setStatus("streaming"); }, 1500); }} color={C.primary} style={{ flex: 1, maxWidth: 240, padding: "13px" }}>🔌 Conectar FLIR One</Btn>}
            {streaming && !captured && <><Btn onClick={() => { setCaptured(true); setStatus("connected"); }} color={C.thermo} style={{ flex: 1, maxWidth: 200, padding: "13px" }}>📸 Capturar</Btn><Btn onClick={() => setStatus("connected")} color={C.muted}>⏸ Pausar</Btn></>}
            {captured && <><Btn onClick={() => setSaved(true)} disabled={saved} color={C.success}>{saved ? "✓ Guardado" : "💾 Guardar en HC"}</Btn><Btn onClick={() => { setCaptured(false); setSaved(false); setStatus("streaming"); }} color={C.muted}>🔄 Nueva</Btn></>}
          </div>
        </div>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 14 }}>ANÁLISIS RÁPIDO</div>
          {captured ? [{ l: "Asimetría Rodilla D.", v: "Δ1.8°C", c: C.thermo, r: "ALTO" }, { l: "Asimetría Tobillo D.", v: "Δ2.1°C", c: C.thermo, r: "ALTO" }, { l: "TSI", v: "Hipertérmico", c: C.warning, r: "—" }, { l: "Crioterapia", v: "✓ Indicada", c: C.primary, r: "—" }, { l: "HILT", v: "✓ Indicado", c: C.warning, r: "—" }].map(m => (
            <div key={m.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <span style={{ fontSize: 12, color: C.muted }}>{m.l}</span><span style={{ fontSize: 12, fontWeight: 700, color: m.c }}>{m.v}</span>
            </div>
          )) : <div style={{ textAlign: "center", padding: "30px 0", color: C.muted, fontSize: 13 }}>Captura una imagen para ver el análisis</div>}
        </Card>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// ── PLUGIN: AI Copilot ─────────────────────────────────────
function CopilotPlugin({ patient }) {
  const { C } = useApp();
  const [msgs, setMsgs] = useState([{ role: "assistant", content: `Hola, soy tu **copiloto clínico IA**. Tengo acceso al contexto de **${patient ? `${patient.nombre} ${patient.apellido}` : "tu paciente"}**.\n\n¿En qué puedo ayudarte?` }]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false); const [streaming, setStreaming] = useState("");
  const endRef = useRef(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, streaming]);

  const sys = `Eres copiloto clínico de AWAKE4WELLNESS. Expertise: termografía (ThermoHuman, TRI/TSI), ecografía, HILT (1064nm), crioterapia, acupuntura, biorresonancia, rehabilitación, VALD, InBody, Bodygee, Garmin.${patient ? `\n\nPaciente: ${patient.nombre} ${patient.apellido}, ${patient.edad} años, ${patient.condicion_principal}.` : ""}\n\nResponde en español clínico profesional.`;

  async function send(text) {
    const msg = text || input.trim(); if (!msg || loading) return;
    setInput(""); const next = [...msgs, { role: "user", content: msg }]; setMsgs(next); setLoading(true); setStreaming("");
    try { let full = ""; await CoreServices.askAI(next.map(m => ({ role: m.role, content: m.content })), sys, chunk => { full = chunk; setStreaming(chunk); }); setMsgs(p => [...p, { role: "assistant", content: full }]); setStreaming(""); }
    catch (e) { setMsgs(p => [...p, { role: "assistant", content: `Error: ${e.message}` }]); } finally { setLoading(false); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", height: "calc(100vh - 56px)", gap: 0, margin: "-28px", overflow: "hidden" }}>
      <div style={{ borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: 16, background: "rgba(255,255,255,0.01)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>PREGUNTAS RÁPIDAS</div>
        {["📊 Evaluar progreso del paciente", "⚡ Dosis HILT para hoy", "❄️ ¿Crioterapia indicada?", "🏃 Criterios retorno al deporte", "📝 Generar nota SOAP", "📋 Protocolo 4 semanas"].map((qp, i) => (
          <button key={i} onClick={() => send(qp.replace(/^[^\w]+/, ""))} disabled={loading} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, cursor: loading ? "not-allowed" : "pointer", marginBottom: 5 }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; e.currentTarget.style.color = C.success; } }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}>
            {qp}
          </button>
        ))}
        <div style={{ marginTop: "auto", background: AI_DEMO ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${AI_DEMO ? "rgba(245,158,11,0.25)" : "rgba(16,185,129,0.25)"}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: AI_DEMO ? C.warning : C.success }}>{AI_DEMO ? "⚠️ Demo Mode" : "✓ GPT-4o Activo"}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{AI_DEMO ? "Agrega tu API key" : "Modelo: gpt-4o"}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {msgs.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 16, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: msg.role === "user" ? "rgba(56,189,248,0.12)" : "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{msg.role === "user" ? "👤" : "🧠"}</div>
              <div style={{ maxWidth: "76%", padding: "11px 15px", borderRadius: 12, background: msg.role === "user" ? "rgba(56,189,248,0.1)" : C.surface, border: `1px solid ${msg.role === "user" ? "rgba(56,189,248,0.2)" : C.border}`, fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.content}</div>
            </div>
          ))}
          {streaming && <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start" }}><div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧠</div><div style={{ maxWidth: "76%", padding: "11px 15px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{streaming}<span style={{ display: "inline-block", width: 7, height: 13, background: C.success, borderRadius: 2, marginLeft: 3, animation: "blink 0.7s infinite" }} /></div></div>}
          {loading && !streaming && <div style={{ display: "flex", gap: 10, marginBottom: 16 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧠</div><div style={{ padding: "11px 15px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: 5 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, animation: `bounce 1.2s ease ${i * 0.2}s infinite` }} />)}</div></div>}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 10 }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Pregunta clínica... (Enter para enviar)" rows={2} style={{ flex: 1, background: C.surface, border: `1px solid ${loading ? C.border : "rgba(16,185,129,0.35)"}`, borderRadius: 10, color: C.text, fontSize: 13, padding: "10px 14px", resize: "none", fontFamily: "inherit" }} />
            <Btn onClick={() => send()} disabled={loading || !input.trim()} color={C.success} style={{ height: "100%", padding: "0 18px" }}>{loading ? "⏳" : "↑"}</Btn>
          </div>
        </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

// ── PLUGIN: Device Integrations Hub ───────────────────────
function DevicesPlugin() {
  const { C } = useApp();
  const devices = [
    { name: "FLIR One / T-series", icon: "🌡️", color: C.thermo, status: "activo", type: "Termografía", api: "FLIR Mobile SDK", action: "Configurado" },
    { name: "InBody", icon: "⚖️", color: C.primary, status: "pendiente", type: "Composición corporal", api: "LookinBody WebAPI + CSV", action: "Conectar" },
    { name: "VALD Performance", icon: "💪", color: C.warning, status: "pendiente", type: "Fuerza y rendimiento", api: "REST API (OAuth2)", action: "Conectar" },
    { name: "Bodygee", icon: "🔵", color: C.purple, status: "pendiente", type: "Escaneo 3D corporal", api: "REST API + Webhooks", action: "Conectar" },
    { name: "Garmin Health", icon: "⌚", color: C.success, status: "pendiente", type: "Wearable continuo", api: "Health API (licencia)", action: "Conectar" },
    { name: "FITTO / Olive HC", icon: "🔴", color: C.danger, status: "sin_api", type: "Músculo NIRS", api: "Sin API pública", action: "Contactar" },
    { name: "Tanita Pro", icon: "📊", color: C.muted, status: "csv", type: "Bioimpedancia", api: "Exportación CSV", action: "Importar CSV" },
  ];
  const statusConfig = { activo: { label: "Activo", color: C.success }, pendiente: { label: "Por conectar", color: C.warning }, sin_api: { label: "Sin API pública", color: C.danger }, csv: { label: "Solo CSV", color: C.muted } };
  const [sel, setSel] = useState(null);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>🔌 Hub de Dispositivos</h2>
        <p style={{ margin: "5px 0 0", color: C.muted, fontSize: 13 }}>Gestión centralizada de todas las integraciones</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 380px" : "1fr", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, alignContent: "start" }}>
          {devices.map(d => (
            <Card key={d.name} color={d.color} onClick={() => setSel(sel?.name === d.name ? null : d)} style={{ border: `1px solid ${sel?.name === d.name ? `${d.color}40` : C.border}` }}>
              <div style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "center" }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: dim(d.color), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{d.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{d.type}</div>
                </div>
                <Badge color={statusConfig[d.status].color}>{statusConfig[d.status].label}</Badge>
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>API: {d.api}</div>
              <Btn color={d.color} style={{ width: "100%", padding: "8px" }}>{d.action} →</Btn>
            </Card>
          ))}
        </div>
        {sel && (
          <Card color={sel.color} style={{ border: `1px solid ${sel.color}30`, alignSelf: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{sel.icon} {sel.name}</div>
              <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>INTEGRACIÓN</div>
            {sel.status === "activo" && <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13, color: C.success }}>✓ Dispositivo conectado y funcionando</div>}
            {sel.status === "pendiente" && <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 14 }}>Para conectar {sel.name}, necesitas:<br /><br />1. Registrarte como desarrollador<br />2. Obtener credenciales API<br />3. Configurar autenticación OAuth2<br />4. El módulo se activa automáticamente</div>}
            {sel.status === "sin_api" && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13, color: C.danger }}>Sin API pública disponible. Se requiere contacto directo con el proveedor para explorar opciones de integración.</div>}
            {sel.status === "csv" && <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 14 }}>Integración por importación de archivos CSV exportados desde el software {sel.name}. Carga automática al detectar nuevos archivos.</div>}
            <Btn color={sel.color} style={{ width: "100%", padding: "11px" }}>
              {sel.status === "activo" ? "⚙️ Configurar" : sel.status === "sin_api" ? "📧 Redactar email de contacto" : sel.status === "csv" ? "📂 Importar CSV" : "🔗 Iniciar conexión"}
            </Btn>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── PLUGIN: Placeholder ────────────────────────────────────
function PlaceholderPlugin({ name, icon, description, coming }) {
  const { C } = useApp();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>{name}</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, textAlign: "center", maxWidth: 400 }}>{description}</div>
      {coming && <Badge color={C.warning}>Próximamente</Badge>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ── PLUGIN: MOTOR CENTRAL DIAGNÓSTICO ──────────────────────────
// Cruza 9 módulos → 4 capas → Protocolo automático
// Basado en: Killer Practical + Framework AW4W
// ═══════════════════════════════════════════════════════════════
const LESIONES_KP = {
  musculares:[
    {id:"dist",label:"Distensión muscular",hallazgo:"Dolor agudo, espasmo, limitación funcional"},
    {id:"dsg1",label:"Desgarro Grado I",hallazgo:"Microrrupturas, dolor localizado"},
    {id:"dsg2",label:"Desgarro Grado II",hallazgo:"Ruptura parcial, hematoma, debilidad"},
    {id:"dsg3",label:"Desgarro Grado III ⚠️",hallazgo:"Ruptura completa, pérdida funcional severa"},
    {id:"cont",label:"Contractura muscular",hallazgo:"Rigidez y dolor persistente"},
    {id:"mios",label:"Miositis",hallazgo:"Dolor, edema y debilidad"},
  ],
  tendinosas:[
    {id:"tend_a",label:"Tendinitis aguda",hallazgo:"Dolor mecánico, sensibilidad"},
    {id:"tend_c",label:"Tendinosis crónica",hallazgo:"Degeneración, dolor crónico"},
    {id:"rot",label:"Tendinopatía rotuliana",hallazgo:"Dolor infrapatelar"},
    {id:"aqu",label:"Tendinopatía Aquiles",hallazgo:"Rigidez matutina, dolor cordón"},
    {id:"epic",label:"Epicondilitis lateral",hallazgo:"Dolor lateral codo, Cozen +"},
    {id:"mang",label:"Manguito rotador",hallazgo:"Dolor nocturno, limitación abducción"},
  ],
  ligamentosas:[
    {id:"esq1",label:"Esguince Grado I",hallazgo:"Estiramiento, dolor leve"},
    {id:"esq2",label:"Esguince Grado II",hallazgo:"Ruptura parcial, edema"},
    {id:"esq3",label:"Esguince Grado III ⚠️",hallazgo:"Ruptura completa, inestabilidad severa"},
    {id:"lca",label:"Lesión LCA",hallazgo:"Inestabilidad, Lachman +"},
    {id:"lcm",label:"Lesión LCM",hallazgo:"Dolor medial, valgo +"},
  ],
  articulares:[
    {id:"artr",label:"Artrosis",hallazgo:"Rigidez, dolor progresivo, crepitación"},
    {id:"meni",label:"Lesión meniscal",hallazgo:"Bloqueo articular, McMurray +"},
    {id:"burs",label:"Bursitis",hallazgo:"Dolor localizado, edema puntual"},
    {id:"caps",label:"Capsulitis adhesiva",hallazgo:"Pérdida global movilidad hombro"},
  ],
  neuromusculares:[
    {id:"ciat",label:"Ciática",hallazgo:"Dolor irradiado lumbo-glúteo-pierna"},
    {id:"radl",label:"Radiculopatía lumbar",hallazgo:"Dolor irradiado pierna, déficit motor"},
    {id:"radc",label:"Radiculopatía cervical",hallazgo:"Dolor irradiado brazo, parestesias"},
    {id:"fibr",label:"Fibromialgia",hallazgo:"Dolor generalizado, fatiga crónica"},
    {id:"piri",label:"Síndrome piriforme",hallazgo:"Dolor glúteo irradiado, FAIR +"},
  ],
};

function runMotorDx(data) {
  const r = {
    capas:{estructural:[],funcional:[],sistemica:[],neurologica:[]},
    grado:"I", urgente:false, redFlags:[],
    protocolos:{hilt:false,crioterapia:false,biowave:false,bemer:false,
                rehabilitacion:false,sueno:false,vestibular:false,
                endocrino:false,nutricion:false,acupuntura:false},
    alertas:[],
  };
  // Estructural
  const sel = Object.entries(data.lesiones||{}).filter(([,v])=>v).map(([k])=>{
    for(const cat of Object.values(LESIONES_KP)){const l=cat.find(x=>x.id===k);if(l)return l;}return null;
  }).filter(Boolean);
  if(sel.length){r.capas.estructural=sel.map(l=>l.label);r.protocolos.hilt=true;r.protocolos.crioterapia=true;r.protocolos.rehabilitacion=true;}
  if(data.lesiones?.dsg3||data.lesiones?.esq3){r.urgente=true;r.redFlags.push("Lesión Grado III — evaluar indicación quirúrgica");}
  // Funcional
  const cad=Object.entries(data.cadenas||{}).filter(([,v])=>v>0).map(([k])=>k);
  if(cad.length){r.capas.funcional=cad.map(k=>({posterior:"Cadena posterior",anterior:"Cadena anterior",lat_d:"Lateral derecha",lat_i:"Lateral izquierda",espiral:"Cadena espiral"}[k]||k));r.protocolos.rehabilitacion=true;r.protocolos.acupuntura=true;}
  // Sistémica
  if(data.sueno?.psqi>=5){r.capas.sistemica.push("Sueño alterado (PSQI ≥5)");r.protocolos.sueno=true;r.alertas.push("😴 Sueño alterado — impacta dolor e inflamación");}
  if(data.endocrino?.vitD_bajo){r.capas.sistemica.push("Deficiencia Vitamina D");r.protocolos.nutricion=true;}
  if(data.endocrino?.pcr_alta){r.capas.sistemica.push("Inflamación sistémica (PCR elevada)");r.protocolos.crioterapia=true;}
  if(data.nutricion?.deficiencias?.length>0){r.capas.sistemica.push(`Déficit: ${data.nutricion.deficiencias.join(", ")}`);r.protocolos.nutricion=true;}
  // Neurológica
  if(data.vertigo?.dix_hallpike==="positivo_d"||data.vertigo?.dix_hallpike==="positivo_i"){r.capas.neurologica.push("VPPB (Dix-Hallpike +)");r.protocolos.vestibular=true;r.alertas.push("🌀 VPPB — iniciar maniobra de Epley");}
  if(data.vertigo?.red_flags){r.urgente=true;r.redFlags.push("🚨 Red flags neurológicas vestibulares");}
  if(data.lesiones?.ciat||data.lesiones?.radl||data.lesiones?.radc){r.capas.neurologica.push("Compresión radicular");r.protocolos.biowave=true;r.protocolos.acupuntura=true;}
  if(data.lesiones?.fibr){r.capas.neurologica.push("Fibromialgia — dolor central sensibilizado");r.protocolos.biowave=true;r.protocolos.bemer=true;}
  if(data.neuro?.dolor_persistente){r.capas.neurologica.push("Dolor persistente / sensibilización");r.protocolos.biowave=true;}
  // Termografía
  if(data.termografia?.tsi==="hipertermico"){r.protocolos.crioterapia=true;r.alertas.push(`🌡️ TSI Hipertérmico — crioterapia indicada post-HILT`);}
  if(data.termografia?.asimetria>=1.5){r.alertas.push(`🌡️ Asimetría crítica Δ${data.termografia.asimetria}°C — confirmar con ecografía`);r.protocolos.hilt=true;}
  // EVA
  if(data.eva>=8){r.urgente=true;r.alertas.push("⚠️ EVA ≥8 — dolor severo, priorizar analgesia");}
  // Red flags
  if(data.neuro?.fiebre) r.redFlags.push("🚨 Fiebre — descartar infección");
  if(data.neuro?.esfinteres) r.redFlags.push("🚨 Alteración esfínteres — Síndrome cauda equina URGENTE");
  // Grado
  const n=Object.values(r.capas).filter(v=>v.length>0).length;
  r.grado=n>=3?"III":n===2?"II":"I";
  return r;
}

function MotorCentralPlugin({patient}) {
  const {C} = useApp();
  const MODS = [
    {id:"dolor",label:"1️⃣ Dolor",color:C.danger},
    {id:"lesiones",label:"2️⃣ Killer Practical",color:C.warning},
    {id:"termografia",label:"3️⃣ Termografía",color:C.thermo},
    {id:"sueno",label:"4️⃣ Sueño",color:C.primary},
    {id:"vertigo",label:"5️⃣ Vértigo",color:C.teal},
    {id:"kinesiologia",label:"6️⃣ Kinesiología",color:C.orange},
    {id:"endocrino",label:"7️⃣ Endocrino",color:C.purple},
    {id:"nutricion",label:"8️⃣ Nutrición",color:C.success},
    {id:"neuro",label:"9️⃣ Neuromodulación",color:C.purple},
  ];
  const [step,setStep]=useState(0);
  const [running,setRunning]=useState(false);
  const [resultado,setResultado]=useState(null);
  const [eva,setEva]=useState(0);
  const [lesiones,setLesiones]=useState({});
  const [termo,setTermo]=useState({tsi:"neutro",asimetria:0});
  const [sueno,setSueno]=useState({psqi:0,isi:0,epworth:0});
  const [vertigo,setVertigo]=useState({dix_hallpike:"negativo",dhi:0,red_flags:false});
  const [cadenas,setCadenas]=useState({});
  const [endocrino,setEndocrino]=useState({});
  const [nutricion,setNutricion]=useState({deficiencias:[]});
  const [neuro,setNeuro]=useState({dolor_persistente:false,trigger_points:false,fiebre:false,esfinteres:false});

  function ejecutar(){
    setRunning(true);
    setTimeout(()=>{
      setResultado(runMotorDx({eva,lesiones,termografia:termo,sueno,vertigo,cadenas,endocrino,nutricion,neuro}));
      setRunning(false);setStep(MODS.length);
    },1000);
  }

  const catColor={musculares:C.warning,tendinosas:C.orange,ligamentosas:C.primary,articulares:C.teal,neuromusculares:C.purple};
  const catLabel={musculares:"💪 Musculares",tendinosas:"⚡ Tendinosas",ligamentosas:"🔵 Ligamentosas",articulares:"🦴 Articulares",neuromusculares:"🧠 Neuromusculares"};

  function renderStep() {
    if(step===0) return (
      <div>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:10}}>EVA — Escala Visual Analógica</div>
        <div style={{display:"flex",gap:5,marginBottom:20}}>
          {[1,2,3,4,5,6,7,8,9,10].map(n=>(
            <div key={n} onClick={()=>setEva(n)} style={{flex:1,height:44,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,cursor:"pointer",
              background:eva===n?(n<=3?"rgba(16,185,129,0.3)":n<=6?"rgba(245,158,11,0.3)":"rgba(239,68,68,0.3)"):(n<=3?"rgba(16,185,129,0.08)":n<=6?"rgba(245,158,11,0.08)":"rgba(239,68,68,0.08)"),
              border:`1px solid ${eva===n?(n<=3?C.success:n<=6?C.warning:C.danger):"rgba(255,255,255,0.07)"}`,
              color:n<=3?C.success:n<=6?C.warning:C.danger}}>{n}</div>
          ))}
        </div>
        <div style={{fontSize:11,color:C.muted}}>Tipo de dolor:</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginTop:8}}>
          {["Agudo mecánico","Crónico persistente","Irradiado","Neuropático","Nocturno","Generalizado"].map(t=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,cursor:"pointer",background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`}}>
              <span style={{fontSize:12,color:C.muted}}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    );
    if(step===1) return (
      <div style={{maxHeight:500,overflowY:"auto"}}>
        {Object.entries(LESIONES_KP).map(([cat,lesns])=>(
          <div key={cat} style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:catColor[cat],marginBottom:8}}>{catLabel[cat]}</div>
            {lesns.map(l=>(
              <div key={l.id} onClick={()=>setLesiones(p=>({...p,[l.id]:!p[l.id]}))} style={{
                display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:7,cursor:"pointer",marginBottom:3,
                background:lesiones[l.id]?`${catColor[cat]}10`:"transparent",
                border:`1px solid ${lesiones[l.id]?`${catColor[cat]}30`:C.border}`,transition:"all 0.15s"}}>
                <div style={{width:15,height:15,borderRadius:4,border:`1.5px solid ${lesiones[l.id]?catColor[cat]:C.muted}`,background:lesiones[l.id]?`${catColor[cat]}20`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:catColor[cat],flexShrink:0}}>{lesiones[l.id]?"✓":""}</div>
                <div><div style={{fontSize:12,color:lesiones[l.id]?C.text:C.muted}}>{l.label}</div><div style={{fontSize:10,color:C.dim}}>{l.hallazgo}</div></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
    if(step===2) return (
      <div>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:10}}>TSI Global</div>
        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {[{v:"hipertermico",l:"Hipertérmico",c:C.danger},{v:"neutro",l:"Neutro",c:C.success},{v:"hipotermico",l:"Hipotérmico",c:C.primary}].map(o=>(
            <button key={o.v} onClick={()=>setTermo(p=>({...p,tsi:o.v}))} style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${termo.tsi===o.v?`${o.c}40`:C.border}`,background:termo.tsi===o.v?`${o.c}15`:"transparent",color:termo.tsi===o.v?o.c:C.muted,fontSize:11,fontWeight:700,cursor:"pointer"}}>{o.l}</button>
          ))}
        </div>
        <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Asimetría máxima (ΔT °C): <strong style={{color:termo.asimetria>=1.5?C.danger:C.success}}>{termo.asimetria}°C</strong></div>
        <input type="range" min={0} max={5} step={0.1} value={termo.asimetria} onChange={e=>setTermo(p=>({...p,asimetria:Number(e.target.value)}))} style={{width:"100%",accentColor:C.thermo}}/>
      </div>
    );
    if(step===3) return (
      <div>
        {[{label:"PSQI (Calidad sueño, >5=alterado)",key:"psqi",max:21,c:sueno.psqi>=5?C.danger:C.success},
          {label:"ISI (Insomnio, >7=subclínico)",key:"isi",max:28,c:sueno.isi>=8?C.warning:C.success},
          {label:"Epworth (Somnolencia, >10=excesiva)",key:"epworth",max:24,c:sueno.epworth>=10?C.warning:C.success}].map(s=>(
          <div key={s.key} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:C.muted}}>{s.label}</span><span style={{fontSize:13,fontWeight:800,color:s.c}}>{sueno[s.key]}/{s.max}</span></div>
            <input type="range" min={0} max={s.max} value={sueno[s.key]} onChange={e=>setSueno(p=>({...p,[s.key]:Number(e.target.value)}))} style={{width:"100%",accentColor:s.c}}/>
          </div>
        ))}
      </div>
    );
    if(step===4) return (
      <div>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:10}}>Test Dix-Hallpike (VPPB)</div>
        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {[{v:"negativo",l:"✓ Negativo",c:C.success},{v:"positivo_d",l:"+ Derecho",c:C.danger},{v:"positivo_i",l:"+ Izquierdo",c:C.danger}].map(o=>(
            <button key={o.v} onClick={()=>setVertigo(p=>({...p,dix_hallpike:o.v}))} style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${vertigo.dix_hallpike===o.v?`${o.c}40`:C.border}`,background:vertigo.dix_hallpike===o.v?`${o.c}15`:"transparent",color:vertigo.dix_hallpike===o.v?o.c:C.muted,fontSize:11,fontWeight:700,cursor:"pointer"}}>{o.l}</button>
          ))}
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:C.muted}}>DHI Score (/100)</span><span style={{fontSize:13,fontWeight:800,color:vertigo.dhi>=60?C.danger:vertigo.dhi>=28?C.warning:C.success}}>{vertigo.dhi}</span></div>
          <input type="range" min={0} max={100} value={vertigo.dhi} onChange={e=>setVertigo(p=>({...p,dhi:Number(e.target.value)}))} style={{width:"100%",accentColor:C.teal}}/>
        </div>
        <div onClick={()=>setVertigo(p=>({...p,red_flags:!p.red_flags}))} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,cursor:"pointer",background:vertigo.red_flags?C.dangerDim:"transparent",border:`1px solid ${vertigo.red_flags?C.danger:C.border}`}}>
          <div style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${vertigo.red_flags?C.danger:C.muted}`,background:vertigo.red_flags?C.dangerDim:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.danger}}>{vertigo.red_flags?"✓":""}</div>
          <span style={{fontSize:12,color:vertigo.red_flags?C.danger:C.muted}}>⛔ Red flags neurológicas presentes</span>
        </div>
      </div>
    );
    if(step===5) return (
      <div>
        {[{id:"posterior",l:"Cadena posterior (isquio-lumbar-cervical)"},{id:"anterior",l:"Cadena anterior (psoas-recto-pectoral)"},{id:"lat_d",l:"Lateral derecha"},{id:"lat_i",l:"Lateral izquierda"},{id:"espiral",l:"Cadena espiral / rotacional"}].map(c=>(
          <div key={c.id} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:C.text}}>{c.l}</span><span style={{fontSize:12,fontWeight:700,color:cadenas[c.id]>0?C.orange:C.success}}>{cadenas[c.id]>0?`Tensión ${cadenas[c.id]}/3`:"Normal"}</span></div>
            <input type="range" min={0} max={3} value={cadenas[c.id]||0} onChange={e=>setCadenas(p=>({...p,[c.id]:Number(e.target.value)}))} style={{width:"100%",accentColor:C.orange}}/>
          </div>
        ))}
      </div>
    );
    if(step===6) return (
      <div>
        {[{id:"vitD_bajo",l:"Vitamina D deficiente (<40 ng/mL)",c:C.warning},{id:"cortisol_alto",l:"Cortisol AM elevado (>23 mcg/dL)",c:C.danger},{id:"pcr_alta",l:"PCR ultrasensible elevada (>1 mg/L)",c:C.danger},{id:"tsh_alt",l:"TSH alterada",c:C.orange},{id:"mag_bajo",l:"Magnesio bajo (<1.7 mg/dL)",c:C.warning}].map(m=>(
          <div key={m.id} onClick={()=>setEndocrino(p=>({...p,[m.id]:!p[m.id]}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:9,cursor:"pointer",marginBottom:5,background:endocrino[m.id]?`${m.c}10`:"transparent",border:`1px solid ${endocrino[m.id]?`${m.c}30`:C.border}`}}>
            <span style={{fontSize:12,color:endocrino[m.id]?C.text:C.muted}}>{m.l}</span>
            <div style={{width:34,height:18,borderRadius:9,background:endocrino[m.id]?m.c:"rgba(255,255,255,0.08)",position:"relative",transition:"background 0.2s"}}>
              <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:endocrino[m.id]?18:2,transition:"left 0.2s"}}/>
            </div>
          </div>
        ))}
      </div>
    );
    if(step===7) return (
      <div>
        <div style={{fontSize:11,color:C.muted,marginBottom:10}}>Deficiencias identificadas:</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {["Vitamina D3+K2","Magnesio","Omega-3","Colágeno","Zinc","Vitamina C","CoQ10","Enzimas proteolíticas"].map(o=>(
            <div key={o} onClick={()=>setNutricion(p=>({...p,deficiencias:p.deficiencias?.includes(o)?p.deficiencias.filter(x=>x!==o):[...(p.deficiencias||[]),o]}))} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",borderRadius:7,cursor:"pointer",background:nutricion.deficiencias?.includes(o)?C.successDim:"transparent",border:`1px solid ${nutricion.deficiencias?.includes(o)?C.success:C.border}`}}>
              <div style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${nutricion.deficiencias?.includes(o)?C.success:C.muted}`,background:nutricion.deficiencias?.includes(o)?C.successDim:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:C.success}}>{nutricion.deficiencias?.includes(o)?"✓":""}</div>
              <span style={{fontSize:11,color:nutricion.deficiencias?.includes(o)?C.text:C.muted}}>{o}</span>
            </div>
          ))}
        </div>
      </div>
    );
    if(step===8) return (
      <div>
        {[{id:"dolor_persistente",l:"Dolor persistente / sensibilización central"},{id:"trigger_points",l:"Trigger points activos"},{id:"fiebre",l:"⛔ Fiebre + dolor musculoesquelético"},{id:"esfinteres",l:"⛔ Pérdida control esfínteres"}].map(f=>(
          <div key={f.id} onClick={()=>setNeuro(p=>({...p,[f.id]:!p[f.id]}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:9,cursor:"pointer",marginBottom:5,background:neuro[f.id]?C.dangerDim:"transparent",border:`1px solid ${neuro[f.id]?C.danger:C.border}`}}>
            <span style={{fontSize:12,color:neuro[f.id]?C.danger:C.muted}}>{f.l}</span>
            <div style={{width:34,height:18,borderRadius:9,background:neuro[f.id]?C.danger:"rgba(255,255,255,0.08)",position:"relative"}}>
              <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:neuro[f.id]?18:2,transition:"left 0.2s"}}/>
            </div>
          </div>
        ))}
      </div>
    );
    // RESULTADO
    if(!resultado) return null;
    const gc={I:{c:C.success,l:"Grado I — Leve"},II:{c:C.warning,l:"Grado II — Moderado"},III:{c:C.danger,l:"Grado III — Severo"}}[resultado.grado];
    const protos=[{id:"hilt",l:"⚡ HILT Láser",c:C.warning},{id:"crioterapia",l:"❄️ Crioterapia",c:C.primary},{id:"biowave",l:"🔌 BioWave",c:C.purple},{id:"bemer",l:"🔵 BEMER",c:C.teal},{id:"rehabilitacion",l:"💪 Rehabilitación",c:C.orange},{id:"acupuntura",l:"🎯 Acupuntura",c:C.success},{id:"sueno",l:"😴 Sueño",c:C.primary},{id:"vestibular",l:"🌀 Vestibular",c:C.teal},{id:"nutricion",l:"🥗 Nutrición",c:C.success}].filter(p=>resultado.protocolos[p.id]);
    return (
      <div>
        {resultado.urgente&&<div style={{background:C.dangerDim,border:`1px solid ${C.danger}40`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:20}}>🚨</span><div><div style={{fontSize:13,fontWeight:800,color:C.danger}}>CASO URGENTE</div><div style={{fontSize:11,color:C.muted}}>Requiere evaluación médica inmediata</div></div></div>}
        <div style={{background:`${gc.c}10`,border:`1px solid ${gc.c}30`,borderRadius:12,padding:16,textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:24,fontWeight:900,color:gc.c}}>{gc.l}</div>
          <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:8}}>
            {Object.values(resultado.capas).filter(v=>v.length>0).length} capas afectadas
          </div>
        </div>
        {resultado.redFlags.length>0&&<div style={{background:C.dangerDim,border:`1px solid ${C.danger}25`,borderRadius:10,padding:12,marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.danger,marginBottom:6}}>RED FLAGS</div>{resultado.redFlags.map((f,i)=><div key={i} style={{fontSize:11,color:C.muted,marginBottom:3}}>• {f}</div>)}</div>}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:8}}>DIAGNÓSTICO 4 CAPAS</div>
          {[{id:"estructural",l:"🦴 Estructural",c:C.warning},{id:"funcional",l:"⚙️ Funcional",c:C.orange},{id:"sistemica",l:"🧬 Sistémica",c:C.teal},{id:"neurologica",l:"🧠 Neurológica",c:C.purple}].map(capa=>{
            const items=resultado.capas[capa.id];
            return <div key={capa.id} style={{background:items.length?`${capa.c}08`:C.surface,border:`1px solid ${items.length?`${capa.c}25`:C.border}`,borderRadius:9,padding:"10px 12px",marginBottom:6}}>
              <div style={{fontSize:11,fontWeight:700,color:items.length?capa.c:C.muted,marginBottom:items.length?6:0}}>{capa.l}</div>
              {items.map((it,i)=><div key={i} style={{fontSize:11,color:C.muted}}>• {it}</div>)}
              {!items.length&&<div style={{fontSize:10,color:C.dim}}>Sin hallazgos</div>}
            </div>;
          })}
        </div>
        <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:8}}>PROTOCOLO AUTOMÁTICO</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {protos.map(p=><div key={p.id} style={{background:`${p.c}10`,border:`1px solid ${p.c}25`,borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:700,color:p.c}}>{p.l}</div>)}
        </div>
        {resultado.alertas.length>0&&<div style={{marginTop:12,background:C.warningDim,border:`1px solid ${C.warning}25`,borderRadius:10,padding:12}}><div style={{fontSize:11,fontWeight:700,color:C.warning,marginBottom:6}}>ALERTAS</div>{resultado.alertas.map((a,i)=><div key={i} style={{fontSize:11,color:C.muted,marginBottom:3}}>• {a}</div>)}</div>}
        <Btn onClick={()=>{setStep(0);setResultado(null);setLesiones({});setEva(0);}} color={C.primary} style={{width:"100%",marginTop:14}}>🔄 Nueva Evaluación</Btn>
      </div>
    );
  }

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20,height:"calc(100vh - 100px)",overflow:"hidden"}}>
      <div style={{overflowY:"auto"}}>
        <div style={{marginBottom:20}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:800,color:C.text}}>🧠 Motor Central Diagnóstico</h2>
          <p style={{margin:"4px 0 0",color:C.muted,fontSize:13}}>{patient?`${patient.nombre} ${patient.apellido} · `:""}9 módulos → 4 capas → Protocolo automático</p>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:20}}>
          {MODS.map((m,i)=><button key={m.id} onClick={()=>setStep(i)} style={{padding:"5px 10px",borderRadius:20,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,background:step===i?`${m.color}20`:i<step||step===MODS.length?"rgba(255,255,255,0.05)":"transparent",color:step===i?m.color:C.dim,border:`1px solid ${step===i?`${m.color}35`:"transparent"}`}}>{i<step||step===MODS.length?"✓ ":""}{m.label}</button>)}
        </div>
        <Card color={step<MODS.length?MODS[step]?.color:C.success} style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:800,color:step<MODS.length?MODS[step]?.color:C.success,marginBottom:16}}>{step<MODS.length?MODS[step]?.label:"✓ Resultado Diagnóstico"}</div>
          {renderStep()}
        </Card>
      </div>
      <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:12}}>NAVEGACIÓN</div>
          {step<MODS.length?(
            <div style={{display:"flex",gap:8}}>
              {step>0&&<Btn onClick={()=>setStep(step-1)} color={C.muted} style={{flex:1,padding:"9px"}}>←</Btn>}
              {step<MODS.length-1?<Btn onClick={()=>setStep(step+1)} color={MODS[step].color} style={{flex:1,padding:"9px"}}>→</Btn>:<Btn onClick={ejecutar} disabled={running} color={C.success} style={{flex:1,padding:"9px"}}>{running?"⏳...":"🚀 Generar"}</Btn>}
            </div>
          ):<Btn onClick={ejecutar} color={C.success} style={{width:"100%",padding:"9px"}}>🔄 Rediagnosticar</Btn>}
        </Card>
        <Card>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:10}}>RESUMEN LIVE</div>
          {[{l:"EVA",v:`${eva}/10`,c:eva>=8?C.danger:eva>=5?C.warning:C.success},{l:"Lesiones",v:Object.values(lesiones).filter(Boolean).length,c:C.warning},{l:"PSQI",v:sueno.psqi,c:sueno.psqi>=5?C.danger:C.success},{l:"TSI",v:termo.tsi,c:termo.tsi==="hipertermico"?C.danger:C.success},{l:"ΔT",v:`${termo.asimetria}°C`,c:termo.asimetria>=1.5?C.danger:C.success},{l:"DHI",v:vertigo.dhi,c:vertigo.dhi>=60?C.danger:C.success}].map(m=>(
            <div key={m.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
              <span style={{fontSize:11,color:C.muted}}>{m.l}</span><span style={{fontSize:11,fontWeight:700,color:m.c}}>{m.v}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:8}}>MÓDULOS</div>
          {MODS.map((m,i)=><button key={m.id} onClick={()=>setStep(i)} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:7,border:"none",cursor:"pointer",marginBottom:2,background:step===i?`${m.color}12`:"transparent",color:step===i?m.color:C.muted,textAlign:"left",fontSize:11,fontWeight:step===i?700:400}}>{m.label}</button>)}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ── PLUGIN: ANALYTICS ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function AnalyticsPlugin({patients,sessions}) {
  const {C} = useApp();
  const [tab,setTab] = useState("overview");

  const mejoria = sessions.filter(s=>s.eva_pre&&s.eva_post).length
    ? Math.round(sessions.filter(s=>s.eva_pre&&s.eva_post).reduce((a,s)=>a+((s.eva_pre-s.eva_post)/s.eva_pre*100),0)/sessions.filter(s=>s.eva_pre&&s.eva_post).length) : 0;
  const byProto = sessions.reduce((a,s)=>{a[s.protocolo]=(a[s.protocolo]||0)+1;return a;},{});
  const evaData = [{s:1,pre:8,post:6},{s:2,pre:7,post:5},{s:3,pre:7,post:4},{s:4,pre:6,post:4},{s:5,pre:6,post:3},{s:6,pre:5,post:3},{s:7,pre:5,post:2}];
  const thermoTrend = [{s:1,v:2.1},{s:2,v:1.9},{s:3,v:1.7},{s:4,v:1.4},{s:5,v:1.1},{s:6,v:0.8},{s:7,v:0.5}];

  return (
    <div>
      <div style={{marginBottom:24}}><h2 style={{margin:0,fontSize:22,fontWeight:800,color:C.text}}>📊 Analytics Clínico</h2><p style={{margin:"5px 0 0",color:C.muted,fontSize:13}}>Métricas, tendencias y reportes del proyecto</p></div>
      <div style={{display:"flex",gap:4,marginBottom:24,borderBottom:`1px solid ${C.border}`}}>
        {[{id:"overview",l:"📈 General"},{id:"eva",l:"💊 Tendencia EVA"},{id:"thermo",l:"🌡️ Termografía"},{id:"protos",l:"⚡ Protocolos"},{id:"patients",l:"👥 Pacientes"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 16px",border:"none",cursor:"pointer",background:"transparent",fontSize:13,fontWeight:700,color:tab===t.id?C.purple:C.muted,borderBottom:tab===t.id?`2px solid ${C.purple}`:"2px solid transparent"}}>{t.l}</button>
        ))}
      </div>

      {tab==="overview"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
            {[{l:"Total Sesiones",v:sessions.length,c:C.primary,icon:"📅"},{l:"Mejoría Promedio",v:`${mejoria}%`,c:C.success,icon:"📈"},{l:"Pacientes Activos",v:patients.length,c:C.purple,icon:"👥"},{l:"Protocolos Usados",v:Object.keys(byProto).length,c:C.warning,icon:"⚡"}].map(k=>(
              <Card key={k.l} color={k.c}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:42,height:42,borderRadius:10,background:`${k.c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{k.icon}</div>
                  <div><div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div><div style={{fontSize:11,color:C.muted}}>{k.l}</div></div>
                </div>
              </Card>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <Card><div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:14}}>DISTRIBUCIÓN DE PROTOCOLOS</div>
              {Object.entries(byProto).concat([["Crioterapia",4],["Rehabilitación",6]]).slice(0,6).map(([proto,count])=>{
                const colors={HILT:C.warning,Crioterapia:C.primary,Rehabilitación:C.orange,Termografía:C.thermo,Acupuntura:C.success};
                const c=colors[proto]||C.purple;
                return <div key={proto} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:C.text}}>{proto}</span><span style={{fontSize:12,fontWeight:700,color:c}}>{count}</span></div>
                  <div style={{background:"rgba(255,255,255,0.06)",borderRadius:99,height:5,overflow:"hidden"}}><div style={{width:`${Math.min((count/10)*100,100)}%`,height:"100%",background:c,borderRadius:99}}/></div>
                </div>;
              })}
            </Card>
            <Card><div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:14}}>PROGRESO POR PACIENTE</div>
              {patients.map(p=>{
                const pS=sessions.filter(s=>s.paciente_id===p.id);
                const m=pS.filter(s=>s.eva_pre&&s.eva_post).length?Math.round(pS.filter(s=>s.eva_pre&&s.eva_post).reduce((a,s)=>a+((s.eva_pre-s.eva_post)/s.eva_pre*100),0)/pS.filter(s=>s.eva_pre&&s.eva_post).length):0;
                const mc=m>=60?C.success:m>=30?C.warning:C.thermo;
                return <div key={p.id} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:C.text}}>{p.nombre} {p.apellido}</span><span style={{fontSize:12,fontWeight:800,color:mc}}>{m}%</span></div>
                  <div style={{background:"rgba(255,255,255,0.06)",borderRadius:99,height:5,overflow:"hidden"}}><div style={{width:`${m}%`,height:"100%",background:mc,borderRadius:99,transition:"width 0.8s"}}/></div>
                </div>;
              })}
            </Card>
          </div>
        </div>
      )}

      {tab==="eva"&&(
        <Card><div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:16}}>TENDENCIA EVA PRE vs POST — Carlos Mendoza</div>
          <div style={{position:"relative",height:180,marginBottom:12}}>
            <svg width="100%" height="180" style={{overflow:"visible"}}>
              {[0,2,4,6,8,10].map(v=>{const y=180-(v/10*160);return(<g key={v}><line x1="0" y1={y} x2="100%" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/><text x="-4" y={y+4} textAnchor="end" fill={C.muted} fontSize="10">{v}</text></g>);})}
              <polyline points={evaData.map((d,i)=>`${(i/(evaData.length-1))*100}%,${180-(d.pre/10*160)}`).join(" ")} fill="none" stroke={C.danger} strokeWidth="2.5" strokeLinejoin="round"/>
              <polyline points={evaData.map((d,i)=>`${(i/(evaData.length-1))*100}%,${180-(d.post/10*160)}`).join(" ")} fill="none" stroke={C.success} strokeWidth="2.5" strokeLinejoin="round"/>
              {evaData.map((d,i)=>{const x=`${(i/(evaData.length-1))*100}%`;return(<g key={i}><circle cx={x} cy={180-(d.pre/10*160)} r="5" fill={C.danger}/><circle cx={x} cy={180-(d.post/10*160)} r="5" fill={C.success}/></g>);})}
            </svg>
          </div>
          <div style={{display:"flex",gap:20,justifyContent:"center"}}>
            {[{c:C.danger,l:"EVA Pre"},{c:C.success,l:"EVA Post"}].map(leg=><div key={leg.l} style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:16,height:3,background:leg.c,borderRadius:2}}/><span style={{fontSize:12,color:C.muted}}>{leg.l}</span></div>)}
          </div>
        </Card>
      )}

      {tab==="thermo"&&(
        <Card><div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:16}}>ASIMETRÍA TÉRMICA — EVOLUCIÓN (ΔT°C)</div>
          <div style={{position:"relative",height:180,marginBottom:12}}>
            <svg width="100%" height="180">
              {[0,0.5,1,1.5,2,2.5].map(v=>{const y=180-(v/2.5*160);return(<g key={v}><line x1="0" y1={y} x2="100%" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/><text x="-4" y={y+4} textAnchor="end" fill={C.muted} fontSize="10">{v}°</text></g>);})}
              <line x1="0" y1={180-(1.5/2.5*160)} x2="100%" y2={180-(1.5/2.5*160)} stroke={C.thermo} strokeWidth="1" strokeDasharray="4,4"/>
              <text x="4" y={180-(1.5/2.5*160)-5} fill={C.thermo} fontSize="10">Umbral crítico 1.5°C</text>
              <polyline points={thermoTrend.map((d,i)=>`${(i/(thermoTrend.length-1))*100}%,${180-(d.v/2.5*160)}`).join(" ")} fill="none" stroke={C.thermo} strokeWidth="2.5" strokeLinejoin="round"/>
              {thermoTrend.map((d,i)=>{const x=`${(i/(thermoTrend.length-1))*100}%`;const c=d.v>=1.5?C.thermo:d.v>=0.5?C.warning:C.success;return <circle key={i} cx={x} cy={180-(d.v/2.5*160)} r="5" fill={c}/>;} )}
            </svg>
          </div>
          <div style={{fontSize:12,color:C.success,textAlign:"center"}}>↓ Reducción del {((thermoTrend[0].v-thermoTrend[thermoTrend.length-1].v)/thermoTrend[0].v*100).toFixed(0)}% en asimetría térmica</div>
        </Card>
      )}

      {tab==="protos"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:14}}>
          {[{n:"HILT Láser",icon:"⚡",c:C.warning,sessions:12,success:87},{n:"Crioterapia",icon:"❄️",c:C.primary,sessions:8,success:91},{n:"Termografía",icon:"🌡️",c:C.thermo,sessions:20,success:100},{n:"Rehabilitación",icon:"💪",c:C.orange,sessions:15,success:78},{n:"Copiloto IA",icon:"🧠",c:C.success,sessions:30,success:95},{n:"BioWave",icon:"🔌",c:C.purple,sessions:5,success:70}].map(p=>(
            <Card key={p.n} color={p.c}>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                <div style={{width:40,height:40,borderRadius:10,background:`${p.c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{p.icon}</div>
                <div><div style={{fontSize:14,fontWeight:800,color:C.text}}>{p.n}</div><div style={{fontSize:11,color:C.muted}}>{p.sessions} sesiones</div></div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,color:C.muted}}>Efectividad</span><span style={{fontSize:12,fontWeight:700,color:p.c}}>{p.success}%</span></div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:99,height:5,overflow:"hidden"}}><div style={{width:`${p.success}%`,height:"100%",background:p.c,borderRadius:99}}/></div>
            </Card>
          ))}
        </div>
      )}

      {tab==="patients"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {patients.map(p=>{
            const pS=sessions.filter(s=>s.paciente_id===p.id);
            const lastEva=pS.length?pS[0].eva_post||pS[0].eva_pre:null;
            const m=pS.filter(s=>s.eva_pre&&s.eva_post).length?Math.round(pS.filter(s=>s.eva_pre&&s.eva_post).reduce((a,s)=>a+((s.eva_pre-s.eva_post)/s.eva_pre*100),0)/pS.filter(s=>s.eva_pre&&s.eva_post).length):0;
            return <Card key={p.id}>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <Avatar name={`${p.nombre} ${p.apellido}`} size={44}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:C.text}}>{p.nombre} {p.apellido}</div>
                  <div style={{fontSize:11,color:C.muted}}>{p.condicion_principal}</div>
                  <div style={{display:"flex",gap:8,marginTop:6}}>
                    <Badge color={C.primary}>{pS.length} sesiones</Badge>
                    <Badge color={m>=50?C.success:C.warning}>Mejoría {m}%</Badge>
                    {lastEva&&<Badge color={lastEva<=3?C.success:lastEva<=6?C.warning:C.danger}>EVA actual {lastEva}</Badge>}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:28,fontWeight:900,color:m>=60?C.success:m>=30?C.warning:C.danger}}>{m}%</div>
                  <div style={{fontSize:10,color:C.muted}}>mejoría</div>
                </div>
              </div>
            </Card>;
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ── PLUGIN: TELEMEDICINA ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function TelemedicinePlugin({patient}) {
  const {C} = useApp();
  const [callStatus,setCallStatus] = useState("idle");
  const [tab,setTab] = useState("video");
  const [chatInput,setChatInput] = useState("");
  const [chatMsgs,setChatMsgs] = useState([{from:"sistema",text:"Sesión de telemedicina iniciada.",time:"Ahora"}]);
  const [callTime,setCallTime] = useState(0);
  const timerRef = useRef(null);

  function startCall(){setCallStatus("connecting");setTimeout(()=>{setCallStatus("active");timerRef.current=setInterval(()=>setCallTime(t=>t+1),1000);},1800);}
  function endCall(){setCallStatus("idle");clearInterval(timerRef.current);setCallTime(0);}
  function sendChat(){if(!chatInput.trim())return;setChatMsgs(p=>[...p,{from:"doctor",text:chatInput.trim(),time:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}]);setChatInput("");}
  const ct=`${String(Math.floor(callTime/60)).padStart(2,"0")}:${String(callTime%60).padStart(2,"0")}`;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{margin:0,fontSize:20,fontWeight:800,color:C.text}}>📱 Telemedicina</h2><p style={{margin:"4px 0 0",color:C.muted,fontSize:13}}>{patient?`${patient.nombre} ${patient.apellido}`:""}</p></div>
        {callStatus==="active"&&<div style={{background:C.dangerDim,border:`1px solid ${C.danger}30`,borderRadius:20,padding:"5px 14px",fontSize:11,fontWeight:700,color:C.danger,display:"flex",gap:6,alignItems:"center"}}><div style={{width:6,height:6,borderRadius:"50%",background:C.danger,animation:"pulse 1s infinite"}}/>{ct}</div>}
      </div>
      <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:`1px solid ${C.border}`}}>
        {[{id:"video",l:"📹 Video"},{id:"chat",l:"💬 Chat"},{id:"files",l:"📎 Archivos"},{id:"history",l:"📅 Historial"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 16px",border:"none",cursor:"pointer",background:"transparent",fontSize:13,fontWeight:700,color:tab===t.id?C.teal:C.muted,borderBottom:tab===t.id?`2px solid ${C.teal}`:"2px solid transparent"}}>{t.l}</button>
        ))}
      </div>

      {tab==="video"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20}}>
          <div>
            <div style={{background:"#050A14",borderRadius:16,overflow:"hidden",border:`1px solid ${callStatus==="active"?`${C.teal}40`:C.border}`,aspectRatio:"16/9",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
              {callStatus==="idle"&&<div style={{textAlign:"center",color:C.muted}}><div style={{fontSize:56,marginBottom:12}}>👨‍⚕️</div><div style={{fontSize:14,fontWeight:700}}>Listo para conectar</div><div style={{fontSize:12,marginTop:6,color:C.dim}}>Cámara y micrófono se activarán al iniciar</div></div>}
              {callStatus==="connecting"&&<div style={{textAlign:"center",color:C.teal}}><div style={{fontSize:40,marginBottom:12}}>📡</div><div style={{fontSize:13,fontWeight:700}}>Conectando con {patient?.nombre||"paciente"}...</div></div>}
              {callStatus==="active"&&<div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#1a2a4a,#0a1525)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:64,marginBottom:8}}>👤</div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{patient?.nombre||"Paciente"}</div><div style={{fontSize:11,color:C.muted,marginTop:4}}>En llamada · {ct}</div></div>
                <div style={{position:"absolute",bottom:16,right:16,width:90,height:65,background:"#0a1f3a",borderRadius:10,border:`1px solid ${C.teal}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>👨‍⚕️</div>
                <div style={{position:"absolute",top:12,left:12,background:"rgba(239,68,68,0.8)",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#fff",display:"flex",gap:5,alignItems:"center"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#fff"}}/>LIVE</div>
              </div>}
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              {callStatus==="idle"&&<Btn onClick={startCall} color={C.teal} style={{padding:"12px 32px",fontSize:14}}>📹 Iniciar videollamada</Btn>}
              {callStatus==="active"&&<>
                {["🎤 Mute","📷 Video","💬 Chat","🖥️ Pantalla"].map(b=><Btn key={b} onClick={b.includes("Chat")?()=>setTab("chat"):undefined} color={C.muted} style={{padding:"9px 14px",fontSize:12}}>{b}</Btn>)}
                <Btn onClick={endCall} color={C.danger} style={{padding:"9px 20px",fontSize:13}}>📵 Finalizar</Btn>
              </>}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {patient&&<Card><div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:10}}>PACIENTE</div><div style={{display:"flex",gap:10,alignItems:"center"}}><Avatar name={`${patient.nombre} ${patient.apellido}`} size={40}/><div><div style={{fontSize:13,fontWeight:800,color:C.text}}>{patient.nombre} {patient.apellido}</div><div style={{fontSize:11,color:C.muted}}>{patient.edad} años</div></div></div><div style={{marginTop:10}}><Badge color={C.primary}>{patient.condicion_principal}</Badge></div></Card>}
            <Card><div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:10}}>ACCIONES RÁPIDAS</div>
              {["📋 Ver Historia Clínica","🌡️ Enviar termografía","📄 Compartir protocolo","📝 Nota SOAP en vivo"].map(a=>(
                <button key={a} style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:12,cursor:"pointer",marginBottom:5,transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.tealDim;e.currentTarget.style.color=C.teal;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.muted;}}>{a}</button>
              ))}
            </Card>
          </div>
        </div>
      )}

      {tab==="chat"&&(
        <div style={{maxWidth:680}}>
          <Card style={{height:380,overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:10}}>
            {chatMsgs.map((m,i)=>(
              <div key={i} style={{display:"flex",flexDirection:m.from==="doctor"?"row-reverse":"row",gap:8,alignItems:"flex-start"}}>
                <div style={{width:28,height:28,borderRadius:8,background:m.from==="doctor"?C.tealDim:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{m.from==="doctor"?"👨‍⚕️":"⚙️"}</div>
                <div style={{maxWidth:"70%",background:m.from==="doctor"?C.tealDim:"rgba(255,255,255,0.04)",border:`1px solid ${m.from==="doctor"?"rgba(45,212,191,0.25)":C.border}`,borderRadius:10,padding:"9px 12px"}}>
                  <div style={{fontSize:13,color:C.text}}>{m.text}</div>
                  <div style={{fontSize:9,color:C.dim,marginTop:3}}>{m.time}</div>
                </div>
              </div>
            ))}
          </Card>
          <div style={{display:"flex",gap:10}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Escribe un mensaje..." style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:13,padding:"10px 14px",fontFamily:"inherit"}}/>
            <Btn onClick={sendChat} color={C.teal}>Enviar</Btn>
          </div>
        </div>
      )}

      {tab==="files"&&<Card>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:14}}>DOCUMENTOS COMPARTIDOS</div>
        {["📄 Protocolo HILT.pdf","🌡️ Termografía sesión 7.jpg","📋 Historia clínica resumida.pdf","💊 Indicaciones post-sesión.pdf"].map(f=>(
          <div key={f} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
            <span style={{fontSize:13,color:C.text}}>{f}</span>
            <div style={{display:"flex",gap:8}}><Btn color={C.primary} style={{padding:"4px 12px",fontSize:11}}>Ver</Btn><Btn color={C.muted} style={{padding:"4px 12px",fontSize:11,background:"transparent",border:`1px solid ${C.border}`,color:C.muted}}>Enviar</Btn></div>
          </div>
        ))}
        <Btn color={C.primary} style={{marginTop:14}}>+ Compartir archivo</Btn>
      </Card>}

      {tab==="history"&&<div>
        {[{d:"Hace 5 días · 15:00",dur:"22 min",notes:"Seguimiento semana 2. EVA 6→4."},{d:"Hace 12 días · 10:30",dur:"18 min",notes:"Indicaciones crioterapia domiciliaria."},{d:"Hace 15 días · 11:00",dur:"35 min",notes:"Consulta inicial. Plan definido."}].map((h,i)=>(
          <Card key={i} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{h.d} · {h.dur}</div></div><Badge color={C.teal}>Completada</Badge></div>
            <div style={{fontSize:12,color:C.muted,background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px 12px"}}>{h.notes}</div>
          </Card>
        ))}
      </div>}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ── PLUGIN: PAGOS / STRIPE ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function PaymentsPlugin() {
  const {C} = useApp();
  const [tab,setTab] = useState("plans");
  const plans = [
    {name:"Starter",price:149,color:C.muted,features:["3 pacientes activos","Historia clínica digital","Protocolos básicos","Sin IA clínica","Sin FLIR"],popular:false},
    {name:"Professional",price:299,color:C.primary,features:["25 pacientes activos","Copiloto IA GPT-4o","Cámara FLIR integrada","Motor Central Dx","Telemedicina","Analytics avanzados"],popular:true},
    {name:"Clinic",price:599,color:C.purple,features:["Pacientes ilimitados","Todo Professional","Multi-clínica","InBody + VALD + Bodygee","White-label","Soporte prioritario"],popular:false},
    {name:"Franchise",price:"custom",color:C.warning,features:["Modelo franquicia","Revenue sharing","Training completo","Territorio exclusivo","EB2-NIW support","Marketing"],popular:false},
  ];

  return (
    <div>
      <div style={{marginBottom:24}}><h2 style={{margin:0,fontSize:22,fontWeight:800,color:C.text}}>💳 Planes y Membresías</h2><p style={{margin:"5px 0 0",color:C.muted,fontSize:13}}>Stripe integrado · Facturación automática</p></div>
      <div style={{display:"flex",gap:4,marginBottom:24,borderBottom:`1px solid ${C.border}`}}>
        {[{id:"plans",l:"📋 Planes"},{id:"billing",l:"💳 Facturación"},{id:"revenue",l:"📊 Ingresos"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 16px",border:"none",cursor:"pointer",background:"transparent",fontSize:13,fontWeight:700,color:tab===t.id?C.success:C.muted,borderBottom:tab===t.id?`2px solid ${C.success}`:"2px solid transparent"}}>{t.l}</button>
        ))}
      </div>

      {tab==="plans"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
            {plans.map(p=>(
              <div key={p.name} style={{background:p.popular?`${p.color}08`:C.surface,border:`1px solid ${p.popular?`${p.color}35`:C.border}`,borderRadius:16,padding:20,position:"relative"}}>
                {p.popular&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:p.color,borderRadius:20,padding:"3px 14px",fontSize:9,fontWeight:800,color:"#fff",whiteSpace:"nowrap"}}>MÁS POPULAR</div>}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>{p.name}</div>
                  {typeof p.price==="number"?<div style={{display:"flex",alignItems:"baseline",gap:3}}><span style={{fontSize:26,fontWeight:900,color:p.color}}>${p.price}</span><span style={{fontSize:11,color:C.muted}}>/mes</span></div>:<span style={{fontSize:18,fontWeight:900,color:p.color}}>Personalizado</span>}
                </div>
                {p.features.map(f=><div key={f} style={{display:"flex",gap:7,marginBottom:6}}><span style={{color:p.color,fontSize:12}}>✓</span><span style={{fontSize:11,color:C.muted}}>{f}</span></div>)}
                <Btn color={p.color} style={{width:"100%",marginTop:14,padding:"9px",fontSize:12}}>{typeof p.price==="number"?"Seleccionar →":"Contactar ventas"}</Btn>
              </div>
            ))}
          </div>
          <Card style={{background:"rgba(16,185,129,0.04)"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.success,marginBottom:6}}>✓ STRIPE CONFIGURADO</div>
            <p style={{margin:0,fontSize:13,color:C.muted}}>Reemplaza <code style={{background:"rgba(255,255,255,0.08)",padding:"1px 6px",borderRadius:4,fontSize:11,color:C.success}}>TU_STRIPE_PUBLIC_KEY_AQUI</code> con tu clave pública de Stripe para activar pagos reales.</p>
          </Card>
        </div>
      )}

      {tab==="billing"&&<Card>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:14}}>FACTURACIÓN ACTIVA</div>
        {[{date:"Mayo 2026",amount:"$299",plan:"Professional",status:"pagado"},{date:"Abril 2026",amount:"$299",plan:"Professional",status:"pagado"},{date:"Marzo 2026",amount:"$149",plan:"Starter",status:"pagado"}].map((b,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
            <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{b.date} · Plan {b.plan}</div><div style={{fontSize:11,color:C.muted}}>Renovación automática</div></div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{fontSize:16,fontWeight:800,color:C.success}}>{b.amount}</div><Badge color={C.success}>{b.status}</Badge></div>
          </div>
        ))}
      </Card>}

      {tab==="revenue"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
            {[{l:"MRR",v:"$2,690",c:C.success,sub:"Monthly Recurring Revenue"},{l:"Pacientes pagos",v:"9",c:C.primary,sub:"3 planes activos"},{l:"Proyección anual",v:"$32,280",c:C.purple,sub:"Con crecimiento actual"}].map(k=>(
              <Card key={k.l} style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,color:k.c,marginBottom:4}}>{k.v}</div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{k.l}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{k.sub}</div></Card>
            ))}
          </div>
          <Card>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:2,marginBottom:14}}>CRECIMIENTO MRR</div>
            <svg width="100%" height="90" style={{overflow:"visible"}}>
              {[150,180,210,240,270,299,299].map((v,i)=>{const x=(i/6)*100+"%";const h=(v/350)*70;const y=90-h;return <g key={i}><rect x={`calc(${x} - 14px)`} y={y} width="28" height={h} rx="5" fill={C.success} fillOpacity="0.7"/><text x={x} y={y-5} textAnchor="middle" fill={C.muted} fontSize="9">${v}</text></g>;})}
            </svg>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.dim,marginTop:6}}>
              {["Nov","Dic","Ene","Feb","Mar","Abr","May"].map(m=><span key={m}>{m}</span>)}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. PLUGIN REGISTRY — REGISTRO CENTRAL
//    Para agregar un módulo: añade un objeto aquí.
//    Para desactivar: comenta o elimina su entrada.
// ─────────────────────────────────────────────────────────────
const pluginRegistry = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: "⊞",
    color: DS.colors.primary,
    group: "clinical",
    version: "1.0.0",
    description: "Vista general del sistema",
    component: DashboardPlugin,
  },
  {
    id: "patients",
    name: "Pacientes",
    icon: "👥",
    color: DS.colors.primary,
    group: "clinical",
    version: "1.0.0",
    description: "Gestión de pacientes",
    component: PatientsPlugin,
  },
  {
    id: "flir",
    name: "Cámara FLIR",
    icon: "🌡️",
    color: DS.colors.thermo,
    group: "devices",
    version: "1.0.0",
    description: "Termografía en vivo",
    badge: "SDK",
    patientAction: true,
    patientActionLabel: "FLIR",
    onPatientAction: (patient, navigate) => navigate("flir", patient),
    component: FLIRPlugin,
  },
  {
    id: "copilot",
    name: "Copiloto IA",
    icon: "🧠",
    color: DS.colors.success,
    group: "ai",
    version: "1.0.0",
    description: "Asistente clínico GPT-4o",
    badge: "IA",
    patientAction: true,
    patientActionLabel: "IA",
    onPatientAction: (patient, navigate) => navigate("copilot", patient),
    component: CopilotPlugin,
  },
  {
    id: "devices",
    name: "Dispositivos",
    icon: "🔌",
    color: DS.colors.purple,
    group: "devices",
    version: "1.0.0",
    description: "Hub de integraciones",
    component: DevicesPlugin,
  },
  // ── MÓDULOS EN DESARROLLO ─────────────────────────────────
  // Para activar: reemplaza component con el componente real
  {
    id: "inbody",
    name: "InBody",
    icon: "⚖️",
    color: DS.colors.primary,
    group: "devices",
    version: "0.1.0",
    description: "Composición corporal segmental",
    badge: "Próximo",
    patientAction: true,
    patientActionLabel: "InBody",
    onPatientAction: (patient, navigate) => navigate("inbody", patient),
    component: () => <PlaceholderPlugin name="InBody Integration" icon="⚖️" description="Importa datos de composición corporal segmental desde LookinBody WebAPI o archivos CSV del software LB120." coming />,
  },
  {
    id: "vald",
    name: "VALD Performance",
    icon: "💪",
    color: DS.colors.warning,
    group: "devices",
    version: "0.1.0",
    description: "Fuerza y rendimiento muscular",
    badge: "Próximo",
    patientAction: true,
    patientActionLabel: "VALD",
    onPatientAction: (patient, navigate) => navigate("vald", patient),
    component: () => <PlaceholderPlugin name="VALD Performance" icon="💪" description="Integración con ForceDecks, NordBord y VALD Hub via REST API OAuth2." coming />,
  },
  {
    id: "bodygee",
    name: "Bodygee 3D",
    icon: "🔵",
    color: DS.colors.purple,
    group: "devices",
    version: "0.1.0",
    description: "Escaneo corporal 3D",
    badge: "Próximo",
    component: () => <PlaceholderPlugin name="Bodygee 3D Scanner" icon="🔵" description="Sincronización de avatares 3D y métricas corporales via Bodygee API + webhooks automáticos." coming />,
  },
  {
    id: "garmin",
    name: "Garmin Health",
    icon: "⌚",
    color: DS.colors.success,
    group: "devices",
    version: "0.1.0",
    description: "Datos de wearable continuo",
    badge: "Próximo",
    component: () => <PlaceholderPlugin name="Garmin Health API" icon="⌚" description="HR continuo, sueño, estrés, pasos y más desde wearables Garmin via Health API." coming />,
  },
  {
    id: "motor",
    name: "Motor Diagnóstico",
    icon: "🧠",
    color: DS.colors.success,
    group: "clinical",
    version: "1.0.0",
    description: "9 módulos → 4 capas → Protocolo",
    badge: "Core",
    patientAction: true,
    patientActionLabel: "Diagnóstico",
    onPatientAction: (patient, navigate) => navigate("motor", patient),
    component: MotorCentralPlugin,
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: "📊",
    color: DS.colors.purple,
    group: "business",
    version: "1.0.0",
    description: "Métricas y reportes clínicos",
    component: AnalyticsPlugin,
  },
  {
    id: "telemedicine",
    name: "Telemedicina",
    icon: "📱",
    color: DS.colors.teal,
    group: "clinical",
    version: "1.0.0",
    description: "Videollamada con pacientes",
    patientAction: true,
    patientActionLabel: "Teleconsulta",
    onPatientAction: (patient, navigate) => navigate("telemedicine", patient),
    component: TelemedicinePlugin,
  },
  {
    id: "payments",
    name: "Pagos",
    icon: "💳",
    color: DS.colors.success,
    group: "business",
    version: "1.0.0",
    description: "Planes y membresías Stripe",
    component: PaymentsPlugin,
  },
  {
    id: "education",
    name: "Educación",
    icon: "📚",
    color: DS.colors.orange,
    group: "education",
    version: "1.0.0",
    description: "Biblioteca clínica AW4W",
    component: () => <PlaceholderPlugin name="Módulos Educativos" icon="📚" description="EKG · Netter's Sports Medicine · Body Structures · Acupuntura · Biorresonancia · OT Toolkit · Killer Practical · USMLE Rehab" coming />,
  },
];

// ─────────────────────────────────────────────────────────────
// 8. LOGIN SCREEN
// ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function go() {
    setError(""); setLoading(true);
    try { const d = await CoreServices.signIn(email, pass); if (d.user) onLogin(d.user); else setError(d.error?.message || "Error"); }
    catch { setError("Error de conexión"); } finally { setLoading(false); }
  }
  const C = DS.colors;
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DS.font }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[[300, 200, "#38BDF8"], [500, 500, "#818CF8"], [100, 400, "#10B981"]].map(([x, y, c], i) => (
          <div key={i} style={{ position: "absolute", left: `${x / 12}%`, top: `${y / 8}%`, width: 400, height: 400, borderRadius: "50%", background: `${c}06`, filter: "blur(80px)" }} />
        ))}
      </div>
      <div style={{ width: "100%", maxWidth: 420, padding: 20, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 9, letterSpacing: 5, color: C.dim, marginBottom: 8 }}>PLATAFORMA CLÍNICA MODULAR</div>
          <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: -2, background: "linear-gradient(135deg,#38BDF8 0%,#818CF8 50%,#F472B6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AWAKE4WELLNESS</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Sistema Modular v4.0 · {pluginRegistry.length} módulos disponibles</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 20, padding: 32 }}>
          {IS_DEMO && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: C.success }}>🎯 Modo demo — presiona Entrar para explorar</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@clinica.com" />
            <Input label="Contraseña" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
            {error && <div style={{ fontSize: 12, color: C.danger, background: "rgba(239,68,68,0.1)", padding: "8px 12px", borderRadius: 8 }}>{error}</div>}
            <Btn onClick={go} disabled={loading} color={C.primary} fullWidth style={{ padding: "13px", fontSize: 14 }}>{loading ? "Cargando..." : "→ Entrar"}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. APP SHELL — NUNCA SE MODIFICA
//    Todo el sidebar y navegación se genera automáticamente
//    desde el pluginRegistry
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("dashboard");
  const [contextData, setContextData] = useState(null); // paciente activo, etc.
  const [patients, setPatients] = useState(DEMO_PATIENTS);
  const [sessions, setSessions] = useState(DEMO_SESSIONS);

  useEffect(() => { const u = CoreServices.getUser(); if (u) setUser(u); }, []);

  async function handleLogin(u) { setUser(u); }
  function logout() { CoreServices.signOut(); setUser(null); }

  function navigate(screenId, data = null) {
    setScreen(screenId);
    if (data) setContextData(data);
  }

  async function addPatient(form) {
    const { data } = await CoreServices.insert("pacientes", { ...form, medico_id: user?.id });
    const newPat = data?.[0] || { ...form, id: Date.now().toString(), activo: true };
    setPatients(p => [...p, newPat]);
  }

  async function addSession(form) {
    const { data } = await CoreServices.insert("sesiones", { ...form, medico_id: user?.id });
    const newSess = data?.[0] || { ...form, id: Date.now().toString(), fecha: new Date().toISOString() };
    setSessions(p => [...p, newSess]);
  }

  const C = DS.colors;
  const appCtx = { C, navigate, patients, sessions };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  // Group plugins for sidebar
  const grouped = Object.entries(PLUGIN_GROUPS).map(([groupId, group]) => ({
    ...group, id: groupId,
    plugins: pluginRegistry.filter(p => p.group === groupId),
  })).filter(g => g.plugins.length > 0);

  // Render current plugin
  function renderPlugin() {
    if (screen === "patient-detail" && contextData) {
      return <PatientDetailPlugin patient={contextData} sessions={sessions} onAddSession={addSession} navigate={navigate} plugins={pluginRegistry} />;
    }
    const plugin = pluginRegistry.find(p => p.id === screen);
    if (!plugin) return null;
    const PluginComponent = plugin.component;
    return <PluginComponent
      patient={contextData}
      patients={patients}
      sessions={sessions}
      onAddPatient={addPatient}
      navigate={navigate}
      plugins={pluginRegistry}
    />;
  }

  const currentPlugin = pluginRegistry.find(p => p.id === screen);

  return (
    <AppCtx.Provider value={appCtx}>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg, fontFamily: DS.font, color: C.text }}>

        {/* SIDEBAR — generado automáticamente desde pluginRegistry */}
        <div style={{ width: 220, minWidth: 220, background: "rgba(255,255,255,0.02)", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* Logo */}
          <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 8, letterSpacing: 3, color: C.dim, marginBottom: 3 }}>AWAKE4</div>
            <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.5, background: "linear-gradient(135deg,#38BDF8,#818CF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>WELLNESS</div>
            <div style={{ fontSize: 8, color: C.dim, marginTop: 1 }}>Sistema Modular v4.0</div>
            {IS_DEMO && <div style={{ fontSize: 8, color: C.warning, marginTop: 3 }}>● MODO DEMO</div>}
          </div>

          {/* Auto-generated navigation */}
          <nav style={{ flex: 1, padding: "10px 10px" }}>
            {grouped.map(group => (
              <div key={group.id} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: 2, padding: "0 8px", marginBottom: 4 }}>
                  {group.icon} {group.label.toUpperCase()}
                </div>
                {group.plugins.map(plugin => (
                  <button key={plugin.id} onClick={() => navigate(plugin.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 9,
                    border: "none", cursor: "pointer", marginBottom: 2, textAlign: "left", transition: "all 0.15s",
                    background: screen === plugin.id ? dim(plugin.color) : "transparent",
                    color: screen === plugin.id ? plugin.color : C.muted,
                    fontWeight: screen === plugin.id ? 700 : 400, fontSize: 12,
                    borderLeft: screen === plugin.id ? `2px solid ${plugin.color}` : "2px solid transparent",
                  }}>
                    <span style={{ fontSize: 13, width: 18, textAlign: "center" }}>{plugin.icon}</span>
                    <span style={{ flex: 1 }}>{plugin.name}</span>
                    {plugin.badge && screen !== plugin.id && (
                      <span style={{ fontSize: 8, background: dim(plugin.color, 0.2), color: plugin.color, border: `1px solid ${plugin.color}25`, borderRadius: 8, padding: "1px 5px", fontWeight: 700 }}>{plugin.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* User */}
          <div style={{ padding: 10, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Avatar name={user.email || "Dr"} color={C.purple} size={30} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{IS_DEMO ? "Modo Demo" : user.email?.split("@")[0]}</div>
                <div style={{ fontSize: 9, color: C.dim }}>Medicina Deportiva</div>
              </div>
            </div>
            <button onClick={logout} style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: C.danger, borderRadius: 7, padding: "5px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Cerrar Sesión</button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Top bar */}
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(6,11,22,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, padding: "10px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {screen === "patient-detail" && <button onClick={() => navigate("patients")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: 0 }}>← Pacientes /</button>}
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                {screen === "patient-detail" ? `${contextData?.nombre} ${contextData?.apellido}` : currentPlugin?.name || screen}
              </span>
              {currentPlugin?.badge && <Badge color={currentPlugin.color}>{currentPlugin.badge}</Badge>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 10, color: C.dim }}>{pluginRegistry.length} módulos · {pluginRegistry.filter(p => !p.badge || p.badge === "SDK" || p.badge === "IA" || p.badge === "Beta").length} activos</div>
              <div style={{ background: C.successDim, border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: C.success, fontWeight: 700 }}>Sistema Modular v4.0</div>
            </div>
          </div>
          {/* Plugin content */}
          <div style={{ padding: 28 }}>
            {renderPlugin()}
          </div>
        </div>
      </div>
    </AppCtx.Provider>
  );
}
