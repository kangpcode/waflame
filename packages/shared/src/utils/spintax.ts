/**
 * Parses and resolves spintax formatted text, e.g. {Halo|Hai|Selamat pagi}
 * Supports nested spintax.
 */
export function parseSpintax(text: string): string {
  const spintaxRegex = /\{([^{}]+)\}/;
  let result = text;

  while (spintaxRegex.test(result)) {
    result = result.replace(spintaxRegex, (_, choices) => {
      const options = choices.split('|');
      const randomIndex = Math.floor(Math.random() * options.length);
      return options[randomIndex];
    });
  }

  return result;
}

/**
 * Replaces placeholders like {{nama}}, {{email}} with actual recipient values.
 */
export function replaceVariables(text: string, variables: Record<string, string | number>): string {
  let result = text;
  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    result = result.replace(regex, String(val ?? ''));
  }
  return result;
}
