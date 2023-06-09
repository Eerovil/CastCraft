// @ts-ignore
import Entity from './apiTypes'
import { EntityMap } from './moreTypes'
import { getCurrentTime } from './timeUtils'

class MapDrawer {
    entities: EntityMap
    canvas: HTMLCanvasElement
    preloadedImages: { [key: string]: HTMLImageElement }
    animationIndex: number = 0

    constructor(globalEntityMap: EntityMap, canvas: HTMLCanvasElement) {
        this.entities = globalEntityMap
        this.canvas = canvas
        this.preloadedImages = {}
        console.log('MapDrawer constructor: ', this.entities)
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
        let x = entity.x
        let y = entity.y
        if ((entity.action || {}).action == 'move' && (entity.x_from != entity.x) || (entity.y_from != entity.y)) {
            // Entity is moving, x is between x_from and x.
            const currentTime = getCurrentTime();
            const actionTimeout = entity.action ? entity.action.timeout : 0;
            const actionFullTime = entity.action ? entity.action.time : 0;

            const timeLeft = actionTimeout - currentTime;
            const timeSpent = actionFullTime - timeLeft;
            const percent = timeSpent / actionFullTime;
            console.log('percent: ', percent)

            const x_from = entity.x_from
            const y_from = entity.y_from
            x = x_from + (entity.x - x_from) * percent;
            y = y_from + (entity.y - y_from) * percent;
        }
        let animationIndex = this.animationIndex
        if (entity.animation_speed == 0) {
            // Only draw the first sprite
            animationIndex = 0
        } else {
            // Draw the sprite at the current animation frame
            animationIndex = Math.floor(this.animationIndex / entity.animation_speed)
        }
        const sprites = entity.sprites[animationIndex % entity.sprites.length] || [];

        for (const sprite of sprites) {
            const img = await this.getImg(sprite.url)
            ctx.drawImage(img, sprite.x, sprite.y, sprite.width, sprite.height, x + 100, y + 200, entity.width, entity.height);
        }
    }
}


export function drawGameMap(canvas: HTMLCanvasElement, globalEntityMap: EntityMap) {
    const mapDrawer = new MapDrawer(globalEntityMap, canvas)
    mapDrawer.redrawAllEntities()
}
