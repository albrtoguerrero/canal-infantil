import config from "../config.js";

// Genera el guion con la API gratuita de Gemini.
// Devuelve { titulo, descripcion, frases: [..] }
export async function generarGuion() {
  const prompt = `Eres guionista de un canal de YouTube infantil en español.
Tema del canal: ${config.nicho}.
Escribe UN vídeo nuevo de unos ${config.duracionSegundos} segundos de narración.

Reglas estrictas:
- Contenido 100% apropiado para niños pequeños: nada de miedo, violencia, romance ni temas adultos.
- Lenguaje muy sencillo, frases cortas, tono alegre.
- Sin marcas, sin nombres de personas reales, sin pedir likes ni suscripciones.

Responde SOLO con JSON válido, sin markdown ni texto extra, con esta forma:
{
  "titulo": "título atractivo y claro (máx 90 caracteres)",
  "descripcion": "descripción del vídeo en 2-3 frases",
  "frases": ["frase 1 de la narración", "frase 2", "..."]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const texto = data.candidates[0].content.parts[0].text
    .replace(/```json|```/g, "")
    .trim();
  const guion = JSON.parse(texto);

  if (!guion.titulo || !Array.isArray(guion.frases) || guion.frases.length === 0) {
    throw new Error("Guion inválido: " + texto.slice(0, 200));
  }
  return guion;
}
