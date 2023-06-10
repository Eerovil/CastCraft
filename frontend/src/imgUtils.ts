
class ImgPreloader {
    private preloadedImages: { [key: string]: HTMLImageElement } = {}

    async getImg(url: string) {
        if (this.preloadedImages[url]) {
            return this.preloadedImages[url]
        }
        const img = new Image()
        img.src = url
        await new Promise((resolve) => {
            img.onload = () => {
                img.decode().then(() => {
                    resolve(null)
                })
            }
        })
        this.preloadedImages[url] = img
        return img
    }
}

const imgPreloader = new ImgPreloader()

export function getImg(url: string) {
    return imgPreloader.getImg(url)
}