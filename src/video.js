import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
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
Style: Kids,DejaVu Sans,76,&H00FFFFFF,&H00202020,&HA0000000,-1,6,3,2,70,70,300

[Events]
Format: Layer, Start, End, Style, Text
`;
  const lineas = tiemposFrases(frases, total)
    .map((s) => `Dialogue: 0,${aTiempoAss(s.inicio)},${aTiempoAss(s.fin)},Kids,{\\fad(250,250)}${s.frase.replace(/\n/g, " ")}`)
    .join("\n");
  await writeFile(ruta, cab + lineas + "\n");
  return ruta;
}

// Efecto Ken Burns eficiente: pre-escala grande + crop animado con expresiones.
// Mucho más rápido que zoompan y sin jitter.
function kenBurns(i, dur, fps) {
  const { ancho, alto } = config;
  // escalamos a 130% para tener margen de movimiento
  const bigW = Math.round(ancho * 1.3);
  const bigH = Math.round(alto * 1.3);
  const modo = i % 4;
  // crop=w:h:x:y con x,y en función de t (tiempo)
  let x, y;
  const maxX = bigW - ancho;
  const maxY = bigH - alto;
  if (modo === 0) { x = `(${maxX})*t/${dur}`; y = `${maxY}/2`; }        // paneo derecha
  else if (modo === 1) { x = `${maxX}*(1-t/${dur})`; y = `${maxY}/2`; } // paneo izquierda
  else if (modo === 2) { x = `${maxX}/2`; y = `${maxY}*t/${dur}`; }     // paneo abajo
  else { x = `${maxX}/2`; y = `${maxY}*(1-t/${dur})`; }                 // paneo arriba
  return `scale=${bigW}:${bigH}:force_original_aspect_ratio=increase,crop=${bigW}:${bigH},crop=${ancho}:${alto}:'${x}':'${y}',fps=${fps},setsar=1`;
}

export async function montarVideo(imagenes, audio, frases, dir) {
  const total = await duracionAudio(audio);
  const n = imagenes.length;
  const trans = 0.5;
  const porImagen = total / n + trans;
  const subs = await generarSubtitulos(frases, total, path.join(dir, "subs.ass"));
  const salida = path.join(dir, "video.mp4");
  const fps = 30;

  const args = [];
  for (const img of imagenes) args.push("-loop", "1", "-t", porImagen.toFixed(2), "-i", img);
  args.push("-i", audio);

  const musica = path.resolve("assets", "musica.mp3");
  const hayMusica = existsSync(musica);
  if (hayMusica) args.push("-stream_loop", "-1", "-i", musica);

  const prep = imagenes
    .map((_, i) => `[${i}:v]${kenBurns(i, porImagen, fps)}[z${i}]`)
    .join(";");

  let cadena = "";
  let prev = "z0";
  let offset = total / n - trans;
  for (let i = 1; i < n; i++) {
    const out = i === n - 1 ? "slides" : `x${i}`;
    cadena += `;[${prev}][z${i}]xfade=transition=fade:duration=${trans}:offset=${offset.toFixed(2)}[${out}]`;
    prev = out;
    offset += total / n - trans;
  }
  if (n === 1) cadena = ";[z0]copy[slides]";

  const filtro = `${prep}${cadena};[slides]ass=${subs}[vout]`;
  const idxVoz = n;

  if (hayMusica) {
    const idxMus = n + 1;
    args.push(
      "-filter_complex",
      `${filtro};[${idxMus}:a]volume=0.12[bg];[${idxVoz}:a][bg]amix=inputs=2:duration=first:dropout_transition=0[aout]`,
      "-map", "[vout]", "-map", "[aout]"
    );
  } else {
    args.push("-filter_complex", filtro, "-map", "[vout]", "-map", `${idxVoz}:a`);
  }

  args.push(
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k",
    "-shortest", "-y", salida
  );

  await run("ffmpeg", args);
  return salida;
}
