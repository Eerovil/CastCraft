import './style.css' // @ts-ignore
import { drawGameMap } from './gamemap.ts'  // @ts-ignore
import { initNetwork } from './socketUtils.ts'
import { EntityMap } from './moreTypes'
import { startTouchInput } from './touchInput'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="game-map"></canvas>
    <div id="touch-element"></div>
  </div>
`

async function main() {
    const globalEntityMap: EntityMap = {}
    const socketHandler = await initNetwork({
        entities: globalEntityMap
    })
    console.log('main: ', globalEntityMap)
    const canvas = document.querySelector<HTMLCanvasElement>('#game-map')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    drawGameMap(canvas, globalEntityMap)
    const touchElement = document.querySelector<HTMLDivElement>('#touch-element')!
    const touchCallbacks = {
        tapNextToPlayer: (direction: number) => {
            console.log('tapNextToPlayer', direction)
            socketHandler.movePlayer(direction)
        }
    }
    startTouchInput(touchElement, touchCallbacks)
}

main()
