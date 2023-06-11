import './style.css' // @ts-ignore
import { drawGameMap } from './gamemap.ts'  // @ts-ignore
import { initNetwork } from './socketUtils.ts'
import { EntityMap } from './moreTypes'
import { startTouchInput } from './touchInput'
import { initializeInventory } from './inventory.ts'
import { Item } from './apiTypes.ts'
import * as Sentry from "@sentry/browser";


Sentry.init({
  dsn: "https://632d9591067c4f76a1a51e42ec9b75e5@o4505339492433920.ingest.sentry.io/4505339494989824",
  integrations: [
    new Sentry.BrowserTracing({
      // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ["localhost", /^https:\/\/ahdintie.duckdns\.org\/castcraft/],
    }),
    new Sentry.Replay(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

myUndefinedFunction();


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <canvas id="game-map"></canvas>
    <div id="touch-element"></div>
    <div id="inventory"></div>
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
  (window as any).spritesDrawn = 0
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

  let playerId: string | null = null;
  if (isMobile) {
    for (const entity of Object.values(globalEntityMap)) {
        if (entity.nickname === nickname) {
          playerId = entity.id
            break
        }
    }
  }

  console.log('main: ', globalEntityMap)
  const canvas = document.querySelector<HTMLCanvasElement>('#game-map')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  drawGameMap(canvas, globalEntityMap, playerId)
  const touchElement = document.querySelector<HTMLDivElement>('#touch-element')!
  const touchCallbacks = {
    tapNextToPlayer: (direction: number) => {
      console.log('tapNextToPlayer', direction)
      socketHandler.movePlayer(direction)
    }
  }
  startTouchInput(touchElement, touchCallbacks)
  if (playerId) {
    const inventoryCallbacks = {
      selectItem: (item: Item) => {
        console.log('selectItemCallback', item)
        socketHandler.selectItem(item)
      }
    }
    const inventoryEl = document.querySelector<HTMLDivElement>('#inventory')!
    initializeInventory(inventoryEl, globalEntityMap, playerId, inventoryCallbacks)
  }
}

main()
