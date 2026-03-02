import { highlight } from '../lib/highlight'

export function DocSection({ id, title, children }: { id: string; title: string; children: unknown }) {
  return (
    <section id={id} class="mb-15 pt-4">
      <h2 class="text-2xl font-semibold mb-4 text-text">{title}</h2>
      {children}
    </section>
  ) as unknown as Node
}

export function Code({ children }: { children: string }) {
  const pre = document.createElement('pre')
  // 'pre' is already styled via @layer base in global.css — no extra class needed
  const code = document.createElement('code')
  code.innerHTML = highlight(children)
  pre.appendChild(code)
  return pre
}
