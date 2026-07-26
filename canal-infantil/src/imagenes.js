import { writeFile } from "node:fs/promises";
import path from "node:path";
import config from "../config.js";

// Descarga ilustraciones libres de Pixabay (API gratuita) relacionadas
// con el título del vídeo. Filtra a "illustration" + safesearch para
// estética infantil y contenido seguro.
export async function descargarImagenes(consulta, dir) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", process.env.PIXABAY_API_KEY);
  url.searchParams.set("q", consulta);
  url.searchParams.set("lang", "es");
  url.searchParams.set("image_type", "illustration");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("orientation", "vertical");
  url.searchParams.set("per_page", String(Math.max(config.numImagenes, 3)));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pixabay ${res.status}`);
  let { hits } = await res.json();

  // Si la búsqueda concreta no da resultados, usamos un término genérico
  if (!hits || hits.length === 0) {
    url.searchParams.set("q", "cuento infantil dibujos");
    const res2 = await fetch(url);
    hits = (await res2.json()).hits;
  }
  if (!hits || hits.length === 0) throw new Error("Pixabay no devolvió imágenes");

  const rutas = [];
  for (let i = 0; i < Math.min(config.numImagenes, hits.length); i++) {
    const img = await fetch(hits[i].largeImageURL);
    const ruta = path.join(dir, `img_${i}.jpg`);
    await writeFile(ruta, Buffer.from(await img.arrayBuffer()));
    rutas.push(ruta);
  }
  return rutas;
}
