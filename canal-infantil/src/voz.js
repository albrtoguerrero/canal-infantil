import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { rename } from "node:fs/promises";
import path from "node:path";
import config from "../config.js";

// Convierte el guion completo en un mp3 usando la voz neuronal de Edge (gratis).
export async function generarVoz(frases, salida) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(config.voz, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const texto = frases.join(" ");
  const dir = path.dirname(salida);
  const { audioFilePath } = await tts.toFile(dir, texto);
  await rename(audioFilePath, salida);
  return salida;
}
