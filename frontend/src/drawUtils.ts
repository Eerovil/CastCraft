import { Sprite } from "./apiTypes";
import { getImg } from "./imgUtils";


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
    prerenderedSprites: { [key: string]: HTMLCanvasElement } = {}

    async getPrerenderedSprite(values: SpritesValues) {
        const hash = hashSpritesValues(values)
        if (!(hash in this.prerenderedSprites)) {
            await this.prerenderSprite(hash, values)
        }
        return this.prerenderedSprites[hash]
    }

    private async prerenderSprite(hash: SpritesHash, values: SpritesValues) {
        const canvas = document.createElement('canvas')
        canvas.width = values.width
        canvas.height = values.height
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true,
        })!
        ctx.imageSmoothingEnabled = false

        const urlToImg: { [key: string]: HTMLImageElement } = {}
        for (const sprite of values.sprites) {
            urlToImg[sprite.url] = await getImg(sprite.url)
        }

        for (const sprite of values.sprites) {
            const img = urlToImg[sprite.url]
            try {
                ctx.drawImage(
                    img,
                    sprite.x, sprite.y, sprite.width, sprite.height,
                    0, 0, values.width, values.height
                );
            } catch (e) {
                console.error(e)
            }
        }

        this.prerenderedSprites[hash] = canvas
    }
}

const preRenderSingleton = new PreRenderSingleton()


export async function getSpritesAsCanvas(values: SpritesValues) {
    return await preRenderSingleton.getPrerenderedSprite(values)
}
