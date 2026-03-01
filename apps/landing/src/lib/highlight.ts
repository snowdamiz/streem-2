export function highlight(raw: string): string {
  // 1. Escape HTML special chars
  let s = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 2. Replace tokens in priority order using a single combined regex.
  // Branches: comment | string (template/single/double) | keyword | fn call | number
  // The backtick pattern uses \x60 to avoid TypeScript template-literal syntax conflict.
  s = s.replace(
    /(\/\/[^\n]*)|(\x60[^\x60]*\x60|'[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*")|(\b(?:const|let|var|import|export|return|function|class|from|of|as|if|else|new|await|async|type|interface|default|null|undefined|true|false|void)\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b(?=\s*\())|(\b\d+(?:\.\d+)?\b)/g,
    (_match, comment, str, kw, fn, num) => {
      if (comment !== undefined) return `<span style="color:var(--color-token-comment)">${comment}</span>`
      if (str !== undefined) return `<span style="color:var(--color-token-string)">${str}</span>`
      if (kw !== undefined) return `<span style="color:var(--color-token-keyword)">${kw}</span>`
      if (fn !== undefined) return `<span style="color:var(--color-token-fn)">${fn}</span>`
      if (num !== undefined) return `<span style="color:var(--color-token-number)">${num}</span>`
      return _match
    }
  )

  return s
}
