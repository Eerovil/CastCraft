import './style.css' // @ts-ignore
import { drawGameMap } from './gamemap.ts'  // @ts-ignore
import { initNetwork } from './socketUtils.ts'
import { EntityMap } from './moreTypes'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="game-map"></canvas>
  </div>
`

async function main() {
    const globalEntityMap: EntityMap = {}
    await initNetwork({
        entities: globalEntityMap
    })
    const canvas = document.querySelector<HTMLCanvasElement>('#game-map')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    drawGameMap(canvas, globalEntityMap)
}

main()
