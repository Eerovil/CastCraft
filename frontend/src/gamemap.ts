// @ts-ignore
import Entity from './apiTypes'
import { EntityMap } from './moreTypes'

class MapDrawer {
    entities: EntityMap
    canvas: HTMLCanvasElement
    preloadedImages: { [key: string]: HTMLImageElement }
    animationIndex: number = 0

    constructor(globalEntityMap: EntityMap, canvas: HTMLCanvasElement) {
        this.entities = globalEntityMap
        this.canvas = canvas
        this.preloadedImages = {}
    }


    redrawAllEntities() {
        const canvas = this.canvas;
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            return
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const promises: Promise<void>[] = []
        for (const entity of Object.values(this.entities)) {
            promises.push(this.drawEntity(entity))
        }
        Promise.all(promises).then(() => {
            window.requestAnimationFrame(() => {
                setTimeout(() => {
                    this.animationIndex += 1
                    this.redrawAllEntities()
                }, 100)
            })
        })
    }
    async getImg(url: string) {
        if (this.preloadedImages[url]) {
            return this.preloadedImages[url]
        }
        const img = new Image()
        img.src = url
        await new Promise((resolve, reject) => {
            img.onload = () => {
                resolve(null)
            }
        })
        this.preloadedImages[url] = img
        return img
    }
    async drawEntity(entity: Entity) {
        const canvas = this.canvas;
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            return
        }
        // Draw sprite entity.url at entity.x and entity.y
        // ...
        const sprites = entity.sprites[this.animationIndex % entity.sprites.length] || [];
        for (const sprite of sprites) {
            const img = await this.getImg(sprite.url)
            ctx.drawImage(img, sprite.x, sprite.y, sprite.width, sprite.height, entity.x + 100, entity.y + 200, entity.width, entity.height);
        }
    }
}


export function drawGameMap(canvas: HTMLCanvasElement, globalEntityMap: EntityMap) {
    const mapDrawer = new MapDrawer(globalEntityMap, canvas)
    mapDrawer.redrawAllEntities()
}
