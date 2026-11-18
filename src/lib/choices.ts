// Easy mode: the right answer plus three wrong ones from the same topic
// (so a console is always confused with other consoles, not with a dog).

/** Returns up to `count` shuffled options that include `answer`. */
export function pickChoices(
  answer: string,
  sameTopic: string[],
  backup: string[] = [],
  count = 4,
  rand: () => number = Math.random,
): string[] {
  const seen = new Set([answer.toLowerCase()]);
  const wrong: string[] = [];
  for (const pool of [sameTopic, backup]) {
    for (const a of shuffled(pool, rand)) {
      if (wrong.length >= count - 1) break;
      const k = a.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      wrong.push(a);
    }
  }
  return shuffled([answer, ...wrong], rand);
}

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
