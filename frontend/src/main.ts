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


function parseQueryParams() {
  const params = new URLSearchParams(window.location.search)
  const ret: { [key: string]: string } = {}
  for (const [key, value] of params.entries()) {
    ret[key] = value
  }
  return ret
}

function setQueryParam(key: string, value: string) {
  const url = new URL(window.location.href)
  url.searchParams.set(key, value)
  window.history.replaceState({}, '', url.toString())
}

async function main() {
  const globalEntityMap: EntityMap = {}
  const isMobile = window.innerWidth < 600

  let nickname: string = parseQueryParams()['nickname']

  if (!nickname && isMobile) {
    nickname = prompt('Kirjoita nimesi') || 'Anonymous'
  } else if (!isMobile) {
    nickname = 'TV'
  }
  setQueryParam('nickname', nickname);
  (window as any).nickname = nickname

  const socketHandler = await initNetwork({
    entities: globalEntityMap,
    nickname: nickname,
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
