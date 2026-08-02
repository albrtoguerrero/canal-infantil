import config from "../config.js";

const MODELO = "gemini-flash-latest";

// Bancos de ideas para forzar variedad: en cada ejecución se elige uno al azar.
const PROTAGONISTAS = [
  "una ardilla curiosa", "un pequeño dragón amistoso", "una tortuga aventurera",
  "un zorro astuto y bueno", "una lechuza sabia", "un erizo tímido",
  "una ranita saltarina", "un osito goloso", "una abeja trabajadora",
  "un ratoncito valiente", "una nutria juguetona", "un caracol soñador",
  "un pingüino explorador", "una mariposa colorida", "un topo ingenioso",
];
const ESCENARIOS = [
  "un bosque encantado", "una playa soleada", "una montaña nevada",
  "un jardín lleno de flores", "un río tranquilo", "una ciudad de juguete",
  "el fondo del mar", "un cielo lleno de nubes", "una granja alegre",
  "una cueva misteriosa", "un desierto con oasis", "un pueblo entre árboles",
];
const TEMAS = [
  "la importancia de compartir", "no rendirse nunca", "el valor de la amistad",
  "ser valiente ante el miedo", "ayudar a los demás", "cuidar la naturaleza",
  "la paciencia", "aceptar a los que son diferentes", "decir la verdad",
  "trabajar en equipo", "ser agradecido", "escuchar a los demás",
];
const al = (a) => a[Math.floor(Math.random() * a.length)];

export async function generarGuion() {
  const protagonista = al(PROTAGONISTAS);
  const escenario = al(ESCENARIOS);
  const tema = al(TEMAS);

  const prompt = `Eres guionista del canal de YouTube infantil "Cuentos Aventureros".
Escribe UN cuento NUEVO y ORIGINAL de unos ${config.duracionSegundos} segundos de narración, tono aventurero y divertido.

Para este cuento concreto usa OBLIGATORIAMENTE estos elementos (no los cambies):
- Protagonista: ${protagonista} (invéntale un nombre propio original y sencillo).
- Escenario: ${escenario}.
- Moraleja: ${tema}.

Reglas estrictas:
- Contenido 100% apropiado para niños pequeños: nada de miedo real, violencia, romance ni temas adultos.
- Lenguaje muy sencillo, frases CORTAS (máximo 12 palabras), tono alegre.
- Estructura con inicio, aventura y la moraleja indicada al final.
- El TÍTULO debe ser único y mencionar al personaje y su aventura concreta (no genérico).
- Sin marcas, sin nombres de personas reales, sin pedir likes ni suscripciones.

MUY IMPORTANTE para las ilustraciones:
- "estilo": describe un estilo visual ÚNICO y fijo para todo el cuento.
- "personaje": describe al protagonista con detalle fijo (especie, colores, ropa, rasgos) para que se vea IGUAL en todas las escenas.
- "escenas": una descripción visual por cada frase, mencionando SIEMPRE al personaje y el escenario para mantener coherencia. Sin texto ni letras en la imagen.

Responde SOLO con JSON válido, sin markdown ni texto extra:
{
  "titulo": "título único con emoji (máx 90 caracteres)",
  "descripcion": "2-3 frases + 3 hashtags infantiles al final",
  "estilo": "estilo visual fijo",
  "personaje": "descripción física fija del protagonista",
  "frases": ["frase corta 1", "frase corta 2", "..."],
  "escenas": ["descripción visual escena 1", "..."]
}
Las listas "frases" y "escenas" deben tener el MISMO número de elementos.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 1.15 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const texto = data.candidates[0].content.parts[0].text
    .replace(/```json|```/g, "")
    .trim();
  const guion = JSON.parse(texto);

  if (!guion.titulo || !Array.isArray(guion.frases) || guion.frases.length === 0) {
    throw new Error("Guion inválido: " + texto.slice(0, 200));
  }
  guion.estilo = guion.estilo || "ilustración de libro infantil, acuarela, colores cálidos";
  guion.personaje = guion.personaje || protagonista;
  if (!Array.isArray(guion.escenas) || guion.escenas.length !== guion.frases.length) {
    guion.escenas = guion.frases.map((f) => f);
  }
  console.log(`    (tema: ${protagonista} / ${escenario} / ${tema})`);
  return guion;
}
