import { render } from '@streem/dom'
import { App } from './App.js'

const app = document.getElementById('app')!
render(() => <App />, app)
