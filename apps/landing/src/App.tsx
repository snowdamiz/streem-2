import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { StatsBar } from './components/StatsBar'
import { Features } from './components/Features'
import { TickerDemo } from './components/TickerDemo'
import { BenchmarkChart } from './components/BenchmarkChart'
import { CodeSample } from './components/CodeSample'
import { InstallCta } from './components/InstallCta'
import { Footer } from './components/Footer'

export function App() {
  return (
    <div>
      <Nav />
      <Hero />
      <StatsBar />
      <Features />
      <TickerDemo />
      <BenchmarkChart />
      <CodeSample />
      <InstallCta />
      <Footer />
    </div>
  )
}
