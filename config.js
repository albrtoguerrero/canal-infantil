// ============================================================
// CONFIGURACIÓN DEL CANAL — edita esto a tu gusto
// ============================================================
export default {
  // Tema del canal. Cambia el nicho aquí y todo el pipeline se adapta.
  nicho: "cuentos cortos originales para niños de 4 a 8 años, con una moraleja sencilla y positiva",

  idioma: "es-ES",

  // Voz neuronal de Edge (gratis). Otras opciones: es-ES-ElviraNeural,
  // es-ES-AlvaroNeural, es-MX-DaliaNeural. Lista completa: npx msedge-tts --list
  voz: "es-MX-XimenaNeural", // voz cálida y dulce para cuentos (otras: es-ES-ElviraNeural, es-ES-VeraNeural)

  // Duración objetivo del guion (los Shorts admiten hasta 3 min, ideal ~60s)
  duracionSegundos: 60,

  // Cuántas ilustraciones de fondo por vídeo
  numImagenes: 6,

  // Resolución vertical para Shorts
  ancho: 1080,
  alto: 1920,

  // IMPORTANTE: el vídeo se sube SIEMPRE como "private" para que lo revises
  // en YouTube Studio antes de hacerlo público. No lo cambies a "public"
  // hasta que: (1) Google haya auditado tu app OAuth, y (2) estés revisando
  // cada vídeo. Publicar contenido infantil sin revisar es mala idea y es
  // justo lo que YouTube está penalizando.
  privacidad: "private",

  // Contenido infantil => obligatorio por COPPA marcarlo como "made for kids"
  hechoParaNinos: true,
};
