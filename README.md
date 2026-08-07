# Canal infantil automatizado

Pipeline 100% gratuito que cada día genera un vídeo infantil (cuento corto vertical tipo Short) y lo sube a YouTube **en privado** para que lo revises antes de publicarlo.

Flujo: **Gemini** (guion) → **Edge TTS** (voz) → **Pixabay** (ilustraciones) → **ffmpeg** (montaje con subtítulos) → **YouTube Data API** (subida) → cron gratuito con **GitHub Actions**.

## Puesta en marcha

1. **Claves gratuitas** — copia `.env.example` a `.env` y rellena:
   - `GEMINI_API_KEY`: en [aistudio.google.com](https://aistudio.google.com) → *Get API key*.
   - `PIXABAY_API_KEY`: crea cuenta en Pixabay y cópiala de [pixabay.com/api/docs](https://pixabay.com/api/docs/).

2. **YouTube API** — en [Google Cloud Console](https://console.cloud.google.com):
   - Crea un proyecto y habilita **YouTube Data API v3**.
   - Crea credenciales **OAuth 2.0** (tipo *Aplicación web*, redirect `http://localhost:8080`).
   - Copia `YT_CLIENT_ID` y `YT_CLIENT_SECRET` al `.env`.
   - Ejecuta `npm run autorizar` en tu ordenador, acepta los permisos y guarda el `YT_REFRESH_TOKEN` que imprime.

3. **Prueba local**:
   ```bash
   npm install
   npm run generar          # genera el vídeo en salida/ sin subirlo
   SUBIR=true npm run generar   # lo genera y lo sube en privado
   ```
   Necesitas `ffmpeg` instalado (`sudo apt install ffmpeg` / `brew install ffmpeg`).

4. **Automatizarlo** — sube el repo a GitHub, añade las 5 claves en *Settings → Secrets and variables → Actions*, y el workflow `diario.yml` generará y subirá un vídeo cada día a las 9:00 UTC (también puedes lanzarlo a mano desde la pestaña Actions).

5. **Tu parte diaria (2 minutos)**: entra en YouTube Studio, mira el vídeo del día y, si está bien, cámbialo de privado a público.

## Cosas importantes que debes saber

- **El `YT_REFRESH_TOKEN` caduca cada 7 días mientras la app OAuth no esté auditada por Google.** Si el workflow falla con `invalid_grant`, es eso: vuelve a ejecutar `npm run autorizar`, acepta permisos y actualiza el secreto `YT_REFRESH_TOKEN` en *Settings → Secrets and variables → Actions*. Para evitar esto de forma permanente, publica la app OAuth (pantalla de consentimiento) en modo "En producción" desde Google Cloud Console.
- **Los vídeos quedan en privado a propósito.** Mientras Google no audite tu app OAuth, la API los bloquea en privado de todos modos. Pero aunque pase la auditoría, mantén la revisión manual: es contenido para niños y YouTube está eliminando activamente canales infantiles generados con IA sin supervisión humana ("AI slop"). Tu revisión diaria es lo que separa un canal legítimo de uno purgable.
- **Made for Kids / COPPA**: los vídeos se marcan automáticamente como contenido infantil (`selfDeclaredMadeForKids`) y como contenido sintético. Es obligatorio legalmente; implica anuncios no personalizados y comentarios desactivados.
- **Monetización**: no esperes monetizar solo con esto. La política de "contenido no auténtico" de YouTube (endurecida en julio de 2026) desmonetiza canales de producción masiva sin aporte creativo propio. Para que el canal sea viable a medio plazo: edita los guiones, crea personajes propios recurrentes, mejora las miniaturas… usa el pipeline como base, no como producto final.
- **Personaliza `config.js`**: nicho, voz, número de imágenes, duración. Cambiar el nicho cambia todo el canal.

## Estructura

```
config.js            Configuración del canal (nicho, voz, resolución...)
src/guion.js         Guion con Gemini (JSON: título, descripción, frases)
src/voz.js           Narración con Edge TTS
src/imagenes.js      Ilustraciones seguras de Pixabay (safesearch)
src/video.js         Montaje ffmpeg: slideshow + subtítulos .ass + audio
src/subir.js         Subida a YouTube (privado, made-for-kids, sintético)
src/index.js         Orquestador
scripts/autorizar.js OAuth inicial (una sola vez)
.github/workflows/diario.yml  Cron diario gratuito
```
