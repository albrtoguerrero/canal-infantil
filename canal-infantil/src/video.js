import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import config from "../config.js";

const run = promisify(execFile);

async function duracionAudio(audio) {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", audio,
  ]);
  return parseFloat(stdout);
}

// Reparte la duración total entre frases proporcionalmente a su longitud
function tiemposFrases(frases, total) {
  const chars = frases.map((f) => f.length);
  const suma = chars.reduce((a, b) => a + b, 0);
  let t = 0;
  return frases.map((frase, i) => {
    const dur = (chars[i] / suma) * total;
    const seg = { frase, inicio: t, fin: t + dur };
    t += dur;
    return seg;
  });
}

const aTiempoAss = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toFixed(2).padStart(5, "0");
  return `${h}:${String(m).padStart(2, "0")}:${sec}`;
};

async function generarSubtitulos(frases, total, ruta) {
  const cab = `[Script Info]
ScriptType: v4.00+
PlayResX: ${config.ancho}
PlayResY: ${config.alto}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV
Style: Kids,DejaVu Sans,72,&H00FFFFFF,&H00000000,&H80000000,-1,5,0,2,60,60,260

[Events]
Format: Layer, Start, End, Style, Text
`;
  const lineas = tiemposFrases(frases, total)
    .map((s) => `Dialogue: 0,${aTiempoAss(s.inicio)},${aTiempoAss(s.fin)},Kids,${s.frase.replace(/\n/g, " ")}`)
    .join("\n");
  await writeFile(ruta, cab + lineas + "\n");
  return ruta;
}

// Monta el vídeo final: slideshow de ilustraciones + narración + subtítulos
export async function montarVideo(imagenes, audio, frases, dir) {
  const total = await duracionAudio(audio);
  const porImagen = total / imagenes.length;
  const subs = await generarSubtitulos(frases, total, path.join(dir, "subs.ass"));
  const salida = path.join(dir, "video.mp4");

  const args = [];
  for (const img of imagenes) args.push("-loop", "1", "-t", porImagen.toFixed(2), "-i", img);
  args.push("-i", audio);

  const { ancho, alto } = config;
  const escala = imagenes
    .map((_, i) =>
      `[${i}:v]scale=${ancho}:${alto}:force_original_aspect_ratio=increase,` +
      `crop=${ancho}:${alto},setsar=1,fps=30[v${i}]`
    )
    .join(";");
  const concat = imagenes.map((_, i) => `[v${i}]`).join("") +
    `concat=n=${imagenes.length}:v=1:a=0[slides];` +
    `[slides]ass=${subs}[vout]`;

  args.push(
    "-filter_complex", `${escala};${concat}`,
    "-map", "[vout]", "-map", `${imagenes.length}:a`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "21",
    "-c:a", "aac", "-b:a", "128k",
    "-shortest", "-y", salida
  );

  await run("ffmpeg", args);
  return salida;
}
