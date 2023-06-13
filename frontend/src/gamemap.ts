// @ts-ignore
import { Application, Loader as PixiLoader, Texture, AnimatedSprite } from 'pixi.js'
import { Entity } from './apiTypes'
import { getSpritesAsTextures, getSpritesValuesHash } from './drawUtils'
import { BackgroundTileMap, EntityMap } from './moreTypes'
import { getCurrentTime } from './timeUtils'

function sortBy(arr: Array<any>, callback: (item: any) => number) {
    return arr.sort((a: any, b: any) => callback(a) - callback(b))
}


type PixiEntity = {
    entityID: string
    hash: string
    sprites: AnimatedSprite[]
}


class MapDrawer {
    entities: EntityMap
    app: Application

    pixiEntities: { [key: string]: PixiEntity } = {}

    preloadedImages: { [key: string]: HTMLImageElement }
    animationIndex: number = 0
    playerId: string | null = null
    playerX: number = 0
    playerY: number = 0
    frameTime: number = 0

    isMobile: boolean = true

    mapSize: number[] = [0, 0, 0, 0]
    backgroundImage: HTMLImageElement | null = null
    backgroundTileMap: BackgroundTileMap | null = null

    predrawnTouchAreas: HTMLCanvasElement | null = null
    predrawnTexts: { [key: string]: HTMLCanvasElement } = {}

    constructor(app: Application, globalEntityMap: EntityMap, playerId: string | null, mapSize: number[]) {
        this.entities = globalEntityMap
        this.mapSize = mapSize
        this.app = app

        this.preloadedImages = {}
        console.log('MapDrawer constructor: ', this.entities)
        this.isMobile = window.innerWidth < 600

        if (this.isMobile) {
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
            this.app.stage.position.set(
                window.innerWidth / 2,
                window.innerHeight / 2,
            )
            this.app.stage.scale.set(4)

            // ctx.scale(2, 2)
            // ctx.translate(canvas.width / 2, canvas.height / 2)
            // const scale = 3
            // const widthNew = ctx.canvas.width / 2;
            // const heightNew = ctx.canvas.height / 2;
            // ctx.setTransform(scale, 0, 0, scale, -(scale - 1) * widthNew, -(scale - 1) * heightNew);
            console.log('isMobile', player.x, player.y, this.app.stage.position)
        }
    }

    async updateAllEntities() {
        const sortedEntities = sortBy(
            sortBy(Object.values(this.entities), (entity) => entity.y),
            (entity) => entity.carried_by_entity_id ? 1 : -1,
        )
        // if (this.playerId) {
        //     this.drawTouchAreas()
        // }
        for (const entity of sortedEntities) {
            await this.updateEntity(entity)
        }
        this.removeDeletedEntities()
        this.animationIndex += 1
    }

    predrawTouchAreas() {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true,
        })!
        if (!ctx) {
            throw new Error('Could not get canvas context')
        }
        // Draw a square above, below, left, and right of the player
        const touchAreaSize = 32
        const touchAreaColor = 'rgba(255, 0, 0, 0.5)'
        canvas.width = touchAreaSize * 3
        canvas.height = touchAreaSize * 3

        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = touchAreaColor
        const drawRect = (x: number, y: number) => {
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, touchAreaSize, touchAreaSize);
        }

        let x = touchAreaSize
        let y = touchAreaSize

        drawRect(x - touchAreaSize, y)
        drawRect(x + touchAreaSize, y)
        drawRect(x, y - touchAreaSize)
        drawRect(x, y + touchAreaSize)

        this.predrawnTouchAreas = canvas
    }

    // drawTouchAreas() {
    //     const ctx = this.ctx;
    //     const player = this.entities[this.playerId!]
    //     if (!player) {
    //         return
    //     }
    //     if (!this.predrawnTouchAreas) {
    //         this.predrawTouchAreas()
    //     }
    //     const predrawnTouchAreas = this.predrawnTouchAreas as HTMLCanvasElement
    //     // const { x, y } = this.convertCoordinates(player.x, player.y)
    //     const { x, y } = this.convertCoordinates(player.x, player.y)
    //     const touchAreaSize = 32
    //     ctx.drawImage(predrawnTouchAreas, x - touchAreaSize, y - touchAreaSize)
    // }

    drawText(ctx2: CanvasRenderingContext2D, text: string, x: number, y: number, color: string = 'black') {
        if (text in this.predrawnTexts) {
            const canvas = this.predrawnTexts[text]
            ctx2.drawImage(canvas, x, y)
            return
        }
        const canvas = document.createElement('canvas')
        canvas.width = 100
        canvas.height = 100
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true,
        })!
        if (!ctx) {
            throw new Error('Could not get canvas context')
        }
        ctx.imageSmoothingEnabled = false;
        ctx.font = '16px Arial'
        ctx.fillStyle = color
        ctx.fillText(text, 0, 16)
        this.predrawnTexts[text] = canvas
        ctx2.drawImage(canvas, x, y)
    }

    convertCoordinates(x: number, y: number) {
        // If playerId is set, center on player
        // New origin is at player x - (canvas.width / 2), player y - (canvas.height / 2)
        // So we must subtract that from the coordinates
        // if (!this.playerId) {
        //     return { x, y }
        // }
        // const player = this.entities[this.playerId]
        // if (!player) {
        //     return { x, y }
        // }
        // console.log('convertCoordinates', x, y, this.playerX, this.playerY, this.app.screen.width, this.app.screen.height)
        // return {
        //     x: x - (this.playerX - (this.app.screen.width / 2)) - (32 / 2),
        //     y: y - (this.playerY - (this.app.screen.height / 2)) - 32,
        // }
        return { x, y }
    }

    async removeDeletedEntities() {
        for (const pixiEntity of Object.values(this.pixiEntities)) {
            if (!this.entities[pixiEntity.entityID]) {
                pixiEntity.sprites.forEach((sprite) => {
                    this.app.stage.removeChild(sprite)
                })
                delete this.pixiEntities[pixiEntity.entityID]
            }
        }
    }

    async updateEntity(entity: Entity) {
        // Update position of this entity to app
        let x = entity.x
        let y = entity.y
        if (
                (entity.action || {}).action == 'move' &&
                (entity.x_from != undefined && entity.y_from != undefined) &&
                (
                    (entity.x_from != entity.x) ||
                    (entity.y_from != entity.y)
                )
            ) {
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

        // if (entity.animation_speed == 0) {
        //     // Only draw the first sprite
        //     animationIndex = 0
        // } else {
        //     // Draw the sprite at the current animation frame
        //     animationIndex = Math.floor(this.animationIndex / (entity.animation_speed || 1))
        // }

        let shakeX = 0, shakeY = 0;
        for (const animation of entity.animations || []) {
            if (animation.type == 'shake') {
                // Shake the coordinates by a random amount
                // from -2 to 2
                shakeX = Math.random() * 4 - 2
                shakeY = Math.random() * 4 - 2
            }
        }

        if (entity.id == this.playerId) {
            this.app.stage.pivot.copyFrom({
                x: x - (entity.x_offset || 0),
                y: y - (entity.y_offset || 0),
            })
        }

        const newCoords = this.convertCoordinates(x, y)
        x = newCoords.x
        y = newCoords.y

        let pixiEntity = this.pixiEntities[entity.id]

        const spritesValuess = []
        for (const spriteList of entity.sprites || []) {
            spritesValuess.push({
                sprites: spriteList, width: entity.width!, height: entity.height!
            })
        }

        const newHash = getSpritesValuesHash(spritesValuess)

        if (!pixiEntity || newHash != pixiEntity.hash) {
            console.log('newHash', newHash, pixiEntity?.hash)
            const spriteCount = entity.sprites![0].length

            const textureLists: Texture[][] = [];
            for (let spriteIndex = 0; spriteIndex < spriteCount; spriteIndex++) {
                const spritesByIndex = []
                for (let animationIndex = 0; animationIndex < entity.sprites!.length; animationIndex++) {
                    spritesByIndex.push(entity.sprites![animationIndex][spriteIndex])
                }
                textureLists.push(await getSpritesAsTextures({
                    sprites: spritesByIndex, width: entity.width!, height: entity.height!
                }))
            }

            if (!pixiEntity) {
                // Create a new animated sprite for each sprite
                // Currently, sprites is an array where the first index
                // is animation index, then the second index is the sprite index
                // We want to flip this so that the first index is the sprite index
                // and the second index is the animation index

                const animatedSprites: AnimatedSprite[] = []

                for (const textureList of textureLists) {
                    const sprite = new AnimatedSprite(textureList)
                    const scale = entity.width! / sprite.width
                    sprite.scale.set(scale, scale)
                    sprite.play()
                    sprite.animationSpeed = 0.1
                    animatedSprites.push(sprite)
                    this.app.stage.addChild(sprite)
                }

                this.pixiEntities[entity.id] = {
                    entityID: entity.id,
                    hash: newHash,
                    sprites: animatedSprites,
                }
                pixiEntity = this.pixiEntities[entity.id]
            } else {
                for (let spriteIndex = 0; spriteIndex < spriteCount; spriteIndex++) {
                    const sprite = pixiEntity.sprites[spriteIndex]
                    if (!sprite) {
                        debugger;
                    }
                    sprite.textures = textureLists[spriteIndex]
                    sprite.play()
                    // console.log('sprite', sprite.textures.length, textureLists[spriteIndex])
                    // sprite.play()
                    // console.log('sprite', sprite.textures.length, spriteIndex, sprite)
                }
                pixiEntity.hash = newHash
            }
        }

        if (entity.animation_speed == 0) {
            pixiEntity.sprites.forEach(sprite => sprite.gotoAndStop(0))
        }

        pixiEntity.sprites.forEach(sprite => sprite.x = x + (entity.x_offset || 0) + shakeX)
        pixiEntity.sprites.forEach(sprite => sprite.y = y + (entity.y_offset || 0) + shakeY)

        // Draw a dot at the x/y of the entity
        // this.drawText(ctx, entity.id, x, y, 'red')

        // if (entity.nickname) {
        //     this.drawText(ctx, entity.nickname, x, y - 20, 'black')
        // }
    }

    // setBackground(backgroundTileMap: BackgroundTileMap) {
    //     this.backgroundTileMap = backgroundTileMap
    //     this.rebuildBackground();
    // }

    // async rebuildBackground() {
    //     if (!this.canvas || !this.backgroundTileMap) {
    //         return
    //     }
    //     const invisibleCanvas = document.createElement('canvas')

    //     const waterSize = 100 * 32;

    //     invisibleCanvas.width = this.mapSize[2] + waterSize;
    //     invisibleCanvas.height = this.mapSize[3] + waterSize;
    //     const ctx = invisibleCanvas.getContext('2d', {
    //         alpha: false,
    //         willReadFrequently: true,
    //     })!
    //     if (!ctx) {
    //         return
    //     }
    //     ctx.imageSmoothingEnabled = false;

    //     const originX = 0, originY = 0
    //     const minX = this.mapSize[0], minY = this.mapSize[1]
    //     const maxX = this.mapSize[2], maxY = this.mapSize[3]

    //     ctx.clearRect(originX, originY, maxX, maxY)

    //     interface TileMap {
    //         topLeft: Sprite,
    //         top: Sprite,
    //         topRight: Sprite,
    //         left: Sprite,
    //         center: Sprite,
    //         right: Sprite,
    //         bottomLeft: Sprite,
    //         bottom: Sprite,
    //         bottomRight: Sprite,
    //         extra1: Sprite,
    //         extra2: Sprite,
    //         extra3: Sprite,
    //         extra4: Sprite,
    //         extra5: Sprite,
    //         extra6: Sprite,
    //         extra7: Sprite,
    //         water: Sprite,
    //     }

    //     const tileMap: TileMap = this.backgroundTileMap.grass as any;

    //     const drawSprite = async (x: number, y: number, sprite: Sprite) => {
    //         ctx.drawImage(
    //             await getImg(sprite.url),
    //             sprite.x, sprite.y, sprite.width, sprite.height,
    //             x, y, 32, 32
    //         );
    //     }

    //     for (let x = originX - waterSize; x < maxX + waterSize; x += 32) {
    //         for (let y = originY - waterSize; y < maxY + waterSize; y += 32) {
    //             if (x < minX || x > maxX || y < minY || y > maxY) {
    //                 // Draw water
    //                 await drawSprite(x, y, tileMap.water)
    //                 continue
    //             }
    //             if (x == minX) {
    //                 // Left side
    //                 if (y == minY) {
    //                     // Top left
    //                     await drawSprite(x, y, tileMap.topLeft)
    //                 } else if (y == maxY) {
    //                     // Bottom left
    //                     await drawSprite(x, y, tileMap.bottomLeft)
    //                 } else {
    //                     // Left
    //                     await drawSprite(x, y, tileMap.left)
    //                 }
    //             } else if (x == maxX) {
    //                 // Right side
    //                 if (y == minY) {
    //                     // Top right
    //                     await drawSprite(x, y, tileMap.topRight)
    //                 } else if (y == maxY) {
    //                     // Bottom right
    //                     await drawSprite(x, y, tileMap.bottomRight)
    //                 } else {
    //                     // Right
    //                     await drawSprite(x, y, tileMap.right)
    //                 }
    //             } else if (y == minY) {
    //                 // Top
    //                 await drawSprite(x, y, tileMap.top)
    //             } else if (y == maxY) {
    //                 // Bottom
    //                 await drawSprite(x, y, tileMap.bottom)
    //             } else {
    //                 // Center
    //                 await drawSprite(x, y, tileMap.center)
    //             }
    //             if (Math.random() < 0.2) {
    //                 // Draw a random sprite extra1, extra2, extra3
    //                 // @ts-ignore
    //                 const sprite = tileMap[`extra${Math.floor(Math.random() * 6) + 1}`]
    //                 await drawSprite(x, y, sprite)
    //             }
    //         }
    //     }

    //     // Save the background canvas as this.backgroundImage (image objects)
    //     const backgroundImage = new Image()
    //     backgroundImage.src = invisibleCanvas.toDataURL()
    //     await new Promise((resolve) => {
    //         backgroundImage.onerror = () => {
    //             resolve(null)
    //         }
    //         backgroundImage.onload = () => {
    //             backgroundImage.decode().then(() => {
    //                 this.backgroundImage = backgroundImage
    //                 resolve(null)
    //             }).catch((e) => {
    //                 console.error(e)
    //                 resolve(null)
    //             });
    //         }
    //     })
    //     this.backgroundImage = backgroundImage
    // }

    // drawBackground() {
    //     if (!this.canvas || !this.backgroundImage) {
    //         return
    //     }
    //     const ctx = this.canvas.getContext('2d')
    //     if (!ctx) {
    //         return
    //     }

    //     if (!this.playerId) {
    //         // Draw entire background (Find out what 0, 0 means in the current view)
    //         // And draw the background from there
    //         const { x, y } = this.convertCoordinates(0, 0)
    
    //         ctx.drawImage(this.backgroundImage, x, y)
    //     } else {
    //         // Draw only the visible part of the background

    //         // This is the coordinates of the start of the visible
    //         // part of the background
    //         const minX = this.playerX - this.app.renderer.width
    //         const minY = this.playerY - this.app.renderer.height

    //         // Find where we want to draw it in current context
    //         const { x: drawX, y: drawY } = this.convertCoordinates(
    //             minX,
    //             minY
    //         )

    //         const width = this.app.renderer.width * 3
    //         const height = this.app.renderer.height * 3

    //         ctx.drawImage(
    //             this.backgroundImage,
    //             minX, minY, width, height,
    //             drawX, drawY, width, height
    //         )
    //     }

    // }
}


export function drawGameMap(app: Application, globalEntityMap: EntityMap, playerId: string | null, mapSize: number[]) {
    const mapDrawer = new MapDrawer(app, globalEntityMap, playerId, mapSize)
    app.ticker.add(() => {
        mapDrawer.updateAllEntities();
    });
    (window as any).mapDrawer = mapDrawer;
    return mapDrawer;
}
