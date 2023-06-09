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
            // Find our player
            const nickname = (window as any).nickname as string;
            for (const [id, entity] of Object.entries(this.entities)) {
                if (entity.nickname === nickname) {
                    this.playerId = id
                    break
                }
            }
            if (!this.playerId) {
                throw new Error('Could not find player')
            }
            const player = this.entities[this.playerId]
            if (!player) {
                throw new Error('Could not find player')
            }
            this.playerX = player.x
            this.playerY = player.y
            // zoom in to center
            // ctx.scale(2, 2)
            // ctx.translate(canvas.width / 2, canvas.height / 2)
            const scale = 3
            const widthNew = ctx.canvas.width / 2;
            const heightNew = ctx.canvas.height / 2;
            ctx.setTransform(scale, 0, 0, scale, -(scale - 1) * widthNew, -(scale - 1) * heightNew);
            console.log('isMobile', player.x, player.y, this.canvas.width, this.canvas.height)
        }
    }

    redrawAllEntities() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        ctx.clearRect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height * 2)
        const promises: Promise<void>[] = []
        this.drawGrid(ctx)
        const sortedEntities = Object.values(this.entities).sort((a, b) => {
            // Smaller y is drawn first
            if (a.y < b.y) {
                return -1
            }
            if (a.y > b.y) {
                return 1
            }
            return 0;
        })
        for (const entity of sortedEntities) {
            promises.push(this.drawEntity(ctx, entity))
        }
        Promise.all(promises).then(() => {
            window.requestAnimationFrame(() => {
                setTimeout(() => {
                    this.animationIndex += 1
                    this.redrawAllEntities()
                }, 33)  // 30fps = 1000/30 = 33.333
            })
        })
    }

    convertCoordinates(x: number, y: number) {
        // If playerId is set, center on player
        // New origin is at player x - (canvas.width / 2), player y - (canvas.height / 2)
        // So we must subtract that from the coordinates
        if (!this.playerId) {
            return { x, y }
        }
        const player = this.entities[this.playerId]
        if (!player) {
            return { x, y }
        }
        return {
            x: x - (this.playerX - (this.canvas.width / 2)) - (32 / 2),
            y: y - (this.playerY - (this.canvas.height / 2)) - 32,
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
    async drawGrid(ctx: CanvasRenderingContext2D) {
        // Draw a 32*32 grid starting at 0,0 to all directions

        const { x: originX, y: originY } = this.convertCoordinates(0, 0)

        let x = originX - (32 * 100);
        let y = originY - (32 * 100);

        while (x < originX + (32 * 100)) {
            // Draw vertical line
            ctx.beginPath();
            ctx.moveTo(x, -1000);
            ctx.lineTo(x, 1000);
            ctx.stroke();
            x += 32;
        }

        while (y < originY + (32 * 100)) {
            ctx.beginPath();
            ctx.moveTo(-1000, y);
            ctx.lineTo(1000, y);
            ctx.stroke();
            y += 32;
        }
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
                x - (32 / 2), y - 32 - 2, entity.width, entity.height
            );
            // Draw a dot at the x/y of the entity
            ctx.fillStyle = 'red'
            ctx.fillRect(x, y, 1, 1)

        }
    }
}


export function drawGameMap(canvas: HTMLCanvasElement, globalEntityMap: EntityMap) {
    const mapDrawer = new MapDrawer(globalEntityMap, canvas)
    mapDrawer.redrawAllEntities();
    (window as any).mapDrawer = mapDrawer;
}
