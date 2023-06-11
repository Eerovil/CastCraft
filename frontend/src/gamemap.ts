// @ts-ignore
import Entity from './apiTypes'
import { getImg } from './imgUtils'
import { BackgroundTileMap, EntityMap } from './moreTypes'
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
    frameTime: number = 0

    mapSize: number[] = [0, 0, 0, 0]
    backgroundImage: HTMLImageElement | null = null
    backgroundTileMap: BackgroundTileMap | null = null

    constructor(globalEntityMap: EntityMap, canvas: HTMLCanvasElement, playerId: string | null, mapSize: number[]) {
        this.entities = globalEntityMap
        this.mapSize = mapSize
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
            this.playerId = playerId;
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
        this.drawBackground()
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
            setTimeout(() => {
                window.requestAnimationFrame(() => {
                    this.animationIndex += 1
                    this.redrawAllEntities()
                })
            }, 40)
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
                let percent = timeSpent / actionFullTime;
                if (percent > 1) {
                    percent = 1;
                }
                if (percent < 0) {
                    percent = 0;
                }
                if (percent != Infinity) {
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

        if (this.playerId) {
            // If x and y are not visible, don't draw them
            if (x < -50 || x > window.innerWidth + 50) {
                return
            }
            if (y < -50 || y > window.innerHeight + 50) {
                return
            }
        }

        for (const sprite of sprites) {
            const img = await getImg(sprite.url)
            try {
                ctx.drawImage(
                    img,
                    sprite.x, sprite.y, sprite.width, sprite.height,
                    x + entity.x_offset, y + entity.y_offset, entity.width, entity.height
                );
            } catch (e) {
                console.error(e)
            }
            (window as any).spritesDrawn += 1
        }
        // Draw a dot at the x/y of the entity
        ctx.fillStyle = 'red'
        ctx.font = '4px Arial'
        ctx.fillText(entity.id, x, y)
        if (entity.nickname) {
            ctx.fillStyle = 'black'
            ctx.font = '10px Arial'
            ctx.fillText(entity.nickname, x, y - 10)
        }
    }

    setBackground(backgroundTileMap: BackgroundTileMap) {
        this.backgroundTileMap = backgroundTileMap
        this.rebuildBackground();
    }

    async rebuildBackground() {
        if (!this.canvas || !this.backgroundTileMap) {
            return
        }
        const invisibleCanvas = document.createElement('canvas')
        invisibleCanvas.width = this.mapSize[2] - this.mapSize[0]
        invisibleCanvas.height = this.mapSize[3] - this.mapSize[1]
        const ctx = invisibleCanvas.getContext('2d')
        if (!ctx) {
            return
        }
        
        const originX = this.mapSize[0], originY = this.mapSize[1]
        const maxX = this.mapSize[2], maxY = this.mapSize[3]

        ctx.clearRect(originX, originY, maxX, maxY)

        let x = originX;
        let y = originY;

        while (x <= maxX) {
            // Draw vertical line
            ctx.beginPath();
            ctx.moveTo(x, -3000);
            ctx.lineTo(x, 3000);
            ctx.stroke();
            x += 32;
        }

        while (y <= maxY) {
            ctx.beginPath();
            ctx.moveTo(-3000, y);
            ctx.lineTo(3000, y);
            ctx.stroke();
            y += 32;
        }

        // Save the background canvas as this.backgroundImage (image objects)
        const backgroundImage = new Image()
        backgroundImage.src = invisibleCanvas.toDataURL()
        await new Promise((resolve) => {
            backgroundImage.onerror = () => {
                resolve(null)
            }
            backgroundImage.onload = () => {
                backgroundImage.decode().then(() => {
                    this.backgroundImage = backgroundImage
                    resolve(null)
                }).catch((e) => {
                    console.error(e)
                    resolve(null)
                });
            }
        })
        this.backgroundImage = backgroundImage
    }

    drawBackground() {
        if (!this.canvas || !this.backgroundImage) {
            return
        }
        const ctx = this.canvas.getContext('2d')
        if (!ctx) {
            return
        }
        const { x, y } = this.convertCoordinates(0, 0)

        ctx.drawImage(this.backgroundImage, x, y)
    }
}


export function drawGameMap(canvas: HTMLCanvasElement, globalEntityMap: EntityMap, playerId: string | null, mapSize: number[]) {
    const mapDrawer = new MapDrawer(globalEntityMap, canvas, playerId, mapSize)
    mapDrawer.redrawAllEntities();
    (window as any).mapDrawer = mapDrawer;
    return mapDrawer;
}
