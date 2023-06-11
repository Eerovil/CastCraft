
class ImgPreloader {
    private preloadedImages: { [key: string]: HTMLImageElement } = {}
    private preloadedImagesPromises: { [key: string]: Promise<void> } = {}

    errorImg() {
        const img = new Image()
        img.src = '/img/error.png'
        return img
    }

    async getImg(url: string) {
        if (this.preloadedImages[url]) {
            return this.preloadedImages[url]
        }
        if (url in this.preloadedImagesPromises) {
            await this.preloadedImagesPromises[url]
            return this.preloadedImages[url]
        }
        const img = new Image()
        img.src = url
        this.preloadedImagesPromises[url] = new Promise((resolve) => {
            img.onload = () => {
                img.decode().then(() => {
                    this.preloadedImages[url] = img
                    resolve()
                }).catch((err) => {
                    console.log(err)
                    this.preloadedImages[url] = this.errorImg()
                    resolve()
                })
            }
            img.onerror = () => {
                this.preloadedImages[url] = this.errorImg()
                resolve()
            }
        })
        return img
    }
}

const imgPreloader = new ImgPreloader()

export function getImg(url: string) {
    return imgPreloader.getImg(url)
}