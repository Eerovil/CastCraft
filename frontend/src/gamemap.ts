// @ts-ignore
import { Application, Loader as PixiLoader, Texture, AnimatedSprite, RenderTexture, Sprite as StaticSprite, autoDetectRenderer, Rectangle, Container } from 'pixi.js'
import * as PIXI from 'pixi.js'
import { Entity, Sprite as APISprite } from './apiTypes'
import { getSpritesAsTextures, getSpritesValuesHash } from './drawUtils'
import { BackgroundTileMap, EntityMap } from './moreTypes'
import { getCurrentTime } from './timeUtils'
import { logger } from '@sentry/utils'


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
    backgroundContainer: Container | null = null
    backgroundTileMap: BackgroundTileMap | null = null

    touchAreasSprite: Container | null = null

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
            this.app.stage.scale.set(3)
            this.app.stage.sortableChildren = true

            this.touchAreasSprite = this.createTouchAreasSprite();
            this.app.stage.addChild(this.touchAreasSprite);

            console.log('isMobile', player.x, player.y, this.app.stage.position)
        }
    }

    createTouchAreasSprite() {
        // Create a sprite with 32x32 squares above, below, left, and right of the center
        const touchAreaSize = 32
        const touchAreasContainer = new Container();

        const drawRect = (x: number, y: number) => {
            var graphics = new PIXI.Graphics();

            // set the line style to have a width of 5 and set the color to green
            graphics.lineStyle(1, 0x00ff00);

            // draw a rectangle
            graphics.drawRect(x, y, touchAreaSize, touchAreaSize);

            touchAreasContainer.addChild(graphics);
        }

        let x = touchAreaSize
        let y = touchAreaSize

        drawRect(x - touchAreaSize, y)
        drawRect(x + touchAreaSize, y)
        drawRect(x, y - touchAreaSize)
        drawRect(x, y + touchAreaSize)

        touchAreasContainer.zIndex = 0
        touchAreasContainer.pivot.set(touchAreaSize * 2 - 16, touchAreaSize * 2)
        return touchAreasContainer
    }

    async updateAllEntities() {
        const entities = Object.values(this.entities);
        for (const entity of entities) {
            await this.updateEntity(entity)
        }
        this.removeDeletedEntities()
        this.animationIndex += 1
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
            if (this.touchAreasSprite) {
                this.touchAreasSprite.position.copyFrom(this.app.stage.pivot)
            }
        }

        let pixiEntity = this.pixiEntities[entity.id]

        const spritesValuess = []
        for (const spriteList of entity.sprites || []) {
            spritesValuess.push({
                sprites: spriteList, width: entity.width!, height: entity.height!
            })
        }

        const newHash = getSpritesValuesHash(spritesValuess)

        if (!pixiEntity || newHash != pixiEntity.hash) {
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

            // Check again
            pixiEntity = this.pixiEntities[entity.id]

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
                    sprite.loop = true
                    sprite.play()
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
                        logger.error(new Error(`Sprite ${spriteIndex} is missing`))
                    }
                    sprite.textures = textureLists[spriteIndex]
                    sprite.loop = true
                    sprite.gotoAndPlay(0)
                }
                pixiEntity.hash = newHash
            }
        }

        if (entity.animation_speed == 0) {
            pixiEntity.sprites.forEach(sprite => sprite.gotoAndStop(0))
        } else {
            pixiEntity.sprites.forEach(sprite => {
                sprite.animationSpeed = ((entity.animation_speed || 0) * 1.0) / 20.0;
                if (!sprite.playing && sprite.textures.length > 1) {
                    sprite.play()
                }
            });
        }

        let zIndex = entity.y;
        if (entity.carried_by_entity_id) {
            zIndex += 32;
        }

        pixiEntity.sprites.forEach(sprite => sprite.zIndex = zIndex);
        pixiEntity.sprites.forEach(sprite => sprite.x = x + (entity.x_offset || 0) + shakeX)
        pixiEntity.sprites.forEach(sprite => sprite.y = y + (entity.y_offset || 0) + shakeY)

    }

    async setBackground(backgroundTileMap: BackgroundTileMap) {
        // Called from outside to set the background tile map
        this.backgroundTileMap = backgroundTileMap
        const backgroundContainer = await this.rebuildBackground();
        if (backgroundContainer) {
            this.backgroundContainer = backgroundContainer;
            backgroundContainer.zIndex = -1000;
            this.app.stage.addChild(backgroundContainer);
            console.log('Added background', backgroundContainer)
        } else {
            console.error('Failed to build background texture')
        }
    }

    async rebuildBackground() {
        // return a RenderTexture that contains the background
        if (!this.backgroundTileMap) {
            console.error('No background tile map set')
            return;
        }
        const renderer = this.app.renderer;
        renderer.background.color = "0xff0000";

        const waterSize = 10 * 32;

        const backgroundContainer = new Container();

        const originX = 0, originY = 0
        const minX = this.mapSize[0], minY = this.mapSize[1]
        const maxX = this.mapSize[2], maxY = this.mapSize[3]

        interface TileMap {
            topLeft: APISprite,
            top: APISprite,
            topRight: APISprite,
            left: APISprite,
            center: APISprite,
            right: APISprite,
            bottomLeft: APISprite,
            bottom: APISprite,
            bottomRight: APISprite,
            extra1: APISprite,
            extra2: APISprite,
            extra3: APISprite,
            extra4: APISprite,
            extra5: APISprite,
            extra6: APISprite,
            extra7: APISprite,
            water: APISprite,
        }

        const tileMap: TileMap = this.backgroundTileMap.grass as any;
        const firstSprite = tileMap.topLeft;

        const fullTexture = await Texture.fromURL(firstSprite.url)

        const drawSprite = async (x: number, y: number, sprite: APISprite) => {
            // Create a pixi sprite from the APISprite using fullTexture.baseTexture
            const spriteSize = new Rectangle(
                sprite.x,
                sprite.y,
                sprite.width,
                sprite.height
            )
            // Texture that is the wanted tile
            const texture = new Texture(fullTexture.baseTexture, spriteSize, spriteSize);
            // Create a sprite that is the wanted tile
            const staticSprite: StaticSprite = new StaticSprite(texture);
            staticSprite.position.x = x
            staticSprite.position.y = y
            staticSprite.width = 32
            staticSprite.height = 32

            backgroundContainer.addChild(staticSprite)
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

        return backgroundContainer;
    }

}


export function drawGameMap(app: Application, globalEntityMap: EntityMap, playerId: string | null, mapSize: number[]) {
    const mapDrawer = new MapDrawer(app, globalEntityMap, playerId, mapSize)
    app.ticker.add(() => {
        mapDrawer.updateAllEntities();
    });
    (window as any).mapDrawer = mapDrawer;
    return mapDrawer;
}
