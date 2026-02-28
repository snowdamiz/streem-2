import { Hero } from './components/Hero'
import { TickerDemo } from './components/TickerDemo'
import { Features } from './components/Features'
import { CodeSample } from './components/CodeSample'
import { InstallCta } from './components/InstallCta'

export function App() {
  return (
    <div>
      <Hero />
      <TickerDemo />
      <Features />
      <CodeSample />
      <InstallCta />
    </div>
  )
}
