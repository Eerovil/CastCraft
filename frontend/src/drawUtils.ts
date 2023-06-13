import { Rectangle, Texture } from "pixi.js";
import { Sprite } from "./apiTypes";


type SpritesValues = {
    sprites: Sprite[]
    width: number
    height: number
}


type SpritesHash = string;

const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash; // Convert to 32bit integer
    }
    return new Uint32Array([hash])[0].toString(36);
};


function hashSpritesValues(values: SpritesValues): SpritesHash {
    let ret = ''
    for (const sprite of values.sprites) {
        ret += `${sprite.url},${sprite.x},${sprite.y},${sprite.width},${sprite.height}`
    }
    ret += `${values.width},${values.height}`
    // Make it a bit shorter but still unique (with a hash function)
    ret = simpleHash(ret) as SpritesHash
    return ret
}


class PreRenderSingleton {
    prerenderedSprites: { [key: string]: Texture[] } = {}
    fullSheetTextures: { [key: string]: Texture } = {}

    async getTextureList(values: SpritesValues): Promise<Texture[]> {
        const hash = hashSpritesValues(values)
        if (!(hash in this.prerenderedSprites)) {
            const sprite = await this.prerenderSprites(values.sprites)
            this.prerenderedSprites[hash] = sprite
        }
        return this.prerenderedSprites[hash]
    }

    private async getFullSheetTexture(url: string): Promise<Texture> {
        if (!(url in this.fullSheetTextures)) {
            const texture = await Texture.fromURL(url);
            this.fullSheetTextures[url] = texture
        }
        return this.fullSheetTextures[url]
    }

    private async prerenderSprites(sprites: Sprite[]): Promise<Texture[]> {
        // Create a Texture from each sprite
        // Then create a Texture that is a composite of all the sprites

        const urls = sprites.map(sprite => sprite.url);
        const textureArray = [];

        for (let i = 0; i < sprites.length; i++)
        {
            const fullTexture = await this.getFullSheetTexture(urls[i])
            const spriteSize = new Rectangle(
                sprites[i].x,
                sprites[i].y,
                sprites[i].width,
                sprites[i].height
            )
            const texture = new Texture(fullTexture.baseTexture, spriteSize, spriteSize);
            textureArray.push(texture);
        }
        
        return textureArray;
    }
}

const preRenderSingleton = new PreRenderSingleton()


export function getSpritesValuesHash(values: SpritesValues[]): SpritesHash {
    let hash = ''
    for (const value of values) {
        hash += hashSpritesValues(value)
    }
    return hash
}


export async function getSpritesAsTextures(values: SpritesValues): Promise<Texture[]> {
    const textures = await preRenderSingleton.getTextureList(values)
    return textures
}