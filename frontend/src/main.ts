import './style.css' // @ts-ignore
import { drawGameMap } from './gamemap.ts'  // @ts-ignore
import { initNetwork } from './socketUtils.ts'
import { BackgroundTileMap, EntityMap } from './moreTypes'
import { startTouchInput } from './touchInput'
import { initializeInventory } from './inventory.ts'
import { Item } from './apiTypes.ts'
import * as Sentry from "@sentry/browser";
import { initializeTopBar } from './topBar.ts'
import './polyfills.ts'
import { Application } from 'pixi.js'
import * as PIXI from 'pixi.js';


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

if(typeof console === "undefined"){
  (console as any) = {};
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="main-container">
    <div id="touch-element"></div>
    <div id="inventory"></div>
    <div id="top-bar"></div>
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

  PIXI.settings.SCALE_MODE = isMobile ? PIXI.SCALE_MODES.NEAREST : PIXI.SCALE_MODES.LINEAR
  const pixiApp = new Application({
    // resizeTo: window,
  });
  pixiApp.ticker.minFPS = 25;
  pixiApp.ticker.maxFPS = 30;
  document.querySelector<HTMLCanvasElement>('#main-container')!.insertBefore(
    pixiApp.view as unknown as Node,
    document.querySelector<HTMLDivElement>('#touch-element')!,
  )

  let nickname: string = parseQueryParams()['nickname']

  if (!nickname && isMobile) {
    nickname = prompt('Kirjoita nimesi') || 'Anonymous'
  } else if (!isMobile) {
    nickname = 'TV'
    document.querySelector('#top-bar')!.remove()
  }
  setQueryParam('nickname', nickname);
  (window as any).nickname = nickname

  let backgroundTileMap: BackgroundTileMap;
  let mapSize: number[];
  const socketHandler = await initNetwork({
    entities: globalEntityMap,
    fullDumpCallback: (data) => {
      backgroundTileMap = data.background
      mapSize = data.mapSize
    },
    nickname: nickname,
  })

  await new Promise((resolve) => {
    const mapSizeIsSet = () => {
      if (mapSize) {
        resolve(null)
      } else {
        setTimeout(mapSizeIsSet, 100)
      }
    }
    mapSizeIsSet()
  })
  mapSize = mapSize!
  backgroundTileMap = backgroundTileMap!

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
  // @ts-ignore
  const gameMap = drawGameMap(pixiApp, globalEntityMap, playerId, mapSize)
  // gameMap.setBackground(backgroundTileMap,)
  const touchElement = document.querySelector<HTMLDivElement>('#touch-element')!
  const touchCallbacks = {
    tapNextToPlayer: (direction: number) => {
      console.log('tapNextToPlayer', direction)
      socketHandler.movePlayer(direction)
    },
    tapOnPlayer: () => {
      console.log('tapOnPlayer')
      socketHandler.playerAction()
    }
  }
  startTouchInput(touchElement, touchCallbacks)
  const inventoryEl = document.querySelector<HTMLDivElement>('#inventory')!
  if (playerId) {
    const inventoryCallbacks = {
      selectItem: (item: Item) => {
        console.log('selectItemCallback', item)
        socketHandler.selectItem(item)
      }
    }
    initializeInventory(inventoryEl, globalEntityMap, playerId, inventoryCallbacks)
    const topBarEl = document.querySelector<HTMLDivElement>('#top-bar')!
    initializeTopBar(topBarEl);
  } else {
    inventoryEl.remove()
  }
}

main()
