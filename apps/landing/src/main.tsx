// MUST be first import — sets Shoelace base path before any component self-registers
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
setBasePath('./shoelace_assets')

import '@shoelace-style/shoelace/dist/themes/dark.css'
import './styles/global.css'
import { render } from 'streeem'
import { App } from './App'

render(App, document.getElementById('app')!)
