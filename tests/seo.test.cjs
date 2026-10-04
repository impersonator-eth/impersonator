const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Execute the real TypeScript metadata; isolate the unrelated wallet layout.
function load(file) {
  const filename = path.resolve(__dirname, '..', file);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  }}).outputText;
  const module = { exports: {} };
  const localRequire = (id) => {
    if (id === '@/utils') return load('utils/index.ts');
    if (id === '@/components/layouts/IndexLayout') return { IndexLayout: () => null };
    return require(id);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

test('homepage identifies its canonical HTTPS URL in canonical and Open Graph', () => {
  const { metadata } = load('app/layout.tsx');
  assert.equal(metadata.alternates?.canonical, 'https://www.impersonator.xyz/');
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.equal(metadata.openGraph.siteName, 'Impersonator');
  assert.equal(metadata.robots, 'index, follow');
});

test('homepage uses descriptive, consistent search and social copy', () => {
  const { metadata } = load('app/layout.tsx');
  assert.equal(metadata.title, 'Impersonator | Ethereum Address Impersonation for Dapps');
  assert.equal(metadata.description, 'Explore dapps as any Ethereum address using WalletConnect, an iframe or the browser extension. Inspect wallet views without private keys or signing.');
  assert.equal(metadata.openGraph.title, metadata.title);
  assert.equal(metadata.twitter.title, metadata.title);
  assert.equal(metadata.openGraph.description, metadata.description);
  assert.equal(metadata.twitter.description, metadata.description);
  const image = new URL(metadata.openGraph.images);
  assert.ok(fs.existsSync(path.resolve(__dirname, '../public', image.pathname.slice(1))));
});

test('visible brand renders as the page H1 without changing its text', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Navbar = load('components/Navbar.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Navbar));
  assert.match(html, /<h1\b[^>]*>[\s\S]*?Impersonator[\s\S]*?<\/h1>/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

test('sitemap lists only the canonical public page and robots advertises it', () => {
  const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
  assert.ok(fs.existsSync(sitemapPath), 'public sitemap is missing');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]), ['https://www.impersonator.xyz/']);
  assert.match(sitemap, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
  assert.match(fs.readFileSync(path.resolve(__dirname, '../public/robots.txt'), 'utf8'), /^Sitemap: https:\/\/www.impersonator.xyz\/sitemap.xml$/m);
});
