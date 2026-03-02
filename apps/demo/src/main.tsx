import { render } from '@streeem/dom'
import { App } from './App.js'

const app = document.getElementById('app')!
let dispose = render(() => <App />, app)

// HMR boundary: when App.tsx changes, dispose the old render tree and
// re-mount the new App. Signal state is saved/restored in App.tsx itself.
if (import.meta.hot) {
  import.meta.hot.accept('./App.js', (newModule) => {
    dispose()
    app.innerHTML = ''
    const { App: NewApp } = newModule as typeof import('./App.js')
    dispose = render(() => <NewApp />, app)
  })
}
