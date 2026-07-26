import { google } from "googleapis";
import { createReadStream } from "node:fs";
import config from "../config.js";

// Sube el vídeo a YouTube. Queda en PRIVADO para que lo revises en
// YouTube Studio antes de publicarlo (obligatorio además mientras tu
// app OAuth no esté auditada por Google).
export async function subirVideo({ ruta, titulo, descripcion }) {
  const oauth2 = new google.auth.OAuth2(
    process.env.YT_CLIENT_ID,
    process.env.YT_CLIENT_SECRET,
    "http://localhost:8080"
  );
  oauth2.setCredentials({ refresh_token: process.env.YT_REFRESH_TOKEN });

  const youtube = google.youtube({ version: "v3", auth: oauth2 });

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: titulo,
        description: descripcion,
        categoryId: "24", // Entretenimiento
        defaultLanguage: config.idioma,
      },
      status: {
        privacyStatus: config.privacidad,
        selfDeclaredMadeForKids: config.hechoParaNinos,
        // Transparencia: contenido generado/alterado con IA
        containsSyntheticMedia: true,
      },
    },
    media: { body: createReadStream(ruta) },
  });

  return `https://studio.youtube.com/video/${res.data.id}/edit`;
}
