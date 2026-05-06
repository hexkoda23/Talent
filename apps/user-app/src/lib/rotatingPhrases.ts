export const rotatingPhrases = [
  (name: string) => `${name}, lock in.`,
  (name: string) => `Welcome back, ${name}.`,
  (name: string) => `Let's ship something today, ${name}.`,
  (name: string) => `${name}, one module at a time.`,
  (name: string) => `Steady streaks win, ${name}.`,
  (name: string) => `${name}, code, audit, repeat.`,
  (name: string) => `Eyes up, ${name}. Quest ahead.`,
  (name: string) => `${name}, your rank is watching.`,
  (name: string) => `Progress over perfection, ${name}.`,
  (name: string) => `${name}, the module is the unlock.`,
];

export const pickPhrase = (name: string, intervalMs = 12000) => {
  const slot = Math.floor(Date.now() / intervalMs) % rotatingPhrases.length;
  return rotatingPhrases[slot](name);
};
