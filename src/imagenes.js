import { writeFile } from "node:fs/promises";
import path from "node:path";
import config from "../config.js";

const MODELO_IMG = "gemini-2.5-flash-image";
const API = "https://generativelanguage.googleapis.com/v1beta/models";

// Llama a Nano Banana. Muestra el motivo exacto si falla.
async function generar(prompt, referencia = null) {
  const parts = [{ text: prompt }];
  if (referencia) {
    parts.push({
      inlineData: { mimeType: "image/png", data: referencia.toString("base64") },
    });
  }
  const res = await fetch(`${API}/${MODELO_IMG}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.log(`    (imagen IA ${res.status}: ${txt.slice(0, 150)})`);
    return null;
  }
  const data = await res.json();
  for (const p of data?.candidates?.[0]?.content?.parts || []) {
    if (p.inlineData?.data) return Buffer.from(p.inlineData.data, "base64");
  }
  console.log("    (imagen IA: respuesta sin imagen)");
  return null;
}

// Respaldo Pixabay con variedad: baraja resultados y usa términos distintos
// por escena, para que aunque falle la IA no salgan siempre iguales.
async function pixabay(termino, semilla) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", process.env.PIXABAY_API_KEY);
  url.searchParams.set("q", termino);
  url.searchParams.set("image_type", "illustration");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("orientation", "vertical");
  url.searchParams.set("per_page", "50");
  url.searchParams.set("order", "popular");
  const res = await fetch(url);
  if (!res.ok) return null;
  const { hits } = await res.json();
  if (!hits?.length) return null;
  // Elegir un resultado distinto según la semilla (evita repetición)
  const idx = (semilla * 7 + Math.floor(Math.random() * hits.length)) % hits.length;
  const img = await fetch(hits[idx].largeImageURL);
  return Buffer.from(await img.arrayBuffer());
}

export async function descargarImagenes(dir, { estilo, personaje, escenas, titulo }) {
  const rutas = [];
  const total = Math.min(config.numImagenes, escenas.length);

  console.log("    generando personaje de referencia...");
  const refPrompt = `${estilo}. Retrato de cuerpo entero de este personaje sobre fondo simple y claro: ${personaje}. ` +
    `Formato vertical. Sin texto ni letras. Ilustración limpia.`;
  let referencia = await generar(refPrompt);
  let usadasIA = 0;

  for (let i = 0; i < total; i++) {
    const escenaPrompt = `${estilo}. Formato vertical 9:16 para vídeo infantil. ` +
      `Usa EXACTAMENTE el mismo personaje de la imagen de referencia (mismo aspecto, color y ropa). ` +
      `Escena: ${escenas[i]}. Sin texto, sin letras, sin marcas de agua. Ilustración alegre.`;

    let buf = referencia ? await generar(escenaPrompt, referencia) : await generar(escenaPrompt);
    if (buf) usadasIA++;
    // Respaldo Pixabay variado por escena
    if (!buf) buf = await pixabay(`${escenas[i]} dibujo infantil`, i + 1);
    if (!buf) buf = await pixabay(`${titulo} ilustracion`, i + 3);
    if (!buf) buf = await pixabay("cuento infantil dibujo animado", i + 5);
    if (!buf) continue;

    const ruta = path.join(dir, `img_${i}.png`);
    await writeFile(ruta, buf);
    rutas.push(ruta);
    if (!referencia && buf) referencia = buf;
  }

  console.log(`    (${usadasIA}/${total} imágenes generadas por IA, resto de Pixabay)`);
  if (rutas.length === 0) throw new Error("No se pudo obtener ninguna imagen");
  return rutas;
}
