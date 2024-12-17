import { mount } from 'svelte'
import './app.sass'
import './aqua.sass'
import './puzzle.sass'
import './fonts/caveat.sass'
import Launcher from './Launcher.svelte'

const app = mount(Launcher, {
  target: document.getElementById('app')!,
})

export default app
