#!/usr/bin/env node
// Genera el manifiesto de catálogo /.well-known/project-card.json.
//
// Combina la declaración estática del proyecto (qué es: id, name, kind,
// description, stack, links) con los datos que cambian en cada build: la
// versión del producto, la fecha de generación y las métricas del repo.
//
// Uso:
//   node scripts/generate-project-card.mjs                    escribe el manifiesto
//   node scripts/generate-project-card.mjs --check            valida sin escribir (CI)
//   node scripts/generate-project-card.mjs --out dist         directorio de salida
//   node scripts/generate-project-card.mjs --no-activity      omite las métricas
//
// Opciones:
//   --config <ruta>      declaración estática (por defecto: project-card.config.json)
//   --out <dir>          raíz del artefacto estático (por defecto: public)
//   --repo <owner/name>  repositorio; si se omite, se deduce del remote origin
//   --check              valida y no escribe; sale con código 1 si algo falla
//   --no-activity        no consulta métricas ni incluye el bloque activity
//   --require-activity   si las métricas fallan, aborta en vez de continuar sin ellas
//
// La declaración estática tiene la misma forma que el manifiesto final. Los
// campos version, updatedAt y activity se ignoran de ella: los calcula este
// script en cada ejecución.
//
// Las métricas salen de la API de GitHub consultando SOLO el repo del propio
// proyecto: basta el GITHUB_TOKEN que el runner inyecta en su propio workflow
// (o GH_TOKEN en local). Sin token funciona igual si el repo es público. Si la
// consulta falla, el manifiesto se genera sin activity en vez de romper el build.
//
// Requisitos: Node >= 18 (fetch nativo). Sin dependencias externas.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';

const SCHEMA_URL = 'https://mrgnlabs.com/schemas/project-card/v1.json';
const SCHEMA_VERSION = '1.0.0';
const MANIFEST_PATH = ['.well-known', 'project-card.json'];
// GITHUB_API_URL lo inyecta GitHub Actions; permite además apuntar a GitHub Enterprise.
const API_ROOT = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');

// ---------------------------------------------------------------- argumentos

function parseArgs(argv) {
  const opts = {
    config: 'project-card.config.json',
    out: 'public',
    repo: null,
    check: false,
    activity: true,
    requireActivity: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) fail(`La opción ${arg} necesita un valor.`);
      i += 1;
      return value;
    };
    switch (arg) {
      case '--config': opts.config = next(); break;
      case '--out': opts.out = next(); break;
      case '--repo': opts.repo = next(); break;
      case '--check': opts.check = true; break;
      case '--no-activity': opts.activity = false; break;
      case '--require-activity': opts.requireActivity = true; break;
      case '--help': case '-h': printHelp(); process.exit(0); break;
      default: fail(`Opción desconocida: ${arg}`);
    }
  }
  return opts;
}

function printHelp() {
  const header = readFileSync(new URL(import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line.startsWith('//'))
    .map((line) => line.replace(/^\/\/ ?/, ''))
    .join('\n');
  console.log(header);
}

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`⚠ ${message}`);
}

// ------------------------------------------------------------------ entradas

function readJson(path, what) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${what} no es JSON válido (${path}): ${error.message}`);
  }
  return null;
}

function loadConfig(path) {
  const config = readJson(path, 'La declaración del manifiesto');
  if (!config) {
    fail(
      `No encuentro ${path}. Copia .claude/templates/project-card.example.json ` +
        '(o .example-native.json) a esa ruta y rellénalo con los datos reales del proyecto.',
    );
  }
  return config;
}

// La versión sale del manifiesto del proyecto para que no se quede congelada en
// un valor escrito a mano; la declarada en el config es solo el respaldo para
// stacks cuyo manifiesto este script no sabe leer (build.gradle, .csproj...).
function resolveVersion(config) {
  const pkg = readJson('package.json', 'package.json');
  if (pkg && typeof pkg.version === 'string' && pkg.version) return pkg.version;

  if (existsSync('VERSION')) {
    const raw = readFileSync('VERSION', 'utf8').trim();
    if (raw) return raw;
  }

  for (const [file, pattern] of [
    ['pyproject.toml', /^\s*version\s*=\s*["']([^"']+)["']/m],
    ['Cargo.toml', /^\s*version\s*=\s*["']([^"']+)["']/m],
  ]) {
    if (existsSync(file)) {
      const match = readFileSync(file, 'utf8').match(pattern);
      if (match) return match[1];
    }
  }

  if (typeof config.version === 'string' && config.version) return config.version;

  warn('No he podido deducir la versión del proyecto; el manifiesto saldrá sin campo "version".');
  return null;
}

function resolveRepoSlug(explicit, config) {
  if (explicit) return explicit;

  const repoLink = (config.links ?? []).find((link) => link?.rel === 'repo');
  const fromLink = repoLink?.href?.match(/github\.com\/([^/]+\/[^/#?]+)/);
  if (fromLink) return fromLink[1].replace(/\.git$/, '');

  try {
    const url = execFileSync('git', ['config', '--get', 'remote.origin.url'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const match = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (match) return match[1];
  } catch {
    // Sin remote git utilizable: se resuelve más arriba como "sin métricas".
  }
  return null;
}

// ------------------------------------------------------------------ métricas

async function githubRequest(path) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'project-card-generator',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_ROOT}/${path}`, { headers });
  if (!response.ok) {
    throw new Error(`GET /${path} devolvió ${response.status}`);
  }
  return response;
}

// GitHub no expone totales de commits/contributors: se leen del número de la
// última página pidiendo un elemento por página.
async function countViaPagination(path) {
  const response = await githubRequest(path);
  const link = response.headers.get('link');
  const last = link?.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  if (last) return Number(last[1]);
  const items = await response.json();
  return Array.isArray(items) ? items.length : 0;
}

async function fetchActivity(slug) {
  const response = await githubRequest(`repos/${slug}`);
  const repo = await response.json();

  const activity = {
    source: 'github',
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    openIssues: repo.open_issues_count ?? 0,
    license: repo.license?.spdx_id ?? null,
    lastPushedAt: repo.pushed_at ?? undefined,
    fetchedAt: new Date().toISOString(),
  };

  // Un fallo aquí no invalida el resto: se omite solo la métrica que falló.
  for (const [key, path] of [
    ['commits', `repos/${slug}/commits?per_page=1`],
    ['contributors', `repos/${slug}/contributors?per_page=1&anon=1`],
  ]) {
    try {
      activity[key] = await countViaPagination(path);
    } catch (error) {
      warn(`No he podido contar ${key}: ${error.message}`);
    }
  }

  return { activity, isPrivate: Boolean(repo.private) };
}

// ---------------------------------------------------------------- validación

const SCHEMA_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function isValidLocalizedText(value) {
  if (isNonEmptyString(value)) return true;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return isNonEmptyString(value.en);
  }
  return false;
}

// Refleja el contrato del ADR-005. Los cinco primeros bloques son los que el
// lector de DevDeck exige: si alguno falla, descarta el manifiesto entero y la
// tarjeta cae al snapshot — el fallo sería silencioso en producción, así que
// aquí es un error duro.
function validate(manifest) {
  const errors = [];

  if (!SCHEMA_VERSION_PATTERN.test(manifest.schemaVersion ?? '')) {
    errors.push('schemaVersion debe existir con formato MAJOR.MINOR.PATCH.');
  }
  if (!isNonEmptyString(manifest.id) || !ID_PATTERN.test(manifest.id)) {
    errors.push('id debe ser un slug en minúsculas (letras, dígitos y guiones).');
  }
  if (!isNonEmptyString(manifest.name)) errors.push('name es obligatorio.');
  if (!isNonEmptyString(manifest.kind)) errors.push('kind es obligatorio.');
  if (!isValidLocalizedText(manifest.description)) {
    errors.push('description debe ser una cadena o un objeto con "en" no vacío.');
  }
  if (manifest.tagline !== undefined && !isValidLocalizedText(manifest.tagline)) {
    errors.push('tagline, si existe, debe ser una cadena o un objeto con "en" no vacío.');
  }

  if (manifest.stack !== undefined) {
    if (!Array.isArray(manifest.stack)) {
      errors.push('stack debe ser un array.');
    } else {
      manifest.stack.forEach((entry, i) => {
        if (!entry || typeof entry !== 'object' || !isNonEmptyString(entry.name)) {
          errors.push(`stack[${i}] necesita un "name" no vacío.`);
        }
      });
    }
  }

  if (manifest.links !== undefined) {
    if (!Array.isArray(manifest.links)) {
      errors.push('links debe ser un array.');
    } else {
      manifest.links.forEach((link, i) => {
        if (!link || typeof link !== 'object') {
          errors.push(`links[${i}] debe ser un objeto.`);
          return;
        }
        if (!isNonEmptyString(link.rel)) errors.push(`links[${i}] necesita "rel".`);
        if (!isNonEmptyString(link.href)) errors.push(`links[${i}] necesita "href".`);
      });
    }
  }

  if (manifest.activity !== undefined) {
    const counters = ['stars', 'forks', 'commits', 'contributors', 'openIssues'];
    for (const key of counters) {
      const value = manifest.activity[key];
      if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
        errors.push(`activity.${key} debe ser un entero >= 0.`);
      }
    }
  }

  return errors;
}

// -------------------------------------------------------------------- salida

function buildManifest(config, { version, activity, isPrivate }) {
  const { activity: _ignoredActivity, updatedAt: _ignoredDate, ...declared } = config;

  const manifest = {
    $schema: SCHEMA_URL,
    schemaVersion: SCHEMA_VERSION,
    ...declared,
    updatedAt: new Date().toISOString(),
  };

  if (version) manifest.version = version;
  else delete manifest.version;

  // La visibilidad real del repo gobierna si DevDeck pinta las métricas. Se
  // rellena sola salvo que el proyecto la haya declarado a mano.
  if (isPrivate !== undefined && Array.isArray(manifest.links)) {
    manifest.links = manifest.links.map((link) =>
      link?.rel === 'repo' && link.private === undefined ? { ...link, private: isPrivate } : link,
    );
  }

  if (activity) manifest.activity = activity;

  return manifest;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const config = loadConfig(opts.config);
  const version = resolveVersion(config);

  let activity;
  let isPrivate;

  if (opts.activity) {
    const slug = resolveRepoSlug(opts.repo, config);
    if (!slug) {
      const message = 'No he podido determinar el repositorio de GitHub (usa --repo owner/nombre).';
      if (opts.requireActivity) fail(message);
      warn(`${message} El manifiesto saldrá sin métricas.`);
    } else {
      try {
        ({ activity, isPrivate } = await fetchActivity(slug));
      } catch (error) {
        const message = `No he podido leer las métricas de ${slug}: ${error.message}`;
        if (opts.requireActivity) fail(message);
        warn(`${message}. El manifiesto saldrá sin activity (la tarjeta no se rompe).`);
      }
    }
  }

  const manifest = buildManifest(config, { version, activity, isPrivate });

  const errors = validate(manifest);
  if (errors.length > 0) {
    console.error('✖ El manifiesto no cumple el contrato del catálogo:');
    for (const error of errors) console.error(`  · ${error}`);
    process.exit(1);
  }

  const target = resolve(opts.out, ...MANIFEST_PATH);

  if (opts.check) {
    console.log(`✔ Manifiesto válido (${manifest.id} ${manifest.version ?? 'sin versión'}). No se ha escrito nada.`);
    return;
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const metrics = manifest.activity ? 'con métricas' : 'sin métricas';
  console.log(`✔ ${join(opts.out, ...MANIFEST_PATH)} generado ${metrics}.`);
}

main().catch((error) => fail(error.stack ?? String(error)));
