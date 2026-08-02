import { mkdir } from "node:fs/promises";
import path from "node:path";
import { generarGuion } from "./guion.js";
import { generarVoz } from "./voz.js";
import { descargarImagenes } from "./imagenes.js";
import { montarVideo } from "./video.js";
import { subirVideo } from "./subir.js";

async function main() {
  const dir = path.resolve("salida", new Date().toISOString().slice(0, 10));
  await mkdir(dir, { recursive: true });

  console.log("1/5 Generando guion...");
  const guion = await generarGuion();
  console.log(`    "${guion.titulo}" (${guion.frases.length} frases)`);

  console.log("2/5 Generando narración...");
  const audio = await generarVoz(guion.frases, path.join(dir, "voz.mp3"));

  console.log("3/5 Generando ilustraciones con IA (estilo coherente)...");
  const imagenes = await descargarImagenes(dir, {
    estilo: guion.estilo,
    personaje: guion.personaje,
    escenas: guion.escenas,
    titulo: guion.titulo,
  });
  console.log(`    ${imagenes.length} imágenes`);

  console.log("4/5 Montando vídeo (Ken Burns + música + subtítulos)...");
  const video = await montarVideo(imagenes, audio, guion.frases, dir);
  console.log(`    ${video}`);

  if (process.env.SUBIR === "true") {
    console.log("5/5 Subiendo a YouTube (privado, pendiente de tu revisión)...");
    const url = await subirVideo({
      ruta: video,
      titulo: guion.titulo,
      descripcion: guion.descripcion,
    });
    console.log(`    Revísalo aquí: ${url}`);
  } else {
    console.log("5/5 Subida omitida (define SUBIR=true para activarla).");
  }
}

main().catch((err) => {
  console.error("Pipeline fallido:", err.message);
  process.exit(1);
});
