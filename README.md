# Mis 486 Verbos 📚

App interactiva para aprender **486 verbos en inglés** (regulares e irregulares) con sus 5 formas — presente, tercera persona, pasado, participio y gerundio — más el futuro con *will*, y una **ruta de gramática de 22 lecciones** organizadas en 5 módulos.

## ✨ Funcionalidades

- **📖 Aprender** — Conjugador con buscador (en inglés o español), ejemplos por tiempo verbal con palabras clave resaltadas, y notas de regular/irregular.
- **🗂️ Tarjetas** — Flashcards en bloques de 10/20/50, en ambas direcciones (EN→ES / ES→EN), con repetición de las que marcas «Repasar».
- **✏️ Quiz** — Tres modos: pasado simple, completar oraciones (asocia marcadores de tiempo con la forma correcta) y significados. Con puntaje y racha.
- **📋 Lista completa** — Tabla filtrable de los 486 verbos con todas sus formas.
- **💡 Extras** — Ruta de aprendizaje con 22 lecciones en 5 módulos (Fundamentos → Palabras trampa → Tiempos básicos → Modales → Tiempos perfectos), cada una con tabla explicada, ejemplos traducidos, truco y quiz propio.
- **💾 Progreso persistente** — Los verbos dominados y las lecciones superadas se guardan en `localStorage`. Barra de progreso global con «Ver lista» y «Reiniciar».

## 📁 Estructura

```
├── index.html                # Página principal (carga js/main.js como módulo ES)
├── verbos.css                # Estilos
├── data/
│   ├── verbs.js               # Datos: los 486 verbos con sus formas
│   └── lessons.js              # Datos: las 22 lecciones de gramática
├── js/
│   ├── main.js                 # Punto de entrada: arranca cada sección
│   ├── utils.js                 # Helpers compartidos (localStorage, shuffle, etc.)
│   ├── nav.js                   # Navegación entre pestañas
│   ├── learn.js                  # Aprender (conjugador)
│   ├── flashcards.js              # Tarjetas
│   ├── quiz.js                   # Quiz
│   ├── list.js                   # Lista completa
│   ├── extras.js                  # Lecciones + quiz por lección
│   └── progress.js                # Progreso global (conecta Tarjetas + Extras)
├── tools/
│   └── build-standalone.js        # Regenera Mis_486_Verbos.html (ver abajo)
├── Mis_486_Verbos.html        # Versión todo-en-uno GENERADA — no editar a mano
├── netlify.toml               # Configuración de despliegue (caché y cabeceras)
└── .gitignore
```

Cada módulo en `js/` expone una función `init*()` (`initLearn`, `initFlashcards`, etc.)
que `js/main.js` llama en orden al cargar la página.

## 🚀 Despliegue en Netlify

**Opción 1 — Arrastrar y soltar:** entra a [app.netlify.com](https://app.netlify.com), ve a *Sites* (o a *Deploys* de tu sitio existente) y arrastra la carpeta del proyecto.

**Opción 2 — Desde GitHub (recomendada):** en Netlify elige *Add new site → Import an existing project → GitHub*, selecciona este repositorio y despliega con la configuración por defecto (no necesita build; `netlify.toml` ya define `publish = "."`). Cada `git push` a `main` actualizará el sitio automáticamente.

## 🛠️ Desarrollo local

No requiere build ni dependencias, pero `index.html` carga los módulos JS con
`<script type="module">`, y los navegadores bloquean las importaciones de
módulos por CORS cuando el archivo se abre directo con `file://`. Por eso hace
falta un servidor local (cualquiera sirve):

```bash
npx serve .
```

y abrir la URL que te indique (por ejemplo `http://localhost:3000`).

`Mis_486_Verbos.html` sigue siendo un archivo autocontenido que **sí** se
puede abrir directo con doble clic (usa scripts clásicos, no módulos) — es la
opción para cuando no quieres levantar un servidor.

### Regenerar la versión todo-en-uno

`Mis_486_Verbos.html` se genera automáticamente a partir de `index.html` +
`verbos.css` + los módulos de `data/` y `js/` — **no la edites a mano**. Después
de tocar cualquiera de esos archivos, corre:

```bash
node tools/build-standalone.js
```

y commitea el `Mis_486_Verbos.html` actualizado junto con tus cambios.

> **Nota:** el progreso se guarda por navegador y por dominio. Al redesplegar el sitio, el progreso de los usuarios se conserva.
