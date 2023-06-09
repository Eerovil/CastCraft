// @ts-ignore
import Entity from './apiTypes'
import { EntityMap } from './moreTypes'
import { getCurrentTime } from './timeUtils'

class MapDrawer {
    entities: EntityMap
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D;
    preloadedImages: { [key: string]: HTMLImageElement }
    animationIndex: number = 0
    playerId: string | null = null
    playerX: number = 0
    playerY: number = 0

    constructor(globalEntityMap: EntityMap, canvas: HTMLCanvasElement) {
        this.entities = globalEntityMap
        this.canvas = canvas
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        this.preloadedImages = {}
        console.log('MapDrawer constructor: ', this.entities)
        const isMobile = window.innerWidth < 600
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            throw new Error('Could not get canvas context')
        }
        this.ctx = ctx
        if (isMobile) {
            this.playerId = "0"  // Testing
            const player = this.entities[this.playerId]
            if (!player) {
                throw new Error('Could not find player')
            }
            this.playerX = player.x
            this.playerY = player.y
            // Center on player
            // Origin is at player x minus half of screen width
            // and player y minus half of screen height
            ctx.translate(
                player.x - (window.innerWidth / 2),
                player.y - (window.innerHeight / 2)
            )
            ctx.scale(3, 3)
            console.log('isMobile', player.x, player.y)
        }
    }

    redrawAllEntities() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const promises: Promise<void>[] = []
        for (const entity of Object.values(this.entities)) {
            promises.push(this.drawEntity(ctx, entity))
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

    convertCoordinates(x: number, y: number) {
        // If playerId is set, center on player
        // so if player is at 50,50 and this function is called with 0,0
        // it should return -50,-50
        if (!this.playerId) {
            return { x, y }
        }
        const player = this.entities[this.playerId]
        if (!player) {
            return { x, y }
        }
        return {
            x: x - this.playerX,
            y: y - this.playerY,
        }
    }

    async getImg(url: string) {
        if (this.preloadedImages[url]) {
            return this.preloadedImages[url]
        }
        const img = new Image()
        img.src = url
        await new Promise((resolve) => {
            img.onload = () => {
                resolve(null)
            }
        })
        this.preloadedImages[url] = img
        return img
    }
    async drawEntity(ctx: CanvasRenderingContext2D, entity: Entity) {
        // Draw sprite entity.url at entity.x and entity.y
        // ...
        let x = entity.x
        let y = entity.y
        if ((entity.action || {}).action == 'move' && (entity.x_from != entity.x) || (entity.y_from != entity.y)) {
            // Entity is moving, x is between x_from and x.
            const currentTime = getCurrentTime();
            const actionTimeout = entity.action ? entity.action.timeout : 0;
            const actionFullTime = entity.action ? entity.action.time : 0;

            if (actionFullTime > 0) {
                const timeLeft = actionTimeout - currentTime;
                const timeSpent = actionFullTime - timeLeft;
                const percent = timeSpent / actionFullTime;
                if (percent != Infinity) {
                    console.log('percent: ', percent)
                    const x_from = entity.x_from
                    const y_from = entity.y_from
                    x = x_from + (entity.x - x_from) * percent;
                    y = y_from + (entity.y - y_from) * percent;
                }
            }
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

        if (entity.id == this.playerId) {
            this.playerX = x
            this.playerY = y
        }

        const newCoords = this.convertCoordinates(x, y)
        x = newCoords.x
        y = newCoords.y

        for (const sprite of sprites) {
            const img = await this.getImg(sprite.url)
            ctx.drawImage(
                img,
                sprite.x, sprite.y, sprite.width, sprite.height,
                x + 100, y + 200, entity.width, entity.height
            );
        }
    }
}


export function drawGameMap(canvas: HTMLCanvasElement, globalEntityMap: EntityMap) {
    const mapDrawer = new MapDrawer(globalEntityMap, canvas)
    mapDrawer.redrawAllEntities()
}
