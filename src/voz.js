import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { rename } from "node:fs/promises";
import path from "node:path";
import config from "../config.js";

// Voces de respaldo por si la configurada no está disponible
const RESPALDOS = ["es-ES-ElviraNeural", "es-MX-DaliaNeural", "es-ES-AlvaroNeural"];

async function intentar(voz, texto, dir) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voz, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioFilePath } = await tts.toFile(dir, texto, {
    rate: "-10%",
    pitch: "+4Hz",
  });
  return audioFilePath;
}

// Genera la narración con voz neuronal de Edge (gratis), con pausas de cuento.
// Si la voz configurada falla, prueba voces de respaldo.
export async function generarVoz(frases, salida) {
  const texto = frases
    .map((f) => {
      let t = f.trim().replace(/\s+/g, " ");
      if (!/[.!?…]$/.test(t)) t += ".";
      return t;
    })
    .join("  …  ");

  const dir = path.dirname(salida);
  const candidatas = [config.voz, ...RESPALDOS.filter((v) => v !== config.voz)];

  let ultimoError;
  for (const voz of candidatas) {
    try {
      const archivo = await intentar(voz, texto, dir);
      await rename(archivo, salida);
      if (voz !== config.voz) console.log(`    (voz de respaldo: ${voz})`);
      return salida;
    } catch (e) {
      ultimoError = e;
    }
  }
  throw new Error("Ninguna voz disponible: " + (ultimoError?.message || ""));
}
