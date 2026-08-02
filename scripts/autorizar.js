import { google } from "googleapis";
import http from "node:http";

// Ejecuta esto UNA VEZ en tu ordenador para obtener el YT_REFRESH_TOKEN.
// Uso: YT_CLIENT_ID=... YT_CLIENT_SECRET=... node scripts/autorizar.js
const oauth2 = new google.auth.OAuth2(
  process.env.YT_CLIENT_ID,
  process.env.YT_CLIENT_SECRET,
  "http://localhost:8080"
);

const url = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/youtube.upload"],
});

console.log("\nAbre esta URL en tu navegador y acepta los permisos:\n\n" + url + "\n");

http
  .createServer(async (req, res) => {
    const code = new URL(req.url, "http://localhost:8080").searchParams.get("code");
    if (!code) return res.end();
    const { tokens } = await oauth2.getToken(code);
    res.end("Listo, ya puedes cerrar esta pestaña.");
    console.log("\nTu YT_REFRESH_TOKEN (guárdalo en secretos de GitHub):\n");
    console.log(tokens.refresh_token + "\n");
    process.exit(0);
  })
  .listen(8080);
