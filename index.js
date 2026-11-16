import { appendFileSync } from 'node:fs';

const payloadRaw = process.env.INPUT_PAYLOAD;
const outputPath = process.env.GITHUB_OUTPUT;

function canonical(value) {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return `s:${JSON.stringify(value)}`;
  if (t === 'number') return `n:${Object.is(value, -0) ? '-0' : String(value)}`;
  if (t === 'boolean') return `b:${value ? '1' : '0'}`;
  if (Array.isArray(value)) {
    let out = 'a:[';
    for (let i = 0; i < value.length; i++) {
      if (i) out += ',';
      out += canonical(value[i]);
    }
    return out + ']';
  }
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    let out = 'o:{';
    for (let i = 0; i < keys.length; i++) {
      if (i) out += ',';
      const k = keys[i];
      out += `${JSON.stringify(k)}:${canonical(value[k])}`;
    }
    return out + '}';
  }
  throw new Error('Invalid input');
}

try {
  if (typeof payloadRaw !== 'string') throw new Error('Invalid input');
  if (typeof outputPath !== 'string' || outputPath.length === 0) throw new Error('Invalid input');

  const parsed = JSON.parse(payloadRaw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid input');
  if (!Object.prototype.hasOwnProperty.call(parsed, 'values')) throw new Error('Invalid input');

  const values = parsed.values;
  if (!Array.isArray(values)) throw new Error('Invalid input');

  const seen = new Set();
  const unique = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const c = canonical(v);
    if (!seen.has(c)) {
      seen.add(c);
      unique.push(v);
    }
  }

  const result = { unique, removed: values.length - unique.length };
  appendFileSync(outputPath, `result=${JSON.stringify(result)}\n`);
} catch {
  throw new Error('Invalid input');
}