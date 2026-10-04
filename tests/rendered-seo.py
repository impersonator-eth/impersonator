"""Verify real Next production responses without loading wallet JavaScript.
Run after pnpm build: python3 tests/rendered-seo.py
Uses an OS-assigned loopback port; always stops its own server.
"""
import socket
import subprocess
import time
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from html.parser import HTMLParser


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.meta = {}
        self.robots = []
        self.canonical = []
        self.h1_count = 0
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            self.meta[attrs.get('property', attrs.get('name'))] = attrs.get('content')
            if attrs.get('name') == 'robots':
                self.robots.append(attrs.get('content'))
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs.get('href'))
        if tag == 'h1':
            self.h1_count += 1


with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
server = subprocess.Popen(['node', 'node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', str(port)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
base = f'http://127.0.0.1:{port}'
try:
    for attempt in range(100):
        try:
            urllib.request.urlopen(base, timeout=2).close()
            break
        except (urllib.error.URLError, TimeoutError):
            if server.poll() is not None:
                raise RuntimeError('Next server exited before readiness')
            time.sleep(0.1)
    else:
        raise RuntimeError('Next server did not become ready')
    canonical = 'https://www.impersonator.xyz/'
    for route in ['/', '/?address=0x0000000000000000000000000000000000000000&chain=ethereum']:
        with urllib.request.urlopen(base + route) as response:
            assert response.status == 200
            html = response.read().decode()
        page = Page(html)
        assert page.canonical == [canonical]
        assert page.h1_count == 1
        assert page.meta['og:url'] == canonical
        assert page.meta['og:site_name'] == 'Impersonator'
        assert page.meta['og:type'] == 'website'
        assert page.meta['robots'] == 'index, follow'
        assert page.meta['description'] == page.meta['og:description'] == page.meta['twitter:description']
        title = 'Impersonator | Ethereum Address Impersonation for Dapps'
        assert f'<title>{title}</title>' in html
        assert page.meta['og:title'] == page.meta['twitter:title'] == title
        assert page.meta['og:image'] == page.meta['twitter:image'] == canonical + 'metaIMG.PNG'
        print('PASS rendered metadata/H1/canonical', route)
    with urllib.request.urlopen(base + '/metaIMG.PNG') as response:
        assert response.status == 200
        assert response.headers['Content-Type'].startswith('image/png')
        print('PASS social image HTTP 200 image/png')
    with urllib.request.urlopen(base + '/sitemap.xml') as response:
        root = ET.fromstring(response.read())
        assert [node.text for node in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')] == [canonical]
        print('PASS sitemap HTTP 200 canonical root only')
    with urllib.request.urlopen(base + '/robots.txt') as response:
        assert 'Sitemap: ' + canonical + 'sitemap.xml' in response.read().decode()
        print('PASS robots HTTP 200 sitemap discovery')
    try:
        urllib.request.urlopen(base + '/seo-does-not-exist')
        raise AssertionError('unknown route must remain 404')
    except urllib.error.HTTPError as error:
        assert error.code == 404
        robots = Page(error.read().decode()).robots
        assert any('noindex' in directive for directive in robots)
        print('PASS unknown route 404/noindex preserved; robots tags:', robots)
finally:
    server.terminate()
    server.wait(timeout=15)
