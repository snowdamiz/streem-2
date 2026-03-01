export function highlight(raw: string): string {
  // 1. Escape HTML special chars
  let s = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 2. Replace tokens in priority order using a single combined regex.
  // Branches: comment | string (template/single/double) | jsx-tag | arrow | keyword | fn call | number
  // After HTML escaping, < becomes &lt; and > becomes &gt;, so JSX patterns must match those entities.
  // The backtick pattern uses \x60 to avoid TypeScript template-literal syntax conflict.
  s = s.replace(
    /(\/\/[^\n]*|#[^\n]*)|(\x60[^\x60]*\x60|'[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*")|(&lt;\/?)\s*([a-zA-Z_][a-zA-Z0-9_-]*)|(=&gt;)|(\b(?:const|let|var|import|export|return|function|class|from|of|as|if|else|new|await|async|type|interface|default|null|undefined|true|false|void)\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b(?=\s*\())|(\b\d+(?:\.\d+)?\b)/g,
    (_match, comment, str, lt, tagName, arrow, kw, fn, num) => {
      if (comment !== undefined) return `<span style="color:var(--color-token-comment)">${comment}</span>`
      if (str !== undefined) return `<span style="color:var(--color-token-string)">${str}</span>`
      if (lt !== undefined) return `${lt}<span style="color:var(--color-token-fn)">${tagName}</span>`
      if (arrow !== undefined) return `<span style="color:var(--color-token-keyword)">${arrow}</span>`
      if (kw !== undefined) return `<span style="color:var(--color-token-keyword)">${kw}</span>`
      if (fn !== undefined) return `<span style="color:var(--color-token-fn)">${fn}</span>`
      if (num !== undefined) return `<span style="color:var(--color-token-number)">${num}</span>`
      return _match
    }
  )

  return s
}
