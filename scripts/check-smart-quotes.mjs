// Detecta comillas tipográficas ("smart quotes") usadas como DELIMITADORES,
// que rompen el compilador de Angular (error NG5002) cuando se cuelan en
// atributos de plantilla, p.ej. class=”...”. Uso: `npm run check:quotes`.
//
// NO marca comillas curvas en texto visible (p.ej. <p>Deja “hasta” vacío</p>),
// porque ésas son tipografía intencional y no rompen el build.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = 'src';
const EXTS = new Set(['.ts', '.html', '.scss', '.css']);

// Patrones peligrosos: comilla curva pegada a un '=' (apertura de atributo /
// binding) o pegada a '>' (cierre de atributo).
const PATTERNS = [
  { re: /=[“”‘’]/g, name: 'comilla tipográfica abriendo un atributo (=”)' },
  { re: /[“”‘’]>/g, name: 'comilla tipográfica cerrando un atributo (”>)' },
];

const findings = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (EXTS.has(extname(full))) {
      scan(full);
    }
  }
}

function scan(file) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { re, name } of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        findings.push({ file, line: i + 1, col: m.index + 1, name, text: line.trim() });
      }
    }
  });
}

walk(ROOT);

if (findings.length === 0) {
  console.log('✓ Sin comillas tipográficas en delimitadores de src/');
  process.exit(0);
}

console.error(`✗ Se encontraron ${findings.length} comilla(s) tipográfica(s) en delimitadores:\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}:${f.col}  ${f.name}`);
  console.error(`    ${f.text}`);
}
console.error('\nReemplázalas por comillas rectas (" o \') antes de compilar.');
process.exit(1);
