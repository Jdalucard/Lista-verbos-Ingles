// Regenera Mis_486_Verbos.html (versión todo-en-uno, autocontenida) a partir de
// index.html + verbos.css + los módulos ES de data/ y js/.
// Uso: node tools/build-standalone.js
// Ejecutar manualmente después de tocar js/, data/ o verbos.css, antes de commitear.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const MODULE_FILES = [
  'data/verbs.js',
  'data/lessons.js',
  'js/utils.js',
  'js/nav.js',
  'js/learn.js',
  'js/flashcards.js',
  'js/quiz.js',
  'js/list.js',
  'js/extras.js',
  'js/progress.js',
  'js/main.js', // debe ir al final: contiene la secuencia de arranque
];

function stripImportsExports(src) {
  return src
    .split('\n')
    .filter(line => !/^\s*(import|export)\s/.test(line))
    .join('\n');
}

const concatenated = MODULE_FILES
  .map(rel => stripImportsExports(fs.readFileSync(path.join(ROOT, rel), 'utf8')))
  .join('\n');

if (/^\s*(import|export)\b/m.test(concatenated)) {
  throw new Error('build-standalone: quedó un import/export sin eliminar en el bundle generado.');
}

const css = fs.readFileSync(path.join(ROOT, 'verbos.css'), 'utf8');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

html = html.replace(
  /<link rel="stylesheet" href="verbos\.css">/,
  `<style>\n${css}\n  </style>`
);
html = html.replace(
  /<script type="module" src="js\/main\.js"><\/script>/,
  `<script>\n${concatenated}\n</script>`
);

fs.writeFileSync(path.join(ROOT, 'Mis_486_Verbos.html'), html);
console.log('Mis_486_Verbos.html regenerado.');
