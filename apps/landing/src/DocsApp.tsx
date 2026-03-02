import './styles/global.css'
import { signal, effect, onCleanup, Show } from 'streem'
import {
  GettingStartedIcon, SignalsIcon, ComponentsIcon, StreamsIcon,
  LitInteropIcon, PatternsIcon, StylingIcon, TypeScriptIcon, PerformanceIcon,
} from './icons'
import { GettingStartedSection } from './docs/GettingStartedSection'
import { SignalsSection } from './docs/SignalsSection'
import { ComponentsSection } from './docs/ComponentsSection'
import { StreamsSection } from './docs/StreamsSection'
import { LitInteropSection } from './docs/LitInteropSection'
import { PatternsSection } from './docs/PatternsSection'
import { StylingSection } from './docs/StylingSection'
import { TypeScriptSection } from './docs/TypeScriptSection'
import { PerformanceSection } from './docs/PerformanceSection'

const NAV_ITEMS = [
  { id: 'getting-started', label: 'Getting started', Icon: GettingStartedIcon },
  { id: 'signals',         label: 'Signals',         Icon: SignalsIcon },
  { id: 'components',      label: 'Components',      Icon: ComponentsIcon },
  { id: 'streams',         label: 'Streams',         Icon: StreamsIcon },
  { id: 'lit-interop',     label: 'Lit interop',     Icon: LitInteropIcon },
  { id: 'patterns',        label: 'Patterns',        Icon: PatternsIcon },
  { id: 'styling',         label: 'Styling',         Icon: StylingIcon },
  { id: 'typescript',      label: 'TypeScript',      Icon: TypeScriptIcon },
  { id: 'performance',     label: 'Performance',     Icon: PerformanceIcon },
]

function getPage(): string {
  const hash = location.hash.slice(1)
  return NAV_ITEMS.some(i => i.id === hash) ? hash : NAV_ITEMS[0].id
}

const currentPage = signal(getPage())

export function DocsApp(): Node {
  const handleHashChange = () => {
    currentPage.set(getPage())
    window.scrollTo(0, 0)
  }
  window.addEventListener('hashchange', handleHashChange)
  onCleanup(() => window.removeEventListener('hashchange', handleHashChange))

  effect(() => {
    const item = NAV_ITEMS.find(i => i.id === currentPage.value)
    document.title = item ? `${item.label} — Streem Docs` : 'Streem Docs'
  })

  return (
    <div class="grid grid-cols-[220px_1fr] min-h-screen max-[700px]:grid-cols-1">
      <nav class="sticky top-0 h-screen overflow-y-auto bg-surface border-r border-border px-5 py-6 flex flex-col max-[700px]:static max-[700px]:h-auto max-[700px]:flex-row max-[700px]:flex-wrap max-[700px]:items-center max-[700px]:gap-2 max-[700px]:overflow-x-auto max-[700px]:px-4 max-[700px]:py-3 max-[700px]:border-r-0 max-[700px]:border-b max-[700px]:border-border">
        <div class="mb-2 max-[700px]:mb-0">
          <a href="../" class="flex items-center gap-1.5 mb-7 no-underline max-[700px]:flex-shrink-0 max-[700px]:mb-0">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Streem" class="h-7 w-auto block" />
            <span class="text-[15px] text-muted mx-0.5">/</span>
            <span class="text-[15px] text-muted">Docs</span>
          </a>
        </div>
        <ul class="list-none flex flex-col gap-1 max-[700px]:flex-row max-[700px]:flex-wrap max-[700px]:gap-x-2 max-[700px]:gap-y-1">
          {NAV_ITEMS.map(item => (
            <li>
              <a
                href={`#${item.id}`}
                class={() => [
                  'flex items-center gap-2 px-2.5 py-1.5 rounded text-sm transition-all no-underline',
                  currentPage.value === item.id
                    ? 'text-text bg-white/8'
                    : 'text-muted hover:text-text hover:bg-white/5',
                ].join(' ')}
              >
                <item.Icon />{item.label}
              </a>
            </li>
          ))}
        </ul>
        <div class="mt-auto pt-4 text-xs text-muted opacity-50">v0.1.0</div>
      </nav>

      <main class="overflow-y-auto p-12 max-[700px]:p-4 min-w-0">
        <div class="max-w-[760px] mx-auto">
          <Show when={() => currentPage.value === 'getting-started'}>{() => GettingStartedSection()}</Show>
          <Show when={() => currentPage.value === 'signals'}>{() => SignalsSection()}</Show>
          <Show when={() => currentPage.value === 'components'}>{() => ComponentsSection()}</Show>
          <Show when={() => currentPage.value === 'streams'}>{() => StreamsSection()}</Show>
          <Show when={() => currentPage.value === 'lit-interop'}>{() => LitInteropSection()}</Show>
          <Show when={() => currentPage.value === 'patterns'}>{() => PatternsSection()}</Show>
          <Show when={() => currentPage.value === 'styling'}>{() => StylingSection()}</Show>
          <Show when={() => currentPage.value === 'typescript'}>{() => TypeScriptSection()}</Show>
          <Show when={() => currentPage.value === 'performance'}>{() => PerformanceSection()}</Show>
        </div>
      </main>
    </div>
  ) as unknown as Node
}
