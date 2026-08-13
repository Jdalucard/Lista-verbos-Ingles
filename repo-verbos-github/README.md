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
├── index.html          # Página principal (usa los 3 archivos siguientes)
├── verbos.css          # Estilos
├── verbos.data.js      # Datos: los 486 verbos con sus formas
├── verbos.js           # Lógica de la app (tarjetas, quiz, lecciones, progreso)
├── Mis_486_Verbos.html # Versión todo-en-uno (un solo archivo, autocontenida)
├── netlify.toml        # Configuración de despliegue (caché y cabeceras)
└── .gitignore
```

## 🚀 Despliegue en Netlify

**Opción 1 — Arrastrar y soltar:** entra a [app.netlify.com](https://app.netlify.com), ve a *Sites* (o a *Deploys* de tu sitio existente) y arrastra la carpeta del proyecto.

**Opción 2 — Desde GitHub (recomendada):** en Netlify elige *Add new site → Import an existing project → GitHub*, selecciona este repositorio y despliega con la configuración por defecto (no necesita build; `netlify.toml` ya define `publish = "."`). Cada `git push` a `main` actualizará el sitio automáticamente.

## 🛠️ Desarrollo local

No requiere build ni dependencias. Abre `index.html` en el navegador, o sirve la carpeta:

```bash
npx serve .
```

> **Nota:** el progreso se guarda por navegador y por dominio. Al redesplegar el sitio, el progreso de los usuarios se conserva.
