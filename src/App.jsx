// ═══════════════════════════════════════════════════════════════
// AWAKE4WELLNESS — ARQUITECTURA MODULAR v4.0
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
// ═══════════════════════════════════════════════════════════════
// BLOQUE 1/5 · Store compartido de Historia Clínica (Awake4Wellness)
// Versión "se cuelga sola": NO hay que envolver nada en la app.
// Usa useState y useEffect, que tu archivo ya importa (línea 13).
// ═══════════════════════════════════════════════════════════════

// --- Una sola "pizarra" en memoria para toda la app ---
const _hcStore = {};          // { [patientId]: hc }
const _hcSubs = new Set();    // avisa a los componentes cuando algo cambia
function _hcEmit() { _hcSubs.forEach((fn) => fn()); }

// Estado inicial vacío de una HC. Ajusta/añade campos según tu HistoriaClinicaV3.
function createEmptyHc(patient = {}) {
  return {
    // Datos
    nombre: [patient.nombre, patient.apellido].filter(Boolean).join(" "),
    edad: patient.edad || "", sexo: "", documento: "", telefono: "",
    email: patient.email || "", ocupacion: "", deporte: "",
    nivel_actividad: patient.nivel_actividad || "",
    fecha_nacimiento: "", fecha_consulta: new Date().toLocaleDateString("es-ES"),
    // Motivo / dolor
    motivo: "", eva: 0, tipo_dolor: [], localizacion: "", patron: "", irradiacion: "",
    // Enfermedad actual
    inicio: "", evolucion: "", agravantes: "", aliviantes: "",
    trat_previos: "", estudios_previos: "",
    // Antecedentes + Killer Practical
    ant_medicos: "", ant_quirurgicos: "", ant_trauma: "", alergias: "",
    medicamentos: "", ant_deportivos: "", lesiones_sospecha: {},
    // Tecnología (termografía / eco)
    termografia: {},
    // Diagnóstico 4 capas
    dx_estructural: "", grado_estructural: "",
    dx_funcional: "",  grado_funcional: "",
    dx_sistemica: "",  grado_sistemica: "",
    dx_neurologica: "", grado_neurologica: "",
    // Plan y seguimiento
    plan: "", notas: "", seguimiento: "",
  };
}

// ═══════════════════════════════════════════════════════════════
// BLOQUE 3/5 · buildContext — resume la Historia Clínica para la IA
// Función pura: NO modifica nada. Solo lee la HC y devuelve un texto
// compacto. Por ahora NADIE la usa todavía (eso será el Bloque 4).
// ═══════════════════════════════════════════════════════════════
function buildContext(hc = {}, patient = {}) {
  const lineas = [];
  const add = (etiqueta, valor) => {
    if (valor === null || valor === undefined) return;
    let v = valor;
    if (Array.isArray(v)) v = v.filter(Boolean).join(", ");
    v = String(v).trim();
    if (v === "" || v === "0") return;
    lineas.push(`- ${etiqueta}: ${v}`);
  };

  // Identificación
  add("Nombre", hc.nombre || [patient.nombre, patient.apellido].filter(Boolean).join(" "));
  add("Edad", hc.edad || patient.edad);
  add("Sexo", hc.sexo);
  add("Ocupación", hc.ocupacion);
  add("Deporte", hc.deporte);
  add("Nivel de actividad", hc.nivel_actividad || patient.nivel_actividad);

  // Motivo y dolor
  add("Motivo de consulta", hc.motivo);
  add("Dolor (EVA 0-10)", hc.eva);
  add("Tipo de dolor", hc.tipo_dolor);
  add("Localización", hc.localizacion);
  add("Patrón", hc.patron);
  add("Irradiación", hc.irradiacion);
  add("Inicio", hc.inicio);
  add("Evolución", hc.evolucion);
  add("Agravantes", hc.agravantes);
  add("Aliviantes", hc.aliviantes);

  // Antecedentes
  add("Tratamientos previos", hc.trat_previos);
  add("Estudios previos", hc.estudios_previos);
  add("Antecedentes médicos", hc.ant_medicos);
  add("Antecedentes quirúrgicos", hc.ant_quirurgicos);
  add("Antecedentes de trauma", hc.ant_trauma);
  add("Alergias", hc.alergias);
  add("Medicamentos", hc.medicamentos);
  add("Antecedentes deportivos", hc.ant_deportivos);

  // Diagnóstico por capas
  if (hc.dx_estructural) add("Dx estructural", `${hc.dx_estructural}${hc.grado_estructural ? " (grado " + hc.grado_estructural + ")" : ""}`);
  if (hc.dx_funcional)   add("Dx funcional",   `${hc.dx_funcional}${hc.grado_funcional ? " (grado " + hc.grado_funcional + ")" : ""}`);
  if (hc.dx_sistemica)   add("Dx sistémica",   `${hc.dx_sistemica}${hc.grado_sistemica ? " (grado " + hc.grado_sistemica + ")" : ""}`);
  if (hc.dx_neurologica) add("Dx neurológica", `${hc.dx_neurologica}${hc.grado_neurologica ? " (grado " + hc.grado_neurologica + ")" : ""}`);

  // Plan y notas
  add("Plan", hc.plan);
  add("Notas", hc.notas);
  add("Seguimiento", hc.seguimiento);

  if (lineas.length === 0) {
    return "HISTORIA CLÍNICA DEL PACIENTE: (sin datos registrados todavía)";
  }
  return "HISTORIA CLÍNICA DEL PACIENTE:\n" + lineas.join("\n");
}
// Hook por paciente: devuelve { hc, update, set }
function useClinicalRecord(patient) {
  const patientId = patient?.id || "sin-paciente";
  const [, _tick] = useState(0);
  useEffect(() => {
    const fn = () => _tick((n) => n + 1);
    _hcSubs.add(fn);
    return () => _hcSubs.delete(fn);
  }, []);
  const hc = _hcStore[patientId] || createEmptyHc(patient);
  return {
    hc,
    update: (partial) => {
      _hcStore[patientId] = { ...(_hcStore[patientId] || createEmptyHc(patient)), ...partial };
      _hcEmit();
    },
    set: (full) => {
      _hcStore[patientId] = full;
      _hcEmit();
    },
  };
}

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

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaXpycHluY2tqZ2VkYnZqeXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDUyNzEsImV4cCI6MjA5NTcyMTI3MX0.CkSRdZt93-LN9EbFqT3PXeZjGaxgWVlalV5hecPJwOY";
const SUPABASE_URL = "https://paizrpynckjgedbvjyqy.supabase.co";
const IS_DEMO      = SUPABASE_URL.includes("TU_");
const AI_DEMO      = false; // API key viene de variable de entorno en Vercel

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
    const r = await fetch(url, { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token || SUPABASE_KEY}` } });
    const d = await r.json();
    return { data: Array.isArray(d) ? d : [], error: d.error || null };
  },
  async insert(table, body) {
    if (IS_DEMO) return { data: [{ ...body, id: Date.now().toString() }], error: null };
    const token = this.getToken();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token || SUPABASE_KEY}`, "Prefer": "return=representation" }, body: JSON.stringify(Array.isArray(body) ? body : [body]) });
    const d = await r.json();
    return { data: d, error: d.error || null };
  },

  // Storage (for images)
  async uploadFile(bucket, path, file) {
    if (IS_DEMO) return { url: URL.createObjectURL(file), error: null };
    const token = this.getToken();
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, { method: "POST", headers: { "Authorization": `Bearer ${token || SUPABASE_KEY}`, "apikey": SUPABASE_KEY }, body: file });
    const d = await r.json();
    return { url: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`, error: d.error || null };
  },

  // AI
  async askAI(messages, systemPrompt, onChunk) {
    if (AI_DEMO) {
      const demo = `Basándome en el contexto clínico disponible:\n\n**Análisis:**\nEl progreso del paciente es positivo con reducción sostenida del dolor.\n\n**Recomendaciones:**\n- Mantener protocolo HILT actual\n- Crioterapia post-sesión indicada (TSI hipertérmico)\n- Reevaluar en próxima sesión\n\n*Activa tu OpenAI API key para respuestas en tiempo real.*`;
      let i = 0;
      await new Promise(res => { const iv = setInterval(() => { i = Math.min(i + 4, demo.length); onChunk && onChunk(demo.slice(0, i)); if (i >= demo.length) { clearInterval(iv); res(); } }, 16); });
      return demo;
    }
    const res = await fetch("/api/chat", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ messages, system: systemPrompt }),

    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

    const full = data.text || "";

    onChunk && onChunk(full);

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
  const [alexText, setAlexText] = useState("");
  const [alexLoading, setAlexLoading] = useState(false);
  const [alexError, setAlexError] = useState(""); const { transcript: alexVoz, listening: alexEscuchando, supported: alexMicOk, start: alexMicStart, stop: alexMicStop } = useSpeechRecognition(); useEffect(() => { if (alexVoz) setAlexText(alexVoz); }, [alexVoz]);
  async function rellenarConAlex() {
    if (!alexText.trim()) return;
    setAlexLoading(true); setAlexError("");
    try {
      const systemPrompt = `Eres Alex, asistente clínico de Awake4Wellness. Extraes datos de un paciente desde un texto libre. Respondes ÚNICAMENTE con JSON válido, sin markdown. Solo incluye un campo si el texto lo menciona.`;
      const userMsg = `Texto: "${alexText}"\n\nDevuelve este JSON:\n{"nombre":"","apellido":"","edad":"","sexo":"Masculino|Femenino|Otro","telefono":"","email":"","condicion_principal":"","deporte":"","nivel_actividad":"Sedentario|Leve|Moderado|Activo|Atleta"}`;
      const text = await CoreServices.askAI([{ role: "user", content: userMsg }], systemPrompt);
      const data = JSON.parse((text || "{}").replace(/```json|```/g, "").trim());
      setForm(p => ({ ...p, nombre: data.nombre || p.nombre, apellido: data.apellido || p.apellido, edad: data.edad || p.edad, sexo: data.sexo || p.sexo, telefono: data.telefono || p.telefono, email: data.email || p.email, condicion_principal: data.condicion_principal || p.condicion_principal, deporte: data.deporte || p.deporte, nivel_actividad: data.nivel_actividad || p.nivel_actividad }));
    } catch (e) {
      setAlexError("Alex no pudo procesar el texto. Puede que la IA aún no esté conectada.");
    } finally { setAlexLoading(false); }
  }

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
        <div style={{ background: "rgba(16,185,129,0.06)", border: `1px solid ${C.success}30`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🧠</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.success }}>Alex te ayuda a llenar</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Escribe en una frase los datos del paciente y Alex los reparte en el formulario.</div>
          <textarea value={alexText} onChange={e => setAlexText(e.target.value)} placeholder="Ej: Carlos Mendoza, 34 años, hombre, tendinopatía rotuliana, juega tenis" rows={2} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, padding: "9px 12px", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", marginBottom: 8 }} />
          {alexError && <div style={{ fontSize: 11, color: C.danger, marginBottom: 8 }}>{alexError}</div>}
          <Btn onClick={() => alexEscuchando ? alexMicStop() : alexMicStart()} disabled={!alexMicOk} color={alexEscuchando ? C.danger : C.primary} fullWidth style={{ marginBottom: 8 }}>{alexEscuchando ? "🔴 Escuchando... toca para parar" : "🎤 Dictar con voz"}</Btn><Btn onClick={rellenarConAlex} disabled={alexLoading || !alexText.trim()} color={C.success} fullWidth>
            {alexLoading ? "🧠 Alex está leyendo..." : "✨ Rellenar con Alex"}
          </Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          <Input label="Nombre" value={form.nombre} onChange={e => upd("nombre", e.target.value)} placeholder="Carlos" />
          <Input label="Apellido" value={form.apellido} onChange={e => upd("apellido", e.target.value)} placeholder="Mendoza" />

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Fecha de Nacimiento</label>
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={e => upd("fecha_nacimiento", e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: "10px 14px", fontFamily: "inherit", boxSizing: "border-box", outline: "none", colorScheme: "dark" }}
            />
          </div>

          <Input label="Edad (años)" type="number" value={form.edad} onChange={e => upd("edad", e.target.value)} placeholder="34" />

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

          <Input label="Teléfono / WhatsApp" value={form.telefono} onChange={e => upd("telefono", e.target.value)} placeholder="+1 555 0000" />
          <Input label="Email" value={form.email} onChange={e => upd("email", e.target.value)} placeholder="carlos@email.com" />

          <div style={{ gridColumn: "1/-1" }}>
            <Input label="Condición Principal" value={form.condicion_principal} onChange={e => upd("condicion_principal", e.target.value)} placeholder="Ej: Tendinopatía rotuliana, Dolor lumbar crónico..." />
          </div>

          <Input label="Deporte principal" value={form.deporte} onChange={e => upd("deporte", e.target.value)} placeholder="Ej: Tenis, Pickleball, Golf..." />

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
// 🎙️ DICTADO CLÍNICO POR VOZ — Auto-llenado
// ═══════════════════════════════════════════════════════════════

function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setSupported(true);
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "es-ES";
      rec.onresult = (e) => {
        let full = "";
        for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript + " ";
        setTranscript(full.trim());
      };
      rec.onend = () => setListening(false);
      recRef.current = rec;
    }
  }, []);

  function start() { if (recRef.current) { setTranscript(""); recRef.current.start(); setListening(true); } }
  function stop() { if (recRef.current) { recRef.current.stop(); setListening(false); } }

  return { transcript, listening, supported, start, stop, setTranscript };
}

async function analizarConsultaIA(transcript, patient) {
  const systemPrompt = `Eres Alex, el asistente clínico de Awake4Wellness, especializado en medicina deportiva y recuperación. Extraes información estructurada de la transcripción de una consulta médica. NO inventas datos: solo llenas un campo si la transcripción lo menciona. Respondes ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.`;

  const userMsg = `PACIENTE: ${patient?.nombre || "No especificado"} ${patient?.apellido || ""}, ${patient?.edad || "?"} años
CONDICIÓN: ${patient?.condicion_principal || "No especificada"}

TRANSCRIPCIÓN DE LA CONSULTA:
"${transcript}"

Devuelve exactamente esta estructura JSON:
{
  "motivo": "motivo principal de consulta",
  "eva": número del 1 al 10 o null,
  "localizacion": "localización del dolor o síntoma",
  "inicio": "cuándo inició el problema",
  "evolucion": "cómo ha evolucionado",
  "agravantes": "qué lo empeora",
  "aliviantes": "qué lo mejora",
  "trat_previos": "tratamientos previos mencionados",
  "dx_principal": "diagnóstico presuntivo principal",
  "plan": "plan de tratamiento mencionado",
  "nota_soap": { "subjetivo": "", "objetivo": "", "analisis": "", "plan": "" },
  "alertas": ["red flags o alertas identificadas"],
  "resumen": "resumen ejecutivo en 2-3 oraciones"
}`;

  try {
    const text = await CoreServices.askAI([{ role: "user", content: userMsg }], systemPrompt);
    const clean = (text || "").replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function DictadoClinico({ patient, onAutoFill, C }) {
  const { transcript, listening, supported, start, stop, setTranscript } = useSpeechRecognition();
  const [phase, setPhase] = useState("idle"); // idle | recording | processing | done
  const [resultado, setResultado] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (listening) { timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000); }
    else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [listening]);

  async function iniciar() { setPhase("recording"); setElapsed(0); setResultado(null); start(); }

  async function finalizar() {
    stop();
    setPhase("processing");
    const res = await analizarConsultaIA(transcript, patient);
    setResultado(res);
    setPhase("done");
    if (res) onAutoFill(res);
  }

  function reiniciar() { setPhase("idle"); setResultado(null); setTranscript(""); setElapsed(0); }

  const ct = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  if (!supported) return (
    <div style={{ background: C.warningDim, border: `1px solid ${C.warning}30`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: C.warning }}>⚠️ Tu navegador no soporta reconocimiento de voz. Usa Chrome o Safari.</div>
    </div>
  );

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${phase === "recording" ? C.danger + "40" : phase === "done" ? C.success + "40" : C.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>🎙️ Dictado Clínico con IA</div>
          <div style={{ fontSize: 11, color: C.muted }}>Habla durante la consulta — la IA auto-llena la historia clínica</div>
        </div>
        {phase === "recording" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.dangerDim, border: `1px solid ${C.danger}30`, borderRadius: 20, padding: "5px 14px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.danger, animation: "pulse 1s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.danger }}>GRABANDO {ct}</span>
          </div>
        )}
      </div>

      {phase === "idle" && (
        <button onClick={iniciar} style={{ width: "100%", padding: "14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: `1px solid rgba(239,68,68,0.35)`, color: C.danger, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          🎙️ Iniciar grabación de consulta
        </button>
      )}

      {phase === "recording" && (
        <div>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 14, marginBottom: 14, minHeight: 80, maxHeight: 200, overflowY: "auto", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8 }}>TRANSCRIPCIÓN EN VIVO</div>
            {transcript ? (
              <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.7 }}>{transcript}</p>
            ) : (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.danger, animation: "pulse 0.8s infinite" }} />
                <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Escuchando... habla ahora</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={reiniciar} style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✕ Cancelar</button>
            <button onClick={finalizar} disabled={!transcript} style={{ flex: 1, padding: "12px", borderRadius: 10, background: transcript ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${transcript ? C.success + "40" : C.border}`, color: transcript ? C.success : C.muted, fontSize: 14, fontWeight: 800, cursor: transcript ? "pointer" : "not-allowed" }}>
              ✓ Finalizar y analizar con IA
            </button>
          </div>
        </div>
      )}

      {phase === "processing" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 2s linear infinite", display: "inline-block" }}>🧠</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Analizando consulta con IA...</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Procesando y estructurando la información clínica</div>
        </div>
      )}

      {phase === "done" && resultado && (
        <div>
          <div style={{ background: C.successDim, border: `1px solid ${C.success}30`, borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.success, marginBottom: 4 }}>✓ Historia clínica auto-llenada</div>
            <div style={{ fontSize: 12, color: C.muted }}>{resultado.resumen}</div>
          </div>

          {resultado.alertas?.length > 0 && (
            <div style={{ background: C.dangerDim, border: `1px solid ${C.danger}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, marginBottom: 6 }}>⚠️ ALERTAS IDENTIFICADAS</div>
              {resultado.alertas.map((a, i) => <div key={i} style={{ fontSize: 12, color: C.muted }}>• {a}</div>)}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { l: "Motivo", v: resultado.motivo, c: C.primary },
              { l: "EVA", v: resultado.eva ? `${resultado.eva}/10` : "—", c: resultado.eva >= 7 ? C.danger : resultado.eva >= 4 ? C.warning : C.success },
              { l: "Localización", v: resultado.localizacion, c: C.teal },
              { l: "Dx presuntivo", v: resultado.dx_principal, c: C.purple },
            ].filter(i => i.v).map(item => (
              <div key={item.l} style={{ background: `${item.c}08`, border: `1px solid ${item.c}20`, borderRadius: 9, padding: "8px 12px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: item.c, marginBottom: 3 }}>{item.l.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: C.text }}>{item.v}</div>
              </div>
            ))}
          </div>

          {resultado.nota_soap && (
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 14, marginBottom: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>NOTA SOAP GENERADA</div>
              {Object.entries(resultado.nota_soap).map(([k, v]) => v && (
                <div key={k} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.primary, textTransform: "uppercase" }}>{k}: </span>
                  <span style={{ fontSize: 12, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={reiniciar} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔄 Nueva grabación</button>
            <button onClick={() => setPhase("idle")} style={{ flex: 1, padding: "10px", borderRadius: 10, background: C.successDim, border: `1px solid ${C.success}30`, color: C.success, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓ Confirmar y continuar</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
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
    nombre: patient?.nombre + " " + patient?.apellido || "",
    fecha_nacimiento: "",
    edad: patient?.edad || "",
    sexo: "",
    documento: "", telefono: "", email: patient?.email || "",
    ocupacion: "", nivel_actividad: patient?.nivel_actividad || "",
    deporte: "", fecha_consulta: new Date().toLocaleDateString("es-ES"),
    motivo: "", eva: 0, tipo_dolor: [], localizacion: "", patron: "", irradiacion: "",
    inicio: "", evolucion: "", agravantes: "", aliviantes: "", trat_previos: "", estudios_previos: "",
    ant_medicos: "", ant_quirurgicos: "", ant_trauma: "", alergias: "", medicamentos: "", ant_deportivos: "", ant_laborales: "", ant_familiares: "",
    lesiones_sospecha: {},
    mecanismo: {}, inspeccion: [], palpacion: "", movilidad: "", fuerza: "",
    pruebas_ortopedicas: {}, red_flags: {},
    psqi: 0, isi: 0, epworth: 0, horas_sueno: 7,
    dix_hallpike: "negativo", dhi: 0, red_flags_vestibular: false,
    cadenas: {}, causa_funcional: "",
    vitD: "", cortisol: "", pcr: "", tsh: "", glucosa: "", magnesio: "",
    suplementos: {},
    termografia: {}, ecografia: [],
    dx_estructural: "", dx_funcional: "", dx_sistemica: "", dx_neurologica: "",
    grado_estructural: "", grado_funcional: "", grado_sistemica: "", grado_neurologica: "",
    dx_principal: "", dx_secundarios: "",
    hilt_potencia: "", hilt_energia: "", hilt_modo: "", hilt_duracion: "", hilt_zona: "", hilt_sesiones: "",
    crioterapia_modalidad: "", crioterapia_timing: "",
    biowave: false, bemer: false, tens: false, acupuntura: false,
    rehab_fase: "",
    seguimiento: [], alta: "",
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

     const { set: publicarHc } = useClinicalRecord(patient);
     useEffect(() => { publicarHc(hc); }, [hc]);

     function autoFillFromVoice(data) {
    setHc(prev => ({
      ...prev,
      motivo: data.motivo || prev.motivo,
      eva: data.eva || prev.eva,
      localizacion: data.localizacion || prev.localizacion,
      inicio: data.inicio || prev.inicio,
      evolucion: data.evolucion || prev.evolucion,
      agravantes: data.agravantes || prev.agravantes,
      aliviantes: data.aliviantes || prev.aliviantes,
      trat_previos: data.trat_previos || prev.trat_previos,
      dx_principal: data.dx_principal || prev.dx_principal,
      notas: data.nota_soap ? `SOAP:\nS: ${data.nota_soap.subjetivo || ""}\nO: ${data.nota_soap.objetivo || ""}\nA: ${data.nota_soap.analisis || ""}\nP: ${data.nota_soap.plan || ""}` : prev.notas,
    }));
    setSeccion("s2");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
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

      <div>
        <DictadoClinico patient={patient} onAutoFill={autoFillFromVoice} C={C} />
        {seccion === "s1" && <div>
          {sec("1. DATOS DEL PACIENTE")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            <div style={{ gridColumn: "1/-1" }}>
              {lbl("Nombre completo")}{inp("nombre", "Carlos Mendoza")}
            </div>

            <div>
              {lbl("Fecha de nacimiento")}
              <input
                type="date"
                value={hc.fecha_nacimiento}
                onChange={e => upd("fecha_nacimiento", e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, padding: "9px 12px", fontFamily: "inherit", boxSizing: "border-box", outline: "none", colorScheme: "dark" }}
              />
            </div>

            <div>{lbl("Edad (años)")}{inp("edad", "34")}</div>

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

            <div>{lbl("Documento de identidad")}{inp("documento", "Ej: 123456789")}</div>
            <div>{lbl("Teléfono / WhatsApp")}{inp("telefono", "+1 555 0000")}</div>
            <div>{lbl("Correo electrónico")}{inp("email", "paciente@email.com")}</div>
            <div>{lbl("Ocupación")}{inp("ocupacion", "Ej: Deportista, Oficinista...")}</div>
            <div>{lbl("Deporte principal")}{inp("deporte", "Ej: Tenis, Pickleball, Golf...")}</div>
            <div>{lbl("Fecha de consulta")}{inp("fecha_consulta", "")}</div>

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

// ── PLUGIN: FLIR Camera + Galería Termográfica ─────────────
function FLIRPlugin({ patient }) {
  const { C } = useApp();
  const [tab, setTab] = useState("camara"); // camara | galeria | comparar
  const [status, setStatus] = useState("disconnected");
  const [captured, setCaptured] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analisisIA, setAnalisisIA] = useState(null);
  const [imagenes, setImagenes] = useState([
    { id: 1, fecha: "15/05/2025", sesion: 1, zona: "Rodilla derecha", tsi: "Hipertérmico", asimetria: 2.1, url: null, notas: "Inflamación activa pre-tratamiento", protocolo: "HILT + Crioterapia" },
    { id: 2, fecha: "22/05/2025", sesion: 3, zona: "Rodilla derecha", tsi: "Hipertérmico", asimetria: 1.6, url: null, notas: "Reducción parcial de inflamación", protocolo: "HILT" },
    { id: 3, fecha: "29/05/2025", sesion: 6, zona: "Rodilla derecha", tsi: "Neutro", asimetria: 0.8, url: null, notas: "Excelente respuesta al tratamiento", protocolo: "Rehabilitación" },
  ]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [uploadForm, setUploadForm] = useState({ zona: "", sesion: "", tsi: "Hipertérmico", asimetria: "", notas: "", protocolo: "" });
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const [tick, setTick] = useState(0);
  const streaming = status === "streaming";

  useEffect(() => { if (!streaming) return; const id = setInterval(() => setTick(t => t + 1), 120); return () => clearInterval(id); }, [streaming]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); const w = c.width, h = c.height;
    ctx.fillStyle = "#050A14"; ctx.fillRect(0, 0, w, h);
    if (status === "disconnected") return;
    const g = ctx.createRadialGradient(w * .58, h * .48, 15, w * .5, h * .5, w * .65);
    [["#ff2200", 0], ["#ff8800", .3], ["#ffaa00", .55], ["#220066", .8], ["#000033", 1]].forEach(([col, s]) => g.addColorStop(s, col));
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

  async function analizarConIA(img) {
    setAnalyzing(true);
    setAnalisisIA(null);
    try {
      const systemPrompt = `Eres Alex, asistente clínico de Awake4Wellness, especialista en termografía (Dr. Javier Cuartas). Analizas el termograma en tres ejes clínicos: inflamación (zonas calientes/hipertérmicas), dolor y fatiga; y defines si el patrón corresponde a MÚSCULO (calor localizado, sobrecarga) o a NERVIO (asimetría fría en el territorio del nervio). Integra estos ejes en los campos diagnostico, inflamacion y recomendaciones. El termograma orienta; la lectura clínica final la confirma el médico. Respondes ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.`;
      const userMsg = `Analiza esta imagen termográfica clínica.

DATOS:
- Paciente: ${patient?.nombre || "Paciente"} ${patient?.apellido || ""}
- Zona: ${img.zona}
- TSI: ${img.tsi}
- Asimetría: Δ${img.asimetria}°C
- Sesión: ${img.sesion} · Fecha: ${img.fecha}
- Protocolo previo: ${img.protocolo}

Devuelve este JSON:
{
  "diagnostico": "Orientación termográfica principal",
  "nivel_alarma": "L1/L2/L3",
  "inflamacion": "estado inflamatorio",
  "crioterapia": true/false,
  "hilt": true/false,
  "urgencia": "normal/moderada/alta",
  "recomendaciones": ["rec 1", "rec 2", "rec 3"],
  "progreso": "evaluación del progreso",
  "siguiente_sesion": "indicaciones próxima sesión"
}`;
      const text = await CoreServices.askAI([{ role: "user", content: userMsg }], systemPrompt);
      setAnalisisIA(JSON.parse((text || "{}").replace(/```json|```/g, "").trim()));
    } catch {
      setAnalisisIA({
        diagnostico: `Asimetría térmica Δ${img.asimetria}°C en ${img.zona} — ${img.tsi}`,
        nivel_alarma: img.asimetria >= 1.5 ? "L3" : img.asimetria >= 0.8 ? "L2" : "L1",
        inflamacion: img.tsi === "Hipertérmico" ? "Inflamación activa presente" : "Sin inflamación significativa",
        crioterapia: img.tsi === "Hipertérmico",
        hilt: img.asimetria >= 1.0,
        urgencia: img.asimetria >= 2.0 ? "alta" : "normal",
        recomendaciones: ["Continuar protocolo HILT según parámetros establecidos", "Crioterapia post-sesión indicada", "Reevaluar en próxima sesión"],
        progreso: "Evaluación basada en datos de la sesión actual",
        siguiente_sesion: `Mantener protocolo ${img.protocolo} y reevaluar con termografía en 3-4 sesiones`,
      });
    } finally { setAnalyzing(false); }
  }

  function handleUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      const nueva = { id: Date.now(), fecha: new Date().toLocaleDateString("es-ES"), sesion: imagenes.length + 1, zona: uploadForm.zona || "Sin especificar", tsi: uploadForm.tsi, asimetria: parseFloat(uploadForm.asimetria) || 0, url, base64, notas: uploadForm.notas, protocolo: uploadForm.protocolo };
      setImagenes(prev => [nueva, ...prev]);
    };
    reader.readAsDataURL(file);
    setUploadForm({ zona: "", sesion: "", tsi: "Hipertérmico", asimetria: "", notas: "", protocolo: "" });
  }

  function guardarCaptura() {
    const nueva = { id: Date.now(), fecha: new Date().toLocaleDateString("es-ES"), sesion: imagenes.length + 1, zona: "Captura FLIR", tsi: "Hipertérmico", asimetria: 1.8, url: null, notas: "Captura en vivo FLIR One", protocolo: "Evaluación" };
    setImagenes(prev => [nueva, ...prev]);
    setSaved(true);
  }

  const tsiColor = (tsi) => tsi === "Hipertérmico" ? C.danger : tsi === "Neutro" ? C.success : C.primary;
  const asimetriaColor = (a) => a >= 1.5 ? C.danger : a >= 0.8 ? C.warning : C.success;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>🌡️ Termografía FLIR</h2>
          <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{patient ? `${patient.nombre} ${patient.apellido}` : "Sin paciente"} · {imagenes.length} imágenes</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {saved && <div style={{ background: C.successDim, border: `1px solid ${C.success}30`, borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: C.success }}>✓ Guardado</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {[{ id: "camara", l: "📷 Cámara FLIR" }, { id: "subir", l: "📤 Subir imagen" }, { id: "galeria", l: `🗂️ Galería (${imagenes.length})` }, { id: "comparar", l: "⚖️ Comparar" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 16px", border: "none", cursor: "pointer", background: "transparent", fontSize: 13, fontWeight: 700, color: tab === t.id ? C.thermo : C.muted, borderBottom: tab === t.id ? `2px solid ${C.thermo}` : "2px solid transparent" }}>{t.l}</button>
        ))}
      </div>

      {tab === "camara" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
          <div>
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${streaming ? C.thermo + "60" : C.border}`, marginBottom: 14 }}>
              <canvas ref={canvasRef} width={480} height={320} style={{ display: "block", width: "100%", background: "#050A14" }} />
              {status === "disconnected" && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(5,10,20,0.92)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>FLIR One no conectado</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>USB-C · Lightning · Bluetooth</div>
              </div>}
              {streaming && <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(239,68,68,0.75)", borderRadius: 8, padding: "4px 10px", display: "flex", gap: 5, alignItems: "center" }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite" }} /><span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>LIVE</span></div>}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {status === "disconnected" && <Btn onClick={() => { setStatus("connecting"); setTimeout(() => setStatus("streaming"), 1500); }} color={C.primary} style={{ flex: 1, maxWidth: 240, padding: "13px" }}>🔌 Conectar FLIR One</Btn>}
              {streaming && !captured && <><Btn onClick={() => { setCaptured(true); setStatus("connected"); }} color={C.thermo} style={{ flex: 1, maxWidth: 200, padding: "13px" }}>📸 Capturar</Btn><Btn onClick={() => setStatus("connected")} color={C.muted}>⏸ Pausar</Btn></>}
              {captured && <><Btn onClick={guardarCaptura} disabled={saved} color={C.success}>{saved ? "✓ Guardado" : "💾 Guardar en galería"}</Btn><Btn onClick={() => { setCaptured(false); setSaved(false); setStatus("streaming"); }} color={C.muted}>🔄 Nueva</Btn></>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 14 }}>ANÁLISIS EN VIVO</div>
              {captured ? [
                { l: "Asimetría", v: "Δ1.8°C", c: C.thermo },
                { l: "TSI", v: "Hipertérmico", c: C.warning },
                { l: "Nivel alarma", v: "L2", c: C.warning },
                { l: "Crioterapia", v: "✓ Indicada", c: C.primary },
                { l: "HILT", v: "✓ Indicado", c: C.warning },
              ].map(m => (
                <div key={m.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{m.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m.c }}>{m.v}</span>
                </div>
              )) : <div style={{ textAlign: "center", padding: "30px 0", color: C.muted, fontSize: 12 }}>Captura una imagen para ver el análisis</div>}
            </Card>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>CHECKLIST TISEM</div>
              {["Aclimatación ≥15 min", "Sala 21-25°C", "Piel expuesta", "Sin cremas ni vendajes", "Sin ejercicio previo 2h"].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, fontSize: 12 }}>
                  <span style={{ color: C.success }}>✓</span>
                  <span style={{ color: C.muted }}>{item}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {tab === "subir" && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 16, padding: 32, textAlign: "center", marginBottom: 24, cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌡️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>Subir imagen termográfica</div>
            <div style={{ fontSize: 13, color: C.muted }}>Toca para seleccionar desde tu dispositivo</div>
            <div style={{ marginTop: 14, fontSize: 11, color: C.dim }}>PNG · JPG · TIFF · imágenes FLIR exportadas</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { l: "Zona evaluada", k: "zona", ph: "Ej: Rodilla derecha, Isquiotibial..." },
              { l: "Número de sesión", k: "sesion", ph: "Ej: 3" },
              { l: "Asimetría ΔT (°C)", k: "asimetria", ph: "Ej: 1.8" },
              { l: "Protocolo previo", k: "protocolo", ph: "Ej: HILT + Crioterapia" },
            ].map(f => (
              <div key={f.k}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 5 }}>{f.l}</label>
                <input value={uploadForm[f.k]} onChange={e => setUploadForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, padding: "9px 12px", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 5 }}>TSI Global</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["Hipertérmico", "Neutro", "Hipotérmico"].map(t => (
                  <button key={t} onClick={() => setUploadForm(p => ({ ...p, tsi: t }))} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${uploadForm.tsi === t ? `${tsiColor(t)}40` : C.border}`, background: uploadForm.tsi === t ? `${tsiColor(t)}15` : "transparent", color: uploadForm.tsi === t ? tsiColor(t) : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 5 }}>Notas clínicas</label>
              <textarea value={uploadForm.notas} onChange={e => setUploadForm(p => ({ ...p, notas: e.target.value }))} placeholder="Observaciones de la sesión..." rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, padding: "9px 12px", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
            </div>
          </div>
          <Btn onClick={() => fileRef.current?.click()} color={C.thermo} style={{ width: "100%", marginTop: 16, padding: "13px" }}>📤 Seleccionar imagen y guardar</Btn>
        </div>
      )}

      {tab === "galeria" && (
        <div>
          {selectedImg ? (
            <div>
              <button onClick={() => { setSelectedImg(null); setAnalisisIA(null); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }}>← Galería</button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
                <div>
                  <div style={{ background: "#050A14", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 14, minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {selectedImg.url ? <img src={selectedImg.url} alt="termografía" style={{ width: "100%", objectFit: "contain", maxHeight: 360 }} />
                      : <div style={{ textAlign: "center", padding: 40 }}>
                        <div style={{ fontSize: 64, marginBottom: 12 }}>🌡️</div>
                        <div style={{ fontSize: 13, color: C.muted }}>Imagen FLIR — Sesión {selectedImg.sesion}</div>
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Vista previa simulada</div>
                      </div>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[{ l: "TSI", v: selectedImg.tsi, c: tsiColor(selectedImg.tsi) }, { l: "Asimetría", v: `Δ${selectedImg.asimetria}°C`, c: asimetriaColor(selectedImg.asimetria) }, { l: "Sesión", v: `#${selectedImg.sesion}`, c: C.primary }].map(d => (
                      <div key={d.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: d.c }}>{d.v}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{d.l}</div>
                      </div>
                    ))}
                  </div>
                  {selectedImg.notas && <div style={{ marginTop: 14, background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: C.muted, border: `1px solid ${C.border}` }}>{selectedImg.notas}</div>}
                </div>
                <div>
                  <button onClick={() => analizarConIA(selectedImg)} disabled={analyzing} style={{ width: "100%", padding: "12px", borderRadius: 11, background: analyzing ? "rgba(255,255,255,0.03)" : "rgba(255,107,107,0.15)", border: `1px solid ${C.thermo}35`, color: C.thermo, fontSize: 13, fontWeight: 800, cursor: analyzing ? "not-allowed" : "pointer", marginBottom: 14 }}>
                    {analyzing ? "🧠 Analizando..." : "🧠 Analizar con IA"}
                  </button>
                  {analisisIA && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ background: `${tsiColor(selectedImg.tsi)}08`, border: `1px solid ${tsiColor(selectedImg.tsi)}25`, borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Orientación termográfica</div>
                        <div style={{ fontSize: 13, color: C.text }}>{analisisIA.diagnostico}</div>
                        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${asimetriaColor(selectedImg.asimetria)}15`, color: asimetriaColor(selectedImg.asimetria), fontWeight: 700 }}>Nivel {analisisIA.nivel_alarma}</span>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: C.muted }}>{analisisIA.urgencia}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1, padding: "10px", borderRadius: 10, background: analisisIA.crioterapia ? C.primaryDim : "rgba(255,255,255,0.03)", border: `1px solid ${analisisIA.crioterapia ? C.primary + "35" : C.border}`, textAlign: "center" }}>
                          <div style={{ fontSize: 16 }}>❄️</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: analisisIA.crioterapia ? C.primary : C.dim }}>Crioterapia {analisisIA.crioterapia ? "✓" : "✗"}</div>
                        </div>
                        <div style={{ flex: 1, padding: "10px", borderRadius: 10, background: analisisIA.hilt ? C.warningDim : "rgba(255,255,255,0.03)", border: `1px solid ${analisisIA.hilt ? C.warning + "35" : C.border}`, textAlign: "center" }}>
                          <div style={{ fontSize: 16 }}>⚡</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: analisisIA.hilt ? C.warning : C.dim }}>HILT {analisisIA.hilt ? "✓" : "✗"}</div>
                        </div>
                      </div>
                      <div style={{ background: C.surface, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8 }}>RECOMENDACIONES</div>
                        {analisisIA.recomendaciones?.map((r, i) => <div key={i} style={{ fontSize: 12, color: C.text, marginBottom: 6 }}>• {r}</div>)}
                      </div>
                      {analisisIA.siguiente_sesion && <div style={{ background: C.tealDim, border: `1px solid ${C.teal}25`, borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, marginBottom: 6 }}>PRÓXIMA SESIÓN</div>
                        <div style={{ fontSize: 12, color: C.text }}>{analisisIA.siguiente_sesion}</div>
                      </div>}
                    </div>
                  )}
                  {!analisisIA && !analyzing && (
                    <div style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, textAlign: "center" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Toca "Analizar con IA" para obtener interpretación clínica automática</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {imagenes.length > 1 && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 14 }}>EVOLUCIÓN ASIMETRÍA TÉRMICA (ΔT°C)</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                    {[...imagenes].reverse().map((img, i) => {
                      const h = Math.max(10, (img.asimetria / 3) * 70);
                      const c = asimetriaColor(img.asimetria);
                      return (
                        <div key={img.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ fontSize: 9, color: c, fontWeight: 700 }}>Δ{img.asimetria}°</div>
                          <div style={{ width: "100%", height: h, background: c, borderRadius: "4px 4px 0 0", opacity: 0.8 }} />
                          <div style={{ fontSize: 8, color: C.dim }}>S{img.sesion}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: C.success, textAlign: "right" }}>
                    {imagenes.length > 1 ? `↓ Reducción del ${Math.round(((imagenes[imagenes.length-1].asimetria - imagenes[0].asimetria) / imagenes[imagenes.length-1].asimetria * -100))}% en asimetría térmica` : ""}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
                {imagenes.map(img => (
                  <div key={img.id} onClick={() => { setSelectedImg(img); setAnalisisIA(null); }}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${C.thermo}40`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${C.border}`; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ height: 120, background: "#050A14", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      {img.url ? <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ textAlign: "center" }}><div style={{ fontSize: 36 }}>🌡️</div><div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>Sesión {img.sesion}</div></div>}
                      <div style={{ position: "absolute", top: 8, right: 8, background: `${tsiColor(img.tsi)}20`, border: `1px solid ${tsiColor(img.tsi)}40`, borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700, color: tsiColor(img.tsi) }}>{img.tsi}</div>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{img.zona}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{img.fecha} · Sesión {img.sesion}</div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: asimetriaColor(img.asimetria) }}>Δ{img.asimetria}°C</span>
                        <span style={{ fontSize: 10, color: C.dim }}>{img.protocolo}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div onClick={() => setTab("subir")} style={{ background: "rgba(255,255,255,0.02)", border: `2px dashed ${C.border}`, borderRadius: 14, minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 8, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.thermo; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                  <div style={{ fontSize: 32 }}>➕</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Agregar imagen</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "comparar" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {[{ label: "ANTES", key: "compareA", state: compareA, setState: setCompareA }, { label: "DESPUÉS", key: "compareB", state: compareB, setState: setCompareB }].map(side => (
              <div key={side.key}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>{side.label}</div>
                {side.state ? (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ height: 160, background: "#050A14", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {side.state.url ? <img src={side.state.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ textAlign: "center" }}><div style={{ fontSize: 40 }}>🌡️</div><div style={{ fontSize: 10, color: C.dim }}>Sesión {side.state.sesion}</div></div>}
                    </div>
                    <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{side.state.zona}</div><div style={{ fontSize: 10, color: C.muted }}>{side.state.fecha}</div></div>
                      <button onClick={() => side.setState(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: `2px dashed ${C.border}`, borderRadius: 14, minHeight: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Selecciona imagen:</div>
                    {imagenes.map(img => (
                      <button key={img.id} onClick={() => side.setState(img)} style={{ width: "80%", padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.text, fontSize: 11, cursor: "pointer", textAlign: "left" }}>
                        S{img.sesion} — {img.zona} · Δ{img.asimetria}°C
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {compareA && compareB && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 16 }}>📊 Análisis Comparativo</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {[
                  { l: "Asimetría inicial", v: `Δ${compareA.asimetria}°C`, c: asimetriaColor(compareA.asimetria) },
                  { l: "Asimetría final", v: `Δ${compareB.asimetria}°C`, c: asimetriaColor(compareB.asimetria) },
                  { l: "Mejora", v: `${Math.round(((compareA.asimetria - compareB.asimetria) / compareA.asimetria) * 100)}%`, c: compareB.asimetria < compareA.asimetria ? C.success : C.danger },
                ].map(d => (
                  <div key={d.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px", textAlign: "center", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: d.c }}>{d.v}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{d.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", background: compareB.asimetria < compareA.asimetria ? C.successDim : C.dangerDim, borderRadius: 12, fontSize: 13, color: compareB.asimetria < compareA.asimetria ? C.success : C.danger, fontWeight: 700 }}>
                {compareB.asimetria < compareA.asimetria
                  ? `✓ Respuesta positiva al tratamiento — reducción de ${(compareA.asimetria - compareB.asimetria).toFixed(1)}°C en asimetría térmica`
                  : `⚠️ Asimetría aumentó ${(compareB.asimetria - compareA.asimetria).toFixed(1)}°C — revisar protocolo`}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 📚 BASE DE CONOCIMIENTO CLÍNICO — Solo Admin
// ═══════════════════════════════════════════════════════════════

const KNOWLEDGE_BASE_DEMO = [
  {
    id: "netter",
    titulo: "Netter's Sports Medicine",
    autor: "Madden, Putukian, McCarty, Young",
    categoria: "Medicina Deportiva",
    icon: "📗",
    color: "#10B981",
    paginas: 584,
    tamanio: "48 MB",
    estado: "procesado",
    chunks: 312,
    fecha_subida: "10/01/2025",
    descripcion: "Guía completa de medicina deportiva con diagnóstico y tratamiento de lesiones.",
    temas: ["Lesiones musculares", "Tendinopatías", "Fracturas por estrés", "Retorno al deporte", "Biomecánica"],
  },
  {
    id: "killer",
    titulo: "Killer Practical Manual Clínico",
    autor: "Awake4Wellness / Dr. Javier Cuartas",
    categoria: "Protocolo Propio",
    icon: "📘",
    color: "#F59E0B",
    paginas: 145,
    tamanio: "12 MB",
    estado: "procesado",
    chunks: 89,
    fecha_subida: "15/02/2025",
    descripcion: "Manual clínico propio de diagnóstico diferencial con algoritmo de 5 pasos.",
    temas: ["Diagnóstico diferencial", "Red flags", "Pruebas ortopédicas", "Protocolos HILT", "Crioterapia"],
  },
  {
    id: "ot-toolkit",
    titulo: "OT Toolkit — Rehabilitation Guide",
    autor: "Cheryl Hall",
    categoria: "Rehabilitación",
    icon: "📙",
    color: "#2DD4BF",
    paginas: 584,
    tamanio: "35 MB",
    estado: "procesado",
    chunks: 298,
    fecha_subida: "20/02/2025",
    descripcion: "Guía completa de rehabilitación para adultos con condiciones musculoesqueléticas.",
    temas: ["Hombro", "Rodilla", "Columna", "Mano", "Ejercicio terapéutico"],
  },
  {
    id: "anatomia",
    titulo: "Atlas de Anatomía — Prometheus",
    autor: "Schünke, Schulte, Schumacher",
    categoria: "Anatomía",
    icon: "📕",
    color: "#EF4444",
    paginas: 912,
    tamanio: "120 MB",
    estado: "procesado",
    chunks: 445,
    fecha_subida: "01/03/2025",
    descripcion: "Atlas anatómico completo con enfoque en sistema musculoesquelético.",
    temas: ["Músculos", "Tendones", "Ligamentos", "Nervios", "Vascularización"],
  },
  {
    id: "ekg",
    titulo: "EKG — Interpretación Clínica",
    autor: "Dr. Víctor Escalante",
    categoria: "Cardiología Deportiva",
    icon: "📔",
    color: "#A78BFA",
    paginas: 210,
    tamanio: "18 MB",
    estado: "procesado",
    chunks: 134,
    fecha_subida: "05/03/2025",
    descripcion: "Interpretación del electrocardiograma en el contexto del deportista.",
    temas: ["Ritmos cardíacos", "Bloqueos", "Hipertrofia", "Corazón del atleta", "Cribado"],
  },
  {
    id: "termografia",
    titulo: "Termografía Clínica — ThermoHuman",
    autor: "ThermoHuman / CE Class I",
    categoria: "Tecnología Diagnóstica",
    icon: "📒",
    color: "#FF6B6B",
    paginas: 89,
    tamanio: "8 MB",
    estado: "procesado",
    chunks: 67,
    fecha_subida: "10/03/2025",
    descripcion: "Protocolos TISEM y métricas TRI/TSI para termografía clínica.",
    temas: ["Protocolo TISEM", "TRI/TSI", "Asimetría térmica", "Crioterapia", "HILT"],
  },
];

function KnowledgeBasePlugin({ user }) {
  const { C } = useApp();
  const [docs, setDocs] = useState(KNOWLEDGE_BASE_DEMO);
  const [tab, setTab] = useState("biblioteca");
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [uploadForm, setUploadForm] = useState({ titulo: "", autor: "", categoria: "Medicina Deportiva", descripcion: "" });
  const fileRef = useRef(null);

  const categorias = ["Todas", ...new Set(docs.map(d => d.categoria))];
  const [filterCat, setFilterCat] = useState("Todas");
  const filtered = docs.filter(d => filterCat === "Todas" || d.categoria === filterCat);

  async function buscarEnBiblioteca() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const systemPrompt = `Eres el sistema de búsqueda de la base de conocimiento de Awake4Wellness. Respondes ÚNICAMENTE con un array JSON válido, sin markdown ni texto adicional.`;
      const userMsg = `El usuario busca: "${query}"

Libros disponibles:
${docs.map(d => `- ${d.titulo} (${d.autor}): ${d.temas.join(", ")}`).join("\n")}

Devuelve los 3 resultados más relevantes:
[
  { "libro": "título", "pagina": número, "relevancia": "alta/media", "fragmento": "texto de 2-3 oraciones", "contexto": "capítulo o sección" }
]`;
      const text = await CoreServices.askAI([{ role: "user", content: userMsg }], systemPrompt);
      setSearchResults(JSON.parse((text || "[]").replace(/```json|```/g, "").trim()));
    } catch {
      setSearchResults([
        { libro: "Netter's Sports Medicine", pagina: 234, relevancia: "alta", fragmento: `Resultado para: "${query}". Los desgarros musculares se clasifican según extensión...`, contexto: "Capítulo 12 — Lesiones Musculares" },
        { libro: "Killer Practical Manual", pagina: 45, relevancia: "media", fragmento: `En el protocolo AW4W para "${query}", se recomienda iniciar con fase antiinflamatoria...`, contexto: "Sección 3 — Protocolos de Tratamiento" },
      ]);
    } finally { setSearching(false); }
  }

  function handleUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    setTimeout(() => {
      const nuevo = {
        id: Date.now().toString(),
        titulo: uploadForm.titulo || file.name.replace(".pdf", ""),
        autor: uploadForm.autor || "Sin especificar",
        categoria: uploadForm.categoria,
        icon: "📄",
        color: "#818CF8",
        paginas: Math.floor(Math.random() * 400) + 50,
        tamanio: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        estado: "procesando",
        chunks: 0,
        fecha_subida: new Date().toLocaleDateString("es-ES"),
        descripcion: uploadForm.descripcion || "Documento subido recientemente",
        temas: [],
      };
      setDocs(prev => [nuevo, ...prev]);
      setTimeout(() => {
        setDocs(prev => prev.map(d => d.id === nuevo.id ? { ...d, estado: "procesado", chunks: Math.floor(Math.random() * 200) + 50 } : d));
      }, 3000);
      setUploadForm({ titulo: "", autor: "", categoria: "Medicina Deportiva", descripcion: "" });
      setUploading(false);
    }, 1500);
  }

  const totalChunks = docs.reduce((a, d) => a + d.chunks, 0);
  const totalPaginas = docs.reduce((a, d) => a + d.paginas, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>📚 Base de Conocimiento Clínico</h2>
          <p style={{ margin: "5px 0 0", color: C.muted, fontSize: 13 }}>{docs.length} fuentes · {totalPaginas.toLocaleString()} páginas · {totalChunks.toLocaleString()} fragmentos indexados</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: "#EF4444" }}>👑 Solo Admin</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[{ l: "Libros", v: docs.length, c: C.primary, icon: "📚" }, { l: "Páginas totales", v: totalPaginas.toLocaleString(), c: C.success, icon: "📄" }, { l: "Fragmentos IA", v: totalChunks.toLocaleString(), c: C.purple, icon: "🧠" }, { l: "Procesados", v: docs.filter(d => d.estado === "procesado").length, c: C.teal, icon: "✅" }].map(s => (
          <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div><div style={{ fontSize: 10, color: C.muted }}>{s.l}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {[{ id: "biblioteca", l: "📚 Biblioteca" }, { id: "buscar", l: "🔍 Buscar en libros" }, { id: "subir", l: "📤 Agregar fuente" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 18px", border: "none", cursor: "pointer", background: "transparent", fontSize: 13, fontWeight: 700, color: tab === t.id ? C.primary : C.muted, borderBottom: tab === t.id ? `2px solid ${C.primary}` : "2px solid transparent" }}>{t.l}</button>
        ))}
      </div>

      {tab === "biblioteca" && (
        <div>
          {selected ? (
            <div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }}>← Biblioteca</button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
                <div style={{ background: C.surface, border: `1px solid ${selected.color}25`, borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 48 }}>{selected.icon}</div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{selected.titulo}</div>
                      <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{selected.autor}</div>
                      <div style={{ marginTop: 8 }}><span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 20, background: `${selected.color}15`, color: selected.color, fontWeight: 700 }}>{selected.categoria}</span></div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>{selected.descripcion}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                    {[{ l: "Páginas", v: selected.paginas }, { l: "Tamaño", v: selected.tamanio }, { l: "Fragmentos IA", v: selected.chunks }].map(d => (
                      <div key={d.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px", textAlign: "center", border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: selected.color }}>{d.v}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{d.l}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>TEMAS INDEXADOS</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {selected.temas.map(t => <span key={t} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, background: `${selected.color}10`, border: `1px solid ${selected.color}25`, color: selected.color }}>{t}</span>)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: C.successDim, border: `1px solid ${C.success}25`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.success, marginBottom: 8 }}>✅ ESTADO EN LA IA</div>
                    <div style={{ fontSize: 12, color: C.text }}>Este libro está activo y disponible para el Copiloto IA. Las respuestas clínicas lo citan automáticamente cuando es relevante.</div>
                  </div>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>PERMISOS</div>
                    {[{ rol: "👑 Administrador", acceso: "Completo — puede ver fuentes y editar" }, { rol: "👨‍⚕️ Médico", acceso: "Solo recibe respuestas de la IA — no ve el libro" }, { rol: "🧑 Paciente", acceso: "Sin acceso — solo ve resultado final" }].map(p => (
                      <div key={p.rol} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{p.rol}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{p.acceso}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setDocs(prev => prev.filter(d => d.id !== selected.id)) || setSelected(null)} style={{ padding: "10px", borderRadius: 10, background: C.dangerDim, border: `1px solid ${C.danger}25`, color: C.danger, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🗑️ Eliminar de la base</button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {categorias.map(cat => <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${filterCat === cat ? C.primary + "40" : "transparent"}`, cursor: "pointer", fontSize: 11, fontWeight: 700, background: filterCat === cat ? C.primaryDim : "rgba(255,255,255,0.04)", color: filterCat === cat ? C.primary : C.muted }}>{cat}</button>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                {filtered.map(doc => (
                  <div key={doc.id} onClick={() => setSelected(doc)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${doc.color}40`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${C.border}`; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ fontSize: 36 }}>{doc.icon}</div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: doc.estado === "procesado" ? C.successDim : C.warningDim, color: doc.estado === "procesado" ? C.success : C.warning, fontWeight: 700 }}>{doc.estado === "procesado" ? "✓ Activo" : "⏳ Procesando"}</span>
                        <span style={{ fontSize: 9, color: C.dim }}>{doc.chunks} fragmentos</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>{doc.titulo}</div>
                    <div style={{ fontSize: 11, color: doc.color, fontWeight: 600, marginBottom: 6 }}>{doc.categoria}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>{doc.descripcion.slice(0, 80)}...</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.dim }}>
                      <span>{doc.paginas} págs · {doc.tamanio}</span>
                      <span>{doc.fecha_subida}</span>
                    </div>
                  </div>
                ))}
                <div onClick={() => setTab("subir")} style={{ background: "rgba(255,255,255,0.02)", border: `2px dashed ${C.border}`, borderRadius: 16, minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                  <div style={{ fontSize: 32 }}>➕</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Agregar fuente</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "buscar" && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ background: C.warningDim, border: `1px solid ${C.warning}25`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: C.warning }}>
            👑 Esta búsqueda es solo para el Administrador. Los médicos reciben las respuestas sin ver las fuentes.
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && buscarEnBiblioteca()} placeholder="Buscar en todos los libros... Ej: protocolo para desgarro grado II" style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 11, color: C.text, fontSize: 14, padding: "12px 16px", fontFamily: "inherit", outline: "none" }} />
            <button onClick={buscarEnBiblioteca} disabled={searching || !query.trim()} style={{ padding: "12px 20px", borderRadius: 11, background: C.primaryDim, border: `1px solid ${C.primary}35`, color: C.primary, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {searching ? "🔍..." : "Buscar"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 14 }}>RESULTADOS EN LA BIBLIOTECA</div>
              {searchResults.map((r, i) => (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{r.libro}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{r.contexto} · Página {r.pagina}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 20, background: r.relevancia === "alta" ? C.successDim : C.warningDim, color: r.relevancia === "alta" ? C.success : C.warning, fontWeight: 700, height: "fit-content" }}>
                      {r.relevancia === "alta" ? "Alta relevancia" : "Media relevancia"}
                    </span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "12px 14px", fontSize: 13, color: C.text, lineHeight: 1.7, borderLeft: `3px solid ${C.primary}` }}>
                    "{r.fragmento}"
                  </div>
                </div>
              ))}
            </div>
          )}
          {!searchResults.length && !searching && (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div>Escribe una consulta clínica para buscar en la biblioteca</div>
            </div>
          )}
        </div>
      )}

      {tab === "subir" && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 16, padding: 32, textAlign: "center", marginBottom: 24, cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleUpload} style={{ display: "none" }} />
            <div style={{ fontSize: 48, marginBottom: 12 }}>📤</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>Subir PDF o documento</div>
            <div style={{ fontSize: 13, color: C.muted }}>Toca para seleccionar · PDF · DOCX · TXT</div>
            <div style={{ marginTop: 14, fontSize: 11, color: C.dim }}>El sistema procesará automáticamente el contenido para que la IA lo use</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            {[{ l: "Título del libro/documento", k: "titulo", ph: "Ej: Netter's Sports Medicine" }, { l: "Autor", k: "autor", ph: "Ej: Madden, Putukian..." }, { l: "Descripción", k: "descripcion", ph: "Breve descripción del contenido..." }].map(f => (
              <div key={f.k} style={{ gridColumn: f.k === "descripcion" ? "1/-1" : "auto" }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 5 }}>{f.l}</label>
                <input value={uploadForm[f.k]} onChange={e => setUploadForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, padding: "9px 12px", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 8 }}>Categoría</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Medicina Deportiva", "Rehabilitación", "Anatomía", "Cardiología Deportiva", "Tecnología Diagnóstica", "Protocolo Propio", "Artículo Científico"].map(cat => (
                  <button key={cat} onClick={() => setUploadForm(p => ({ ...p, categoria: cat }))} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${uploadForm.categoria === cat ? C.primary + "40" : C.border}`, background: uploadForm.categoria === cat ? C.primaryDim : "transparent", color: uploadForm.categoria === cat ? C.primary : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{cat}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>🔒 CONTROL DE ACCESO</div>
            {[{ rol: "👑 Administrador", desc: "Ve la fuente, puede editar y eliminar" }, { rol: "👨‍⚕️ Médico", desc: "La IA usa este libro — el médico no lo ve directamente" }, { rol: "🧑 Paciente", desc: "Sin acceso — solo ve el resultado final" }].map(p => (
              <div key={p.rol} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text, minWidth: 140 }}>{p.rol}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{p.desc}</span>
              </div>
            ))}
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width: "100%", padding: "14px", borderRadius: 12, background: uploading ? "rgba(255,255,255,0.03)" : C.primaryDim, border: `1px solid ${C.primary}35`, color: C.primary, fontSize: 14, fontWeight: 800, cursor: uploading ? "not-allowed" : "pointer" }}>
            {uploading ? "⏳ Procesando documento..." : "📤 Seleccionar y subir"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── PLUGIN: AI Copilot ─────────────────────────────────────
function CopilotPlugin({ patient, user }) { 
  const { C } = useApp();
  const { hc } = useClinicalRecord(patient);
    const rol = user?.rol || "medico";

  const systemPrompt = `Eres Alex, el copiloto clínico IA de AWAKE4WELLNESS — Dr. Javier Cuartas.
Expertise: termografía (ThermoHuman, TRI/TSI), ecografía musculoesquelética, HILT (1064nm Nd:YAG), crioterapia (-21°C), acupuntura, biorresonancia, rehabilitación progresiva, VALD, InBody, Bodygee, Garmin.

BASE DE CONOCIMIENTO DISPONIBLE:
- Netter's Sports Medicine (Madden, Putukian) — 584 páginas
- Killer Practical Manual Clínico (Dr. Javier Cuartas) — 145 páginas
- OT Toolkit Rehabilitation Guide (Cheryl Hall) — 584 páginas
- Atlas de Anatomía Prometheus — 912 páginas
- EKG Interpretación Clínica (Dr. Víctor Escalante) — 210 páginas
- Termografía Clínica ThermoHuman — 89 páginas

${patient ? `PACIENTE ACTUAL: ${patient.nombre} ${patient.apellido}, ${patient.edad} años, ${patient.condicion_principal}.` : ""}

INSTRUCCIONES SEGÚN ROL:
${rol === "admin" ? `- Eres el ADMINISTRADOR. Puedes citar las fuentes específicas de los libros con página y capítulo.
- Formato: "Según Netter's Sports Medicine (pág. 234)..." o "El Killer Practical Manual indica..."` :
`- El usuario es un MÉDICO. NO menciones los nombres de los libros ni las fuentes.
- Responde con el conocimiento integrado de forma natural y profesional.
- Solo da la respuesta clínica directa sin citar fuentes.`}

${buildContext(hc, patient)}

   ${buildContext(hc, patient)}

   Responde en español clínico profesional y conciso.`;
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    content: rol === "admin"
      ? `Hola Dr. Cuartas 👑. Tengo acceso a **${KNOWLEDGE_BASE_DEMO.length} fuentes clínicas** (${KNOWLEDGE_BASE_DEMO.reduce((a, d) => a + d.paginas, 0).toLocaleString()} páginas indexadas).\n\nPuedo citar las fuentes específicas en mis respuestas. ¿En qué te ayudo?`
      : `Hola, soy Alex, tu **copiloto clínico IA**${patient ? ` para **${patient.nombre} ${patient.apellido}**` : ""}.\n\n¿En qué puedo ayudarte hoy?`
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const endRef = useRef(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, streaming]);

  async function send(text) {
    const msg = text || input.trim(); if (!msg || loading) return;
    setInput("");
    const next = [...msgs, { role: "user", content: msg }];
    setMsgs(next); setLoading(true); setStreaming("");
    try {
      let full = "";
      await CoreServices.askAI(next.map(m => ({ role: m.role, content: m.content })), systemPrompt, chunk => { full = chunk; setStreaming(chunk); });
      setMsgs(p => [...p, { role: "assistant", content: full }]);
      setStreaming("");
    } catch (e) {
      setMsgs(p => [...p, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally { setLoading(false); }
  }

  const quickQuestions = rol === "admin"
    ? ["📖 ¿Qué dice Netter's sobre desgarros?", "📋 Citar protocolo del Killer Practical", "🦴 Anatomía del manguito rotador", "⚡ Evidencia científica del HILT", "📊 Comparar fuentes sobre crioterapia"]
    : ["📊 Evaluar progreso del paciente", "⚡ Dosis HILT para hoy", "❄️ ¿Crioterapia indicada?", "🏃 Criterios retorno al deporte", "📝 Generar nota SOAP", "📋 Protocolo 4 semanas"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", height: "calc(100vh - 56px)", gap: 0, margin: "-28px", overflow: "hidden" }}>
      <div style={{ borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: 16, background: "rgba(255,255,255,0.01)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>PREGUNTAS RÁPIDAS</div>
        {quickQuestions.map((qp, i) => (
          <button key={i} onClick={() => send(qp.replace(/^[^\w📖📋🦴⚡📊❄️🏃📝]+/, ""))} disabled={loading}
            style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, cursor: loading ? "not-allowed" : "pointer", marginBottom: 5 }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = rol === "admin" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)"; e.currentTarget.style.color = rol === "admin" ? C.warning : C.success; } }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}>
            {qp}
          </button>
        ))}

        {rol === "admin" && (
          <div style={{ marginTop: 12, background: C.warningDim, border: `1px solid ${C.warning}25`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.warning, marginBottom: 6 }}>👑 FUENTES ACTIVAS</div>
            {KNOWLEDGE_BASE_DEMO.filter(d => d.estado === "procesado").slice(0, 4).map(d => (
              <div key={d.id} style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{d.icon} {d.titulo.slice(0, 22)}...</div>
            ))}
            <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>+ {KNOWLEDGE_BASE_DEMO.length - 4} más</div>
          </div>
        )}

        <div style={{ marginTop: "auto", background: AI_DEMO ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${AI_DEMO ? "rgba(245,158,11,0.25)" : "rgba(16,185,129,0.25)"}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: AI_DEMO ? C.warning : C.success }}>{AI_DEMO ? "⚠️ Demo Mode" : "✓ IA Activa"}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{AI_DEMO ? "Conecta tu API key" : `${KNOWLEDGE_BASE_DEMO.reduce((a, d) => a + d.chunks, 0).toLocaleString()} fragmentos indexados`}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {msgs.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 16, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: msg.role === "user" ? "rgba(56,189,248,0.12)" : rol === "admin" ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                {msg.role === "user" ? (rol === "admin" ? "👑" : "👨‍⚕️") : "🧠"}
              </div>
              <div style={{ maxWidth: "76%", padding: "11px 15px", borderRadius: 12, background: msg.role === "user" ? "rgba(56,189,248,0.1)" : C.surface, border: `1px solid ${msg.role === "user" ? "rgba(56,189,248,0.2)" : C.border}`, fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            </div>
          ))}
          {streaming && <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start" }}><div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧠</div><div style={{ maxWidth: "76%", padding: "11px 15px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{streaming}<span style={{ display: "inline-block", width: 7, height: 13, background: C.success, borderRadius: 2, marginLeft: 3, animation: "blink 0.7s infinite" }} /></div></div>}
          {loading && !streaming && <div style={{ display: "flex", gap: 10, marginBottom: 16 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧠</div><div style={{ padding: "11px 15px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: 5 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, animation: `bounce 1.2s ease ${i * 0.2}s infinite` }} />)}</div></div>}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 10 }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={rol === "admin" ? "Pregunta con cita de fuentes... (Enter para enviar)" : "Pregunta clínica... (Enter para enviar)"} rows={2} style={{ flex: 1, background: C.surface, border: `1px solid ${loading ? C.border : rol === "admin" ? "rgba(245,158,11,0.35)" : "rgba(16,185,129,0.35)"}`, borderRadius: 10, color: C.text, fontSize: 13, padding: "10px 14px", resize: "none", fontFamily: "inherit" }} />
            <Btn onClick={() => send()} disabled={loading || !input.trim()} color={rol === "admin" ? C.warning : C.success} style={{ height: "100%", padding: "0 18px" }}>{loading ? "⏳" : "↑"}</Btn>
          </div>
        </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </div>
  );


// ── PLUGIN: Device Integrations Hub ───────────────────────
}

   

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
  const sel = Object.entries(data.lesiones||{}).filter(([,v])=>v).map(([k])=>{
    for(const cat of Object.values(LESIONES_KP)){const l=cat.find(x=>x.id===k);if(l)return l;}return null;
  }).filter(Boolean);
  if(sel.length){r.capas.estructural=sel.map(l=>l.label);r.protocolos.hilt=true;r.protocolos.crioterapia=true;r.protocolos.rehabilitacion=true;}
  if(data.lesiones?.dsg3||data.lesiones?.esq3){r.urgente=true;r.redFlags.push("Lesión Grado III — evaluar indicación quirúrgica");}
  const cad=Object.entries(data.cadenas||{}).filter(([,v])=>v>0).map(([k])=>k);
  if(cad.length){r.capas.funcional=cad.map(k=>({posterior:"Cadena posterior",anterior:"Cadena anterior",lat_d:"Lateral derecha",lat_i:"Lateral izquierda",espiral:"Cadena espiral"}[k]||k));r.protocolos.rehabilitacion=true;r.protocolos.acupuntura=true;}
  if(data.sueno?.psqi>=5){r.capas.sistemica.push("Sueño alterado (PSQI ≥5)");r.protocolos.sueno=true;r.alertas.push("😴 Sueño alterado — impacta dolor e inflamación");}
  if(data.endocrino?.vitD_bajo){r.capas.sistemica.push("Deficiencia Vitamina D");r.protocolos.nutricion=true;}
  if(data.endocrino?.pcr_alta){r.capas.sistemica.push("Inflamación sistémica (PCR elevada)");r.protocolos.crioterapia=true;}
  if(data.nutricion?.deficiencias?.length>0){r.capas.sistemica.push(`Déficit: ${data.nutricion.deficiencias.join(", ")}`);r.protocolos.nutricion=true;}
  if(data.vertigo?.dix_hallpike==="positivo_d"||data.vertigo?.dix_hallpike==="positivo_i"){r.capas.neurologica.push("VPPB (Dix-Hallpike +)");r.protocolos.vestibular=true;r.alertas.push("🌀 VPPB — iniciar maniobra de Epley");}
  if(data.vertigo?.red_flags){r.urgente=true;r.redFlags.push("🚨 Red flags neurológicas vestibulares");}
  if(data.lesiones?.ciat||data.lesiones?.radl||data.lesiones?.radc){r.capas.neurologica.push("Compresión radicular");r.protocolos.biowave=true;r.protocolos.acupuntura=true;}
  if(data.lesiones?.fibr){r.capas.neurologica.push("Fibromialgia — dolor central sensibilizado");r.protocolos.biowave=true;r.protocolos.bemer=true;}
  if(data.neuro?.dolor_persistente){r.capas.neurologica.push("Dolor persistente / sensibilización");r.protocolos.biowave=true;}
  if(data.termografia?.tsi==="hipertermico"){r.protocolos.crioterapia=true;r.alertas.push(`🌡️ TSI Hipertérmico — crioterapia indicada post-HILT`);}
  if(data.termografia?.asimetria>=1.5){r.alertas.push(`🌡️ Asimetría crítica Δ${data.termografia.asimetria}°C — confirmar con ecografía`);r.protocolos.hilt=true;}
  if(data.eva>=8){r.urgente=true;r.alertas.push("⚠️ EVA ≥8 — dolor severo, priorizar analgesia");}
  if(data.neuro?.fiebre) r.redFlags.push("🚨 Fiebre — descartar infección");
  if(data.neuro?.esfinteres) r.redFlags.push("🚨 Alteración esfínteres — Síndrome cauda equina URGENTE");
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
          {MODS.map((m,i)=><button key={m.id} onClick={()=>setStep(i)} style={{padding:"5px 10px",borderRadius:20,cursor:"pointer",fontSize:10,fontWeight:700,background:step===i?`${m.color}20`:i<step||step===MODS.length?"rgba(255,255,255,0.05)":"transparent",color:step===i?m.color:C.dim,border:`1px solid ${step===i?`${m.color}35`:"transparent"}`}}>{i<step||step===MODS.length?"✓ ":""}{m.label}</button>)}
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
    {name:"Professional",price:299,color:C.primary,features:["25 pacientes activos","Copiloto IA","Cámara FLIR integrada","Motor Central Dx","Telemedicina","Analytics avanzados"],popular:true},
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

// ═══════════════════════════════════════════════════════════════
// 💊 PRESCRIPCIÓN DIGITAL DE PROTOCOLOS
// ═══════════════════════════════════════════════════════════════

const PROTOCOLOS_TEMPLATE = [
  {
    id: "hilt_tend",
    nombre: "HILT — Tendinopatía",
    categoria: "Láser",
    color: "#F59E0B",
    icon: "⚡",
    descripcion: "Protocolo estándar para tendinopatías crónicas y agudas",
    sesiones: 8,
    frecuencia: "3x semana",
    duracion: "15 min",
    parametros: [
      { label: "Longitud de onda", valor: "1064 nm (Nd:YAG)" },
      { label: "Potencia pico", valor: "2000 W" },
      { label: "Energía por sesión", valor: "1000-1500 J/cm²" },
      { label: "Modo", valor: "Scanning + Contact" },
    ],
    indicaciones: "Tendinopatía rotuliana, Aquiles, manguito rotador, epicondilitis",
    contraindicaciones: "Embarazo, marcapasos, neoplasia activa",
    instrucciones_paciente: [
      "Llega 10 min antes de cada sesión",
      "Evita cremas o aceites en la zona a tratar",
      "Usa ropa cómoda que permita acceso a la zona",
      "Reporta cualquier ardor o molestia durante el tratamiento",
    ],
  },
  {
    id: "crio_agudo",
    nombre: "Crioterapia — Lesión Aguda",
    categoria: "Crioterapia",
    color: "#38BDF8",
    icon: "❄️",
    descripcion: "Protocolo de crioterapia localizada para lesiones agudas",
    sesiones: 6,
    frecuencia: "Diario",
    duracion: "3-5 min",
    parametros: [
      { label: "Temperatura", valor: "-21°C" },
      { label: "Distancia", valor: "15-20 cm" },
      { label: "Duración", valor: "3-5 min por zona" },
      { label: "Timing", valor: "Post-HILT o independiente" },
    ],
    indicaciones: "Desgarro agudo, esguince Grado I-II, bursitis aguda",
    contraindicaciones: "TSI hipotérmico, Raynaud, crioglobulinemia",
    instrucciones_paciente: [
      "No apliques calor en las primeras 48h de la lesión",
      "Puedes aplicar hielo en casa: 15 min, 3 veces al día",
      "Protege la piel con una tela delgada antes del hielo",
      "Si sientes entumecimiento intenso, suspende y avisa",
    ],
  },
  {
    id: "rehab_hombro",
    nombre: "Rehabilitación — Hombro",
    categoria: "Rehabilitación",
    color: "#FB923C",
    icon: "💪",
    descripcion: "Protocolo progresivo de 3 fases para patología de hombro",
    sesiones: 16,
    frecuencia: "3x semana",
    duracion: "45 min",
    parametros: [
      { label: "Fase 1 (sem 1-2)", valor: "Analgesia + movilidad pasiva" },
      { label: "Fase 2 (sem 3-6)", valor: "Fortalecimiento progresivo" },
      { label: "Fase 3 (sem 7-8)", valor: "Funcional + retorno deportivo" },
      { label: "Evaluación", valor: "EVA + goniometría semanal" },
    ],
    indicaciones: "Capsulitis adhesiva, tendinosis manguito, post-cirugía",
    contraindicaciones: "Fractura no consolidada, infección activa",
    instrucciones_paciente: [
      "Realiza los ejercicios en casa 2 veces al día",
      "No fuerces el rango más allá del dolor",
      "Usa cabestrillo solo si lo indica el médico",
      "Reporta si el dolor sube más de 2 puntos EVA",
    ],
  },
  {
    id: "biowave_dolor",
    nombre: "BioWave — Dolor Crónico",
    categoria: "Neuromodulación",
    color: "#A78BFA",
    icon: "🔌",
    descripcion: "Neuromodulación para dolor crónico y fibromialgia",
    sesiones: 10,
    frecuencia: "2-3x semana",
    duracion: "20 min",
    parametros: [
      { label: "Frecuencia", valor: "3800 Hz + 1900 Hz" },
      { label: "Intensidad", valor: "Según tolerancia" },
      { label: "Modo", valor: "Dual channel" },
      { label: "Objetivo", valor: "Bloqueo nervioso periférico" },
    ],
    indicaciones: "Fibromialgia, dolor neuropático, dolor persistente",
    contraindicaciones: "Marcapasos, epilepsia, embarazo",
    instrucciones_paciente: [
      "Infórmanos si sientes calor en los electrodos",
      "Los efectos se acumulan — es normal no sentir mejoría inmediata",
      "Mantén un diario de dolor EVA diario",
      "Evita actividad intensa 2h después de la sesión",
    ],
  },
  {
    id: "protocolo_rodilla",
    nombre: "Protocolo Integral — Rodilla",
    categoria: "Combinado",
    color: "#2DD4BF",
    icon: "🦴",
    descripcion: "HILT + Crioterapia + Rehabilitación para patología de rodilla",
    sesiones: 12,
    frecuencia: "3x semana",
    duracion: "60 min",
    parametros: [
      { label: "HILT", valor: "800-1200 J/cm² · contact" },
      { label: "Crioterapia", valor: "-21°C · 3 min post-HILT" },
      { label: "Rehab", valor: "Cuádriceps + propiocepción" },
      { label: "Evaluación", valor: "Termografía + EVA semanal" },
    ],
    indicaciones: "Artrosis grado I-II, tendinopatía rotuliana, post-artroscopia",
    contraindicaciones: "Artrosis grado IV, prótesis total",
    instrucciones_paciente: [
      "Evita impacto y escaleras la primera semana",
      "Aplica hielo 15 min en casa post-sesión",
      "Ejercicios de cuádriceps en piscina si es posible",
      "Usa rodillera solo si lo indica el médico",
    ],
  },
  {
    id: "personalizado",
    nombre: "Protocolo Personalizado",
    categoria: "Personalizado",
    color: "#10B981",
    icon: "✏️",
    descripcion: "Crea un protocolo completamente personalizado para este paciente",
    sesiones: 0,
    frecuencia: "",
    duracion: "",
    parametros: [],
    indicaciones: "",
    contraindicaciones: "",
    instrucciones_paciente: [],
  },
];

function PrescriptionsPlugin({ patient, C: Cprop }) {
  const { C: Cctx } = useApp();
  const C = Cprop || Cctx;
  const [step, setStep] = useState("list");
  const [selected, setSelected] = useState(null);
  const [customConfig, setCustomConfig] = useState({});
  const [generating, setGenerating] = useState(false);
  const [prescripciones, setPrescripciones] = useState([]);
  const [filterCat, setFilterCat] = useState("Todos");

  const categorias = ["Todos", ...new Set(PROTOCOLOS_TEMPLATE.map(p => p.categoria))];
  const filtered = PROTOCOLOS_TEMPLATE.filter(p => filterCat === "Todos" || p.categoria === filterCat);

  async function generarConIA() {
    setGenerating(true);
    try {
      const systemPrompt = `Eres Alex, asistente clínico de Awake4Wellness (Dr. Javier Cuartas). Generas instrucciones personalizadas para el paciente en español. Respondes ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.`;
      const userMsg = `PACIENTE: ${patient?.nombre || "Paciente"} ${patient?.apellido || ""}, ${patient?.edad || "?"} años
CONDICIÓN: ${patient?.condicion_principal || "No especificada"}
PROTOCOLO: ${selected?.nombre}

Devuelve este JSON:
{
  "saludo": "bienvenida personalizada",
  "objetivo": "objetivo específico",
  "instrucciones_especiales": ["instrucción 1", "instrucción 2", "instrucción 3"],
  "señales_alarma": ["señal 1", "señal 2"],
  "mensaje_motivacional": "mensaje en 2 oraciones",
  "pronostico": "pronóstico realista en 1-2 oraciones"
}`;
      const text = await CoreServices.askAI([{ role: "user", content: userMsg }], systemPrompt);
      setCustomConfig(JSON.parse((text || "{}").replace(/```json|```/g, "").trim()));
      setStep("preview");
    } catch {
      setCustomConfig({
        saludo: `Bienvenido/a ${patient?.nombre || "paciente"} a tu protocolo personalizado.`,
        objetivo: `Recuperación completa y retorno a ${patient?.deporte || "tu actividad"} sin dolor.`,
        instrucciones_especiales: selected?.instrucciones_paciente || [],
        señales_alarma: ["Dolor que aumenta más de 3 puntos EVA", "Hinchazón que no mejora"],
        mensaje_motivacional: "Con constancia lograrás una recuperación exitosa.",
        pronostico: "Con el protocolo adecuado se espera mejoría en 4-6 semanas.",
      });
      setStep("preview");
    } finally { setGenerating(false); }
  }

  function enviarPrescripcion() {
    setPrescripciones(prev => [{ id: Date.now(), paciente: `${patient?.nombre || ""} ${patient?.apellido || ""}`, protocolo: selected?.nombre, fecha: new Date().toLocaleDateString("es-ES"), config: customConfig, template: selected }, ...prev]);
    setStep("sent");
  }

  if (step === "sent") return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: C.success, marginBottom: 8 }}>¡Prescripción enviada!</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>El protocolo <strong style={{ color: C.text }}>{selected?.nombre}</strong> ha sido prescrito a {patient?.nombre}.</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={() => { setStep("list"); setSelected(null); setCustomConfig({}); }} style={{ padding: "11px 24px", borderRadius: 11, background: C.primaryDim, border: `1px solid ${C.primary}35`, color: C.primary, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Nueva prescripción</button>
      </div>
    </div>
  );

  if (step === "preview") return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <button onClick={() => setStep("config")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }}>← Atrás</button>
      <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${selected?.color}30`, borderRadius: 20, overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(135deg,${selected?.color}20,${selected?.color}08)`, borderBottom: `1px solid ${selected?.color}20`, padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 3, color: C.muted, marginBottom: 6 }}>PRESCRIPCIÓN DIGITAL — AWAKE4WELLNESS</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{selected?.nombre}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Para: {patient?.nombre} {patient?.apellido}</div>
            </div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 32 }}>{selected?.icon}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{new Date().toLocaleDateString("es-ES")}</div></div>
          </div>
          {customConfig.saludo && <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 10, fontSize: 13, color: C.text, fontStyle: "italic" }}>"{customConfig.saludo}"</div>}
        </div>
        <div style={{ padding: "24px 28px" }}>
          {customConfig.objetivo && <div style={{ marginBottom: 20 }}><div style={{ fontSize: 11, fontWeight: 700, color: selected?.color, marginBottom: 6 }}>🎯 TU OBJETIVO</div><div style={{ fontSize: 13, color: C.text }}>{customConfig.objetivo}</div></div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
            {[{ l: "Sesiones", v: selected?.sesiones, icon: "📅" }, { l: "Frecuencia", v: selected?.frecuencia, icon: "🔄" }, { l: "Duración", v: selected?.duracion, icon: "⏱️" }, { l: "Categoría", v: selected?.categoria, icon: "🏷️" }].map(d => (
              <div key={d.l} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{d.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: selected?.color }}>{d.v}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{d.l}</div>
              </div>
            ))}
          </div>
          {selected?.parametros?.length > 0 && <div style={{ marginBottom: 20 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>⚙️ PARÁMETROS TÉCNICOS</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{selected.parametros.map((p, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: `1px solid ${C.border}` }}><span style={{ fontSize: 12, color: C.muted }}>{p.label}</span><span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.valor}</span></div>)}</div></div>}
          <div style={{ marginBottom: 20 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 10 }}>📋 TUS INSTRUCCIONES</div>{(customConfig.instrucciones_especiales?.length ? customConfig.instrucciones_especiales : selected?.instrucciones_paciente || []).map((inst, i) => (<div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 6, border: `1px solid ${C.border}` }}><span style={{ color: selected?.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span><span style={{ fontSize: 13, color: C.text }}>{inst}</span></div>))}</div>
          {customConfig.señales_alarma?.length > 0 && <div style={{ marginBottom: 20, background: C.dangerDim, border: `1px solid ${C.danger}25`, borderRadius: 12, padding: "14px 16px" }}><div style={{ fontSize: 11, fontWeight: 700, color: C.danger, marginBottom: 8 }}>⚠️ CONSULTA URGENTE SI PRESENTAS</div>{customConfig.señales_alarma.map((s, i) => <div key={i} style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>• {s}</div>)}</div>}
          {customConfig.pronostico && <div style={{ marginBottom: 20, background: C.successDim, border: `1px solid ${C.success}25`, borderRadius: 12, padding: "14px 16px" }}><div style={{ fontSize: 11, fontWeight: 700, color: C.success, marginBottom: 6 }}>✨ TU PRONÓSTICO</div><div style={{ fontSize: 13, color: C.text }}>{customConfig.pronostico}</div></div>}
          {customConfig.mensaje_motivacional && <div style={{ background: `${selected?.color}08`, border: `1px solid ${selected?.color}20`, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "center" }}><div style={{ fontSize: 14, color: C.text, fontStyle: "italic", lineHeight: 1.7 }}>"{customConfig.mensaje_motivacional}"</div><div style={{ fontSize: 12, color: selected?.color, fontWeight: 700, marginTop: 8 }}>— Dr. Javier Cuartas · Awake4Wellness</div></div>}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>awake4wellness.com · {new Date().toLocaleDateString("es-ES")}</div>
            <button onClick={enviarPrescripcion} style={{ padding: "12px 28px", borderRadius: 11, background: `${selected?.color}15`, border: `1px solid ${selected?.color}40`, color: selected?.color, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>📤 Enviar al paciente</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (step === "config") return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <button onClick={() => setStep("list")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }}>← Atrás</button>
      <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${selected?.color}30`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: `${selected?.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{selected?.icon}</div>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{selected?.nombre}</div><div style={{ fontSize: 12, color: C.muted }}>{selected?.descripcion}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[{ l: "Número de sesiones", k: "sesiones_total", ph: selected?.sesiones?.toString() }, { l: "Frecuencia", k: "frecuencia_custom", ph: selected?.frecuencia }, { l: "Duración por sesión", k: "duracion_custom", ph: selected?.duracion }, { l: "Médico responsable", k: "medico", ph: "Dr. Javier Cuartas" }].map(f => (
            <div key={f.k}><label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 5 }}>{f.l}</label><input value={customConfig[f.k] || ""} onChange={e => setCustomConfig(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, padding: "9px 12px", fontFamily: "inherit", boxSizing: "border-box" }} /></div>
          ))}
        </div>
        <div><label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 5 }}>Observaciones adicionales</label><textarea value={customConfig.observaciones || ""} onChange={e => setCustomConfig(p => ({ ...p, observaciones: e.target.value }))} placeholder="Indicaciones especiales para este paciente..." rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, padding: "9px 12px", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} /></div>
      </div>
      <button onClick={generarConIA} disabled={generating} style={{ width: "100%", padding: "14px", borderRadius: 12, background: generating ? "rgba(255,255,255,0.03)" : `${selected?.color}15`, border: `1px solid ${selected?.color}35`, color: selected?.color, fontSize: 14, fontWeight: 800, cursor: generating ? "not-allowed" : "pointer" }}>
        {generating ? "🧠 Generando prescripción con IA..." : "✨ Generar prescripción personalizada con IA →"}
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>💊 Prescripción Digital</h2>
          <p style={{ margin: "5px 0 0", color: C.muted, fontSize: 13 }}>{patient ? `Para: ${patient.nombre} ${patient.apellido}` : "Selecciona el protocolo a prescribir"}</p>
        </div>
        {prescripciones.length > 0 && <div style={{ background: C.primaryDim, border: `1px solid ${C.primary}30`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: C.primary }}>{prescripciones.length} enviadas</div>}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {categorias.map(cat => <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filterCat === cat ? C.teal + "40" : "transparent"}`, cursor: "pointer", fontSize: 12, fontWeight: 700, background: filterCat === cat ? C.tealDim : "rgba(255,255,255,0.04)", color: filterCat === cat ? C.teal : C.muted }}>{cat}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginBottom: 32 }}>
        {filtered.map(proto => (
          <div key={proto.id} onClick={() => { setSelected(proto); setStep("config"); }}
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${proto.color}40`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${C.border}`; e.currentTarget.style.transform = "none"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${proto.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{proto.icon}</div>
              <div style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: `${proto.color}15`, color: proto.color, fontWeight: 700 }}>{proto.categoria}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 5 }}>{proto.nombre}</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>{proto.descripcion}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {proto.sesiones > 0 && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.muted }}>📅 {proto.sesiones} ses.</span>}
              {proto.frecuencia && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.muted }}>🔄 {proto.frecuencia}</span>}
              {proto.duracion && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: C.muted }}>⏱️ {proto.duracion}</span>}
            </div>
          </div>
        ))}
      </div>
      {prescripciones.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 14 }}>PRESCRIPCIONES ENVIADAS</div>
          {prescripciones.map(p => (
            <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.protocolo}</div><div style={{ fontSize: 11, color: C.muted }}>Para {p.paciente} · {p.fecha}</div></div>
              <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: C.successDim, color: C.success, fontWeight: 700 }}>✓ Enviada</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ── PLUGIN: WEARABLES (Garmin / Polar / Fitbit) ────────────────
// ═══════════════════════════════════════════════════════════════
const DEMO_WEARABLE_DATA = {
  conectado: true,
  dispositivo: "Garmin Forerunner 965",
  ultima_sync: "Hace 12 min",
  hoy: { pasos: 8432, fc_reposo: 54, fc_max: 162, calorias: 2380, sueno_horas: 7.2, sueno_score: 82, estres: 34, body_battery: 68, spo2: 97, vo2max: 48 },
  semana_fc: [58, 56, 55, 54, 57, 55, 54],
  semana_sueno: [6.5, 7.1, 6.8, 7.5, 7.2, 8.0, 7.2],
  semana_estres: [42, 38, 45, 30, 34, 28, 34],
  semana_pasos: [7200, 9100, 6500, 10200, 8432, 11500, 8432],
};

function WearablesPlugin({ patient }) {
  const { C } = useApp();
  const [tab, setTab] = useState("resumen");
  const d = DEMO_WEARABLE_DATA;

  const miniChart = (data, color, max, unit = "") => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
      {data.map((v, i) => {
        const h = Math.max(8, (v / max) * 60);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 9, color, fontWeight: 700 }}>{v}{unit}</div>
            <div style={{ width: "100%", height: h, background: color, borderRadius: "4px 4px 0 0", opacity: 0.75 }} />
            <div style={{ fontSize: 8, color: C.dim }}>{["L", "M", "M", "J", "V", "S", "D"][i]}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>⌚ Wearables</h2>
          <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{patient ? `${patient.nombre} ${patient.apellido}` : ""} · {d.dispositivo}</p>
        </div>
        <div style={{ background: C.successDim, border: `1px solid ${C.success}30`, borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: C.success, display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.success }} />
          Sincronizado · {d.ultima_sync}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {[{ id: "resumen", l: "📊 Resumen" }, { id: "cardiaco", l: "❤️ Cardíaco" }, { id: "sueno", l: "😴 Sueño" }, { id: "actividad", l: "🏃 Actividad" }, { id: "tendencia", l: "📈 Tendencias" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 16px", border: "none", cursor: "pointer", background: "transparent", fontSize: 13, fontWeight: 700, color: tab === t.id ? C.success : C.muted, borderBottom: tab === t.id ? `2px solid ${C.success}` : "2px solid transparent" }}>{t.l}</button>
        ))}
      </div>

      {tab === "resumen" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14 }}>
          {[
            { l: "Pasos hoy", v: d.hoy.pasos.toLocaleString(), icon: "👟", c: C.primary, sub: "Meta: 10,000" },
            { l: "FC reposo", v: `${d.hoy.fc_reposo} bpm`, icon: "❤️", c: C.danger, sub: "Excelente" },
            { l: "Body Battery", v: `${d.hoy.body_battery}%`, icon: "🔋", c: C.success, sub: "Energía disponible" },
            { l: "Estrés", v: d.hoy.estres, icon: "🧘", c: d.hoy.estres < 40 ? C.success : C.warning, sub: d.hoy.estres < 40 ? "Bajo" : "Moderado" },
            { l: "Sueño", v: `${d.hoy.sueno_horas}h`, icon: "😴", c: C.purple, sub: `Score ${d.hoy.sueno_score}` },
            { l: "SpO2", v: `${d.hoy.spo2}%`, icon: "🫁", c: C.teal, sub: "Normal" },
            { l: "VO2 Max", v: d.hoy.vo2max, icon: "💨", c: C.orange, sub: "Superior" },
            { l: "Calorías", v: d.hoy.calorias.toLocaleString(), icon: "🔥", c: C.warning, sub: "Activas + basal" },
          ].map(k => (
            <Card key={k.l} color={k.c}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{k.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.c }}>{k.v}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginTop: 2 }}>{k.l}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{k.sub}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === "cardiaco" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 16 }}>FRECUENCIA CARDÍACA EN REPOSO (7 días)</div>
            {miniChart(d.semana_fc, C.danger, 70, "")}
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {[{ l: "FC Reposo", v: `${d.hoy.fc_reposo} bpm`, c: C.success }, { l: "FC Máxima hoy", v: `${d.hoy.fc_max} bpm`, c: C.danger }, { l: "Variabilidad (HRV)", v: "62 ms", c: C.primary }].map(m => (
              <Card key={m.l} style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: m.c }}>{m.v}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{m.l}</div></Card>
            ))}
          </div>
        </div>
      )}

      {tab === "sueno" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 16 }}>HORAS DE SUEÑO (7 días)</div>
            {miniChart(d.semana_sueno, C.purple, 10, "h")}
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {[{ l: "Profundo", v: "1.8h", c: C.primary }, { l: "Ligero", v: "4.1h", c: C.teal }, { l: "REM", v: "1.3h", c: C.purple }, { l: "Score", v: d.hoy.sueno_score, c: C.success }].map(m => (
              <Card key={m.l} style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: m.c }}>{m.v}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{m.l}</div></Card>
            ))}
          </div>
          <Card style={{ marginTop: 16, background: "rgba(167,139,250,0.04)" }}>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>💡 <strong style={{ color: C.text }}>Correlación clínica:</strong> El sueño promedio de {(d.semana_sueno.reduce((a, b) => a + b, 0) / 7).toFixed(1)}h con score {d.hoy.sueno_score} es adecuado para la recuperación. Un buen sueño favorece la reducción del dolor y la respuesta antiinflamatoria al tratamiento.</div>
          </Card>
        </div>
      )}

      {tab === "actividad" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 16 }}>PASOS DIARIOS (7 días)</div>
            {miniChart(d.semana_pasos, C.primary, 12000, "")}
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {[{ l: "Promedio diario", v: Math.round(d.semana_pasos.reduce((a, b) => a + b, 0) / 7).toLocaleString(), c: C.primary }, { l: "Mejor día", v: Math.max(...d.semana_pasos).toLocaleString(), c: C.success }, { l: "VO2 Max", v: d.hoy.vo2max, c: C.orange }].map(m => (
              <Card key={m.l} style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: m.c }}>{m.v}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{m.l}</div></Card>
            ))}
          </div>
        </div>
      )}

      {tab === "tendencia" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 16 }}>NIVEL DE ESTRÉS (7 días)</div>
            {miniChart(d.semana_estres, C.warning, 60, "")}
          </Card>
          <Card style={{ background: "rgba(16,185,129,0.04)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.success, letterSpacing: 2, marginBottom: 10 }}>📊 RESUMEN PARA EL MÉDICO</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
              El paciente mantiene una FC en reposo baja ({d.hoy.fc_reposo} bpm), indicativo de buena condición cardiovascular. El estrés promedio es {Math.round(d.semana_estres.reduce((a, b) => a + b, 0) / 7)} (bajo-moderado) y el sueño es adecuado. Estos marcadores favorecen la recuperación y la respuesta al tratamiento.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REGISTRO DE PLUGINS — agrega/quita módulos aquí
// ═══════════════════════════════════════════════════════════════
const pluginRegistry = [
  { id: "dashboard", name: "Dashboard", icon: "📊", color: DS.colors.primary, group: "clinical", description: "Vista general clínica", component: DashboardPlugin },
  { id: "patients", name: "Pacientes", icon: "👥", color: DS.colors.teal, group: "clinical", description: "Gestión de pacientes", component: PatientsPlugin },
  { id: "flir", name: "Termografía FLIR", icon: "🌡️", color: DS.colors.thermo, group: "devices", badge: "SDK", description: "Cámara térmica y galería", component: FLIRPlugin, patientAction: true, patientActionLabel: "Termografía", onPatientAction: (p, nav) => nav("flir", p) },
  { id: "copilot", name: "Copiloto IA", icon: "🧠", color: DS.colors.success, group: "ai", badge: "IA", description: "Asistente clínico Alex", component: CopilotPlugin, patientAction: true, patientActionLabel: "Copiloto", onPatientAction: (p, nav) => nav("copilot", p) },
  { id: "devices", name: "Dispositivos", icon: "🔌", color: DS.colors.primary, group: "devices", description: "Hub de integraciones", component: DevicesPlugin },
  { id: "inbody", name: "InBody", icon: "⚖️", color: DS.colors.primary, group: "devices", description: "Composición corporal", component: () => <PlaceholderPlugin name="InBody" icon="⚖️" description="Integración de composición corporal (LookinBody WebAPI + CSV)." coming />, patientAction: true, patientActionLabel: "InBody", onPatientAction: (p, nav) => nav("inbody", p) },
  { id: "vald", name: "VALD", icon: "💪", color: DS.colors.warning, group: "devices", description: "Fuerza y rendimiento", component: () => <PlaceholderPlugin name="VALD Performance" icon="💪" description="Integración de fuerza y rendimiento vía REST API (OAuth2)." coming />, patientAction: true, patientActionLabel: "VALD", onPatientAction: (p, nav) => nav("vald", p) },
  { id: "bodygee", name: "Bodygee", icon: "🔵", color: DS.colors.purple, group: "devices", description: "Escaneo 3D corporal", component: () => <PlaceholderPlugin name="Bodygee" icon="🔵" description="Escaneo 3D corporal vía REST API + Webhooks." coming /> },
  { id: "garmin", name: "Wearables", icon: "⌚", color: DS.colors.success, group: "devices", description: "Garmin / Polar / Fitbit", component: WearablesPlugin },
  { id: "motor", name: "Motor Central", icon: "🧠", color: DS.colors.purple, group: "clinical", badge: "Core", description: "Diagnóstico 9→4 capas", component: MotorCentralPlugin, patientAction: true, patientActionLabel: "Motor Dx", onPatientAction: (p, nav) => nav("motor", p) },
  { id: "analytics", name: "Analytics", icon: "📈", color: DS.colors.purple, group: "business", description: "Métricas y reportes", component: AnalyticsPlugin },
  { id: "telemedicine", name: "Telemedicina", icon: "📱", color: DS.colors.teal, group: "clinical", description: "Video, chat y archivos", component: TelemedicinePlugin, patientAction: true, patientActionLabel: "Telemedicina", onPatientAction: (p, nav) => nav("telemedicine", p) },
  { id: "payments", name: "Planes y Pagos", icon: "💳", color: DS.colors.success, group: "business", description: "Membresías y facturación", component: PaymentsPlugin },
  { id: "prescriptions", name: "Prescripciones", icon: "💊", color: DS.colors.teal, group: "clinical", description: "Protocolos digitales", component: PrescriptionsPlugin, patientAction: true, patientActionLabel: "Prescribir", onPatientAction: (p, nav) => nav("prescriptions", p) },
  { id: "knowledge", name: "Base de Conocimiento", icon: "📚", color: DS.colors.warning, group: "education", badge: "Admin", description: "Biblioteca clínica IA", component: KnowledgeBasePlugin },
  { id: "education", name: "Educación", icon: "🎓", color: DS.colors.purple, group: "education", description: "Cursos y formación", component: () => <PlaceholderPlugin name="Educación" icon="🎓" description="Módulo de cursos y formación clínica." coming /> },
];

// ═══════════════════════════════════════════════════════════════
// PORTAL DEL PACIENTE (rol "paciente")
// ═══════════════════════════════════════════════════════════════
function PatientPortal({ user, onSignOut }) {
  const C = DS.colors;
  const yo = DEMO_PATIENTS[0];
  const misSesiones = DEMO_SESSIONS.filter(s => s.paciente_id === yo.id);
  const mej = misSesiones.filter(s => s.eva_pre && s.eva_post).length
    ? Math.round(misSesiones.filter(s => s.eva_pre && s.eva_post).reduce((a, s) => a + ((s.eva_pre - s.eva_post) / s.eva_pre * 100), 0) / misSesiones.filter(s => s.eva_pre && s.eva_post).length)
    : 0;
  const [tele, setTele] = useState(false);

  return (
    <AppCtx.Provider value={{ C, user }}>
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: DS.font, color: C.text }}>
        <div style={{ borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: dim(C.teal), border: `1px solid ${C.teal}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
            <div><div style={{ fontSize: 15, fontWeight: 800 }}>Awake4Wellness</div><div style={{ fontSize: 11, color: C.muted }}>Portal del Paciente</div></div>
          </div>
          <button onClick={onSignOut} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cerrar sesión</button>
        </div>

        <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <Avatar name={`${yo.nombre} ${yo.apellido}`} size={56} color={C.teal} />
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Hola, {yo.nombre} 👋</h2>
              <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 13 }}>{yo.a}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
            <StatCard label="Sesiones" value={misSesiones.length} color={C.primary} icon="📅" sub="completadas" />
            <StatCard label="Mejoría" value={`${mej}%`} color={C.success} icon="📈" sub="reducción dolor" />
            <StatCard label="Próxima cita" value="2 días" color={C.teal} icon="⏰" sub="HILT 15:00" />
          </div>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 14 }}>MI PROTOCOLO ACTUAL</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: dim(C.warning), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚡</div>
              <div><div style={{ fontSize: 14, fontWeight: 800 }}>HILT — Tendinopatía rotuliana</div><div style={{ fontSize: 12, color: C.muted }}>Sesión 7 de 8 · 3x semana</div></div>
            </div>
            <ProgressBar value={(7 / 8) * 100} color={C.warning} />
            <div style={{ marginTop: 12, fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
              Llega 10 min antes de cada sesión. Evita cremas en la zona a tratar. Aplica hielo 15 min en casa post-sesión.
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, marginBottom: 14 }}>MI EVOLUCIÓN</div>
            {misSesiones.map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div><div style={{ fontSize: 13, fontWeight: 700 }}>Sesión {s.numero_sesion} · {s.protocolo}</div><div style={{ fontSize: 11, color: C.muted }}>{new Date(s.fecha).toLocaleDateString("es-ES")}</div></div>
                <Badge color={s.eva_post < s.eva_pre ? C.success : C.warning}>EVA {s.eva_pre}→{s.eva_post}</Badge>
              </div>
            ))}
          </Card>

          <Btn color={C.teal} fullWidth onClick={() => setTele(true)} style={{ padding: "13px" }}>📱 Iniciar consulta de telemedicina</Btn>
          {tele && <Modal open={tele} onClose={() => setTele(false)} title="Telemedicina"><div style={{ textAlign: "center", padding: 20 }}><div style={{ fontSize: 40, marginBottom: 12 }}>📹</div><div style={{ fontSize: 13, color: C.muted }}>Tu médico se conectará a la hora de tu cita. Recibirás un aviso cuando la sala esté lista.</div></div></Modal>}
        </div>
      </div>
    </AppCtx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════
const DEMO_CREDENTIALS = {
  admin:    { email: "admin@awake4wellness.com",    pass: "Admin2024!",    label: "Administrador", icon: "👑", color: DS.colors.warning },
  medico:   { email: "doctor@awake4wellness.com",   pass: "Medico2024!",   label: "Médico",        icon: "👨‍⚕️", color: DS.colors.primary },
  paciente: { email: "paciente@awake4wellness.com", pass: "Paciente2024!", label: "Paciente",      icon: "🧑", color: DS.colors.teal },
};

function RoleSelector({ value, onChange }) {
  const C = DS.colors;
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
      {Object.entries(DEMO_CREDENTIALS).map(([rol, cfg]) => (
        <button key={rol} onClick={() => onChange(rol)} style={{
          flex: 1, padding: "12px 8px", borderRadius: 12, cursor: "pointer",
          border: `1px solid ${value === rol ? `${cfg.color}50` : C.border}`,
          background: value === rol ? dim(cfg.color) : "rgba(255,255,255,0.03)",
          color: value === rol ? cfg.color : C.muted, fontWeight: 700, fontSize: 12,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s",
        }}>
          <span style={{ fontSize: 22 }}>{cfg.icon}</span>{cfg.label}
        </button>
      ))}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const C = DS.colors;
  const [rol, setRol] = useState("medico");
  const [email, setEmail] = useState(DEMO_CREDENTIALS.medico.email);
  const [pass, setPass] = useState(DEMO_CREDENTIALS.medico.pass);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function pickRole(r) {
    setRol(r);
    setEmail(DEMO_CREDENTIALS[r].email);
    setPass(DEMO_CREDENTIALS[r].pass);
  }

  async function entrar() {
    setLoading(true); setError("");
    try {
      await CoreServices.signIn(email, pass);
      const user = { email, id: "demo", rol };
      localStorage.setItem("a4w_user", JSON.stringify(user));
      onLogin(user);
    } catch (e) {
      setError(e.message || "No se pudo iniciar sesión");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: DS.font, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: dim(C.teal), border: `1px solid ${C.teal}35`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 12 }}>🌿</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Awake4Wellness</h1>
          <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 13 }}>Concierge Recovery & Neuro-Metabolic Optimization</p>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1.5, marginBottom: 10 }}>SELECCIONA TU ROL</div>
          <RoleSelector value={rol} onChange={pickRole} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Correo" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
            <Input label="Contraseña" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div style={{ marginTop: 12, fontSize: 12, color: C.danger }}>{error}</div>}

          {IS_DEMO && false && (
            <div style={{ marginTop: 12, fontSize: 11, color: C.dim }}>
              Conecta Supabase para autenticación real.
            </div>
          )}

          <Btn color={C.teal} fullWidth onClick={entrar} disabled={loading} style={{ marginTop: 18, padding: "13px" }}>
            {loading ? "Entrando..." : "Entrar →"}
          </Btn>

          <div style={{ marginTop: 14, fontSize: 11, color: C.muted, textAlign: "center" }}>
            Modo demo · credenciales precargadas por rol
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP SHELL — sidebar auto-generado desde pluginRegistry
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const C = DS.colors;
  const [user, setUser] = useState(() => CoreServices.getUser());
  const [active, setActive] = useState({ id: "dashboard", patient: null });
  const [patients, setPatients] = useState(DEMO_PATIENTS);
  const [sessions, setSessions] = useState(DEMO_SESSIONS);

  function navigate(id, patient = null) {
    setActive({ id, patient: patient || (id === "patient-detail" ? active.patient : null) });
  }

  async function addPatient(form) {
    const { data } = await CoreServices.insert("patients", form);
    const nuevo = (data && data[0]) || { ...form, id: Date.now().toString() };
    setPatients(prev => [nuevo, ...prev]);
  }

  async function addSession(form) {
    const { data } = await CoreServices.insert("sessions", form);
    const nueva = (data && data[0]) || { ...form, id: Date.now().toString(), fecha: new Date().toISOString() };
    setSessions(prev => [nueva, ...prev]);
  }

  function signOut() { CoreServices.signOut(); setUser(null); }

  if (!user) return <LoginScreen onLogin={setUser} />;
  if (user.rol === "paciente") return <PatientPortal user={user} onSignOut={signOut} />;

  const rol = user.rol || "medico";
  const visiblePlugins = pluginRegistry.filter(p => rol === "admin" ? true : p.badge !== "Admin");

  let ActiveComp = null, activePlugin = null;
  if (active.id === "patient-detail" && active.patient) {
    ActiveComp = PatientDetailPlugin;
  } else {
    activePlugin = visiblePlugins.find(p => p.id === active.id) || visiblePlugins[0];
    ActiveComp = activePlugin.component;
  }

  const groups = Object.keys(PLUGIN_GROUPS);

  return (
    <AppCtx.Provider value={{ C, user }}>
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: DS.font, color: C.text }}>
        {/* Sidebar */}
        <div style={{ width: 240, borderRight: `1px solid ${C.border}`, padding: "18px 14px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", boxSizing: "border-box", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, padding: "0 6px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: dim(C.teal), border: `1px solid ${C.teal}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🌿</div>
            <div><div style={{ fontSize: 14, fontWeight: 800 }}>Awake4Wellness</div><div style={{ fontSize: 9, color: C.muted }}>v4.0 · {DEMO_CREDENTIALS[rol]?.label || "Médico"}</div></div>
          </div>

          {groups.map(g => {
            const plugs = visiblePlugins.filter(p => p.group === g);
            if (!plugs.length) return null;
            return (
              <div key={g} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: 2, padding: "0 8px", marginBottom: 6 }}>{PLUGIN_GROUPS[g].icon} {PLUGIN_GROUPS[g].label.toUpperCase()}</div>
                {plugs.map(p => {
                  const on = active.id === p.id;
                  return (
                    <button key={p.id} onClick={() => navigate(p.id)} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer", marginBottom: 2, textAlign: "left",
                      background: on ? dim(p.color) : "transparent",
                      color: on ? p.color : C.muted, fontSize: 12.5, fontWeight: on ? 700 : 500,
                      borderLeft: on ? `2px solid ${p.color}` : "2px solid transparent",
                    }}>
                      <span style={{ fontSize: 15 }}>{p.icon}</span>
                      <span style={{ flex: 1 }}>{p.name}</span>
                      {p.badge && <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 6px", borderRadius: 10, background: dim(p.color), color: p.color }}>{p.badge}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}

          <button onClick={signOut} style={{ marginTop: "auto", width: "100%", padding: "9px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Cerrar sesión
          </button>
        </div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ borderBottom: `1px solid ${C.border}`, padding: "12px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: C.muted }}>
              {active.id === "patient-detail" && active.patient ? `Pacientes / ${active.patient.nombre} ${active.patient.apellido}` : (activePlugin?.name || "")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: C.muted }}>{DEMO_CREDENTIALS[rol]?.icon} {user.email}</span>
              <Avatar name={user.email} size={30} color={DEMO_CREDENTIALS[rol]?.color || C.primary} />
            </div>
          </div>

          <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
            {active.id === "patient-detail" && active.patient ? (
              <PatientDetailPlugin patient={active.patient} sessions={sessions} onAddSession={addSession} navigate={navigate} plugins={pluginRegistry} />
            ) : (
              <ActiveComp
                patient={active.patient}
                patients={patients}
                sessions={sessions}
                onAddPatient={addPatient}
                onAddSession={addSession}
                navigate={navigate}
                plugins={pluginRegistry}
                user={user}
                C={C}
              />
            )}
          </div>
        </div>
      </div>
    </AppCtx.Provider>
  );
}
