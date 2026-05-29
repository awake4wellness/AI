// api/chat.js
// Función Serverless de Vercel — proxy seguro a OpenAI.
// La clave vive SOLO en el servidor (variable de entorno OPENAI_API_KEY).
// El navegador nunca la ve.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY no está configurada en el servidor" });
  }

  try {
    const { messages, system } = req.body;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1200,
        temperature: 0.3,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          ...(messages || []),
        ],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || "Error de OpenAI" });
    }

    const text = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
