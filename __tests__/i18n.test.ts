import ca from '../src/i18n/ca';
import es from '../src/i18n/es';
import { createStrings } from '../src/i18n';
import fs from 'fs';
import path from 'path';

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(dir, e.name)] : [],
  );
}

describe('textos', () => {
  test('ca y es tienen exactamente las mismas claves', () => {
    expect(Object.keys(ca).sort()).toEqual(Object.keys(es).sort());
  });

  test('los parámetros {x} coinciden entre idiomas', () => {
    const re = /\{(\w+)\}/g;
    for (const k of Object.keys(ca)) {
      const a = [...ca[k].matchAll(re)].map((m) => m[1]).sort();
      const b = [...es[k].matchAll(re)].map((m) => m[1]).sort();
      expect({ k, p: a }).toEqual({ k, p: b });
    }
  });

  test('toda clave usada con s(\'clave\') existe', () => {
    const files = [...walk(path.join(__dirname, '../src')), ...walk(path.join(__dirname, '../app'))];
    const used = new Set<string>();
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bs\(\s*'([a-z0-9_]+)'/g)) used.add(m[1]);
    }
    const missing = [...used].filter((k) => !(k in ca));
    expect(missing).toEqual([]);
    expect(used.size).toBeGreaterThan(100);
  });

  test('sustituye parámetros y cae a catalán si falta la clave', () => {
    const s = createStrings('es');
    expect(s('hello_name', { name: 'Anna' })).toBe('Hola, Anna');
    expect(s('clave_inexistente')).toBe('clave_inexistente');
    expect(createStrings('ca')('hello_name', { name: 'Anna' })).toBe('Hola, Anna');
  });

  test('formatos de fecha, dinero y duración', () => {
    const s = createStrings('ca');
    expect(s.money(1200)).toMatch(/12/);
    expect(s.money(1250)).toMatch(/12,50/);
    expect(s.duration(45)).toBe('45 min');
    expect(s.duration(60)).toBe('1 h');
    expect(s.duration(75)).toBe('1 h 15 min');
    const now = new Date(2026, 10, 7, 12);
    expect(s.relativeDay(new Date(2026, 10, 7, 20), now)).toBe('Avui');
    expect(s.relativeDay(new Date(2026, 10, 8, 9), now)).toBe('Demà');
  });
});
