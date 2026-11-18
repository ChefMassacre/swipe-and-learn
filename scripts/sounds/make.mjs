// Generates the app's small UI sounds as WAV files in assets/sounds.
// They are synthesised here (soft sine tones), so there is nothing to license.
// Run: node scripts/sounds/make.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../assets/sounds');
mkdirSync(OUT, { recursive: true });

const hz = (note) => 440 * 2 ** ((note - 69) / 12); // MIDI note → Hz

/** A soft bell-like tone: sine plus a quiet octave, quick attack, smooth decay. */
function tone(buf, startS, freq, durS, gain) {
  const s0 = Math.floor(startS * RATE);
  const n = Math.floor(durS * RATE);
  for (let i = 0; i < n && s0 + i < buf.length; i++) {
    const t = i / RATE;
    const attack = Math.min(1, t / 0.006);
    const decay = Math.exp((-5 * t) / durS);
    const v = Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(4 * Math.PI * freq * t);
    buf[s0 + i] += v * attack * decay * gain;
  }
}

/** A short filtered noise burst, like a card being flicked. */
function tick(buf, startS, durS, gain, smooth) {
  const s0 = Math.floor(startS * RATE);
  const n = Math.floor(durS * RATE);
  let last = 0;
  let seed = 7;
  for (let i = 0; i < n; i++) {
    seed = (seed * 16807) % 2147483647;
    const white = (seed / 2147483647) * 2 - 1;
    last = last + smooth * (white - last);
    const env = Math.sin((Math.PI * i) / n) ** 2;
    buf[s0 + i] += last * env * gain;
  }
}

function wav(name, lengthS, draw) {
  const buf = new Float32Array(Math.ceil(lengthS * RATE));
  draw(buf);
  // Fade the last 10 ms so nothing clicks.
  const fade = Math.floor(0.01 * RATE);
  for (let i = 0; i < fade; i++) buf[buf.length - 1 - i] *= i / fade;
  const data = Buffer.alloc(buf.length * 2);
  buf.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(join(OUT, `${name}.wav`), Buffer.concat([h, data]));
  console.log(`${name}.wav`);
}

wav('flip', 0.08, (b) => tick(b, 0, 0.06, 0.35, 0.25));
wav('knew', 0.32, (b) => { tone(b, 0, hz(76), 0.18, 0.22); tone(b, 0.07, hz(83), 0.25, 0.2); });
wav('learn', 0.22, (b) => tone(b, 0, hz(69), 0.2, 0.2));
wav('skip', 0.12, (b) => tick(b, 0, 0.1, 0.25, 0.08));
wav('wrong', 0.3, (b) => { tone(b, 0, hz(64), 0.14, 0.18); tone(b, 0.1, hz(60), 0.2, 0.18); });
wav('combo', 0.3, (b) => { tone(b, 0, hz(84), 0.12, 0.14); tone(b, 0.06, hz(88), 0.12, 0.14); tone(b, 0.12, hz(91), 0.18, 0.14); });
wav('complete', 0.75, (b) => [72, 76, 79, 84].forEach((n, i) => tone(b, i * 0.09, hz(n), i === 3 ? 0.45 : 0.25, 0.18)));
