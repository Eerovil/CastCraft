// @ts-ignore
import Entity, { Sprite } from './apiTypes'
import { getSpritesAsCanvas } from './drawUtils'
import { getImg } from './imgUtils'
import { BackgroundTileMap, EntityMap } from './moreTypes'
import { getCurrentTime } from './timeUtils'

function sortBy(arr: Array<any>, callback: (item: any) => number) {
    return arr.sort((a: any, b: any) => callback(a) - callback(b))
}

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
        ctx.imageSmoothingEnabled = false;
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

    async redrawAllEntities() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        ctx.clearRect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height * 2)
        const promises: Promise<void>[] = []
        this.drawBackground()
        const sortedEntities = sortBy(
            sortBy(Object.values(this.entities), (entity) => entity.y),
            (entity) => entity.carried_by_entity_id ? 1 : -1,
        )
        if (this.playerId) {
            this.drawTouchAreas()
        }
        for (const entity of sortedEntities) {
            await this.drawEntity(ctx, entity)
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

    drawTouchAreas() {
        const ctx = this.ctx;
        const player = this.entities[this.playerId!]
        if (!player) {
            return
        }
        // Draw a square above, below, left, and right of the player
        const touchAreaSize = 32
        const touchAreaColor = 'rgba(255, 0, 0, 0.5)'

        ctx.fillStyle = touchAreaColor
        const drawRect = (x: number, y: number) => {
            const { x: newX, y: newY } = this.convertCoordinates(x, y)

            ctx.strokeStyle = 'green';
            ctx.lineWidth = 1;
            ctx.strokeRect(newX, newY, touchAreaSize, touchAreaSize);
        }

        let x = player.x
        let y = player.y

        if (player.x_from != undefined && player.y_from != undefined) {
            x = player.x_from
            y = player.y_from
        }

        drawRect(x - touchAreaSize, y)
        drawRect(x + touchAreaSize, y)
        drawRect(x, y - touchAreaSize)
        drawRect(x, y + touchAreaSize)
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
            if (x < -50 || x > window.innerWidth + 50 || y < -50 || y > window.innerHeight + 50) {
                for (const sprite of sprites) {
                    // Still, we need to load the image for later
                    getImg(sprite.url)
                }
                return
            }
        }

        const spritesCanvas = await getSpritesAsCanvas({
            sprites, width: entity.width, height: entity.height
        })
        ctx.drawImage(spritesCanvas, x + entity.x_offset, y + entity.y_offset)

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

        const waterSize = 100 * 32;

        invisibleCanvas.width = this.mapSize[2] + waterSize;
        invisibleCanvas.height = this.mapSize[3] + waterSize;
        const ctx = invisibleCanvas.getContext('2d')
        if (!ctx) {
            return
        }
        ctx.imageSmoothingEnabled = false;

        const originX = 0, originY = 0
        const minX = this.mapSize[0], minY = this.mapSize[1]
        const maxX = this.mapSize[2], maxY = this.mapSize[3]

        ctx.clearRect(originX, originY, maxX, maxY)

        interface TileMap {
            topLeft: Sprite,
            top: Sprite,
            topRight: Sprite,
            left: Sprite,
            center: Sprite,
            right: Sprite,
            bottomLeft: Sprite,
            bottom: Sprite,
            bottomRight: Sprite,
            extra1: Sprite,
            extra2: Sprite,
            extra3: Sprite,
            extra4: Sprite,
            extra5: Sprite,
            extra6: Sprite,
            extra7: Sprite,
            water: Sprite,
        }

        const tileMap: TileMap = this.backgroundTileMap.grass as any;

        const drawSprite = async (x: number, y: number, sprite: Sprite) => {
            ctx.drawImage(
                await getImg(sprite.url),
                sprite.x, sprite.y, sprite.width, sprite.height,
                x, y, 32, 32
            );
        }

        for (let x = originX - waterSize; x < maxX + waterSize; x += 32) {
            for (let y = originY - waterSize; y < maxY + waterSize; y += 32) {
                if (x < minX || x > maxX || y < minY || y > maxY) {
                    // Draw water
                    await drawSprite(x, y, tileMap.water)
                    continue
                }
                if (x == minX) {
                    // Left side
                    if (y == minY) {
                        // Top left
                        await drawSprite(x, y, tileMap.topLeft)
                    } else if (y == maxY) {
                        // Bottom left
                        await drawSprite(x, y, tileMap.bottomLeft)
                    } else {
                        // Left
                        await drawSprite(x, y, tileMap.left)
                    }
                } else if (x == maxX) {
                    // Right side
                    if (y == minY) {
                        // Top right
                        await drawSprite(x, y, tileMap.topRight)
                    } else if (y == maxY) {
                        // Bottom right
                        await drawSprite(x, y, tileMap.bottomRight)
                    } else {
                        // Right
                        await drawSprite(x, y, tileMap.right)
                    }
                } else if (y == minY) {
                    // Top
                    await drawSprite(x, y, tileMap.top)
                } else if (y == maxY) {
                    // Bottom
                    await drawSprite(x, y, tileMap.bottom)
                } else {
                    // Center
                    await drawSprite(x, y, tileMap.center)
                }
                if (Math.random() < 0.2) {
                    // Draw a random sprite extra1, extra2, extra3
                    // @ts-ignore
                    const sprite = tileMap[`extra${Math.floor(Math.random() * 6) + 1}`]
                    await drawSprite(x, y, sprite)
                }
            }
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
