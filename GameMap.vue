<script lang="ts">
import { defineComponent } from 'vue'
import { Entity } from "../apiTypes";

export default defineComponent({
  data: () => ({
    preloadedImages: {} as { [key: string]: HTMLImageElement }
  }),
  props: {
    entities: {
      type: Object as () => { [key: string]: Entity },
      required: true
    }
  },
  computed: {
    canvas() {
      return document.getElementById('game-map') as HTMLCanvasElement
    }
  },
  methods: {
    redrawAllEntities() {
      for (const entity of Object.values(this.entities)) {
        this.drawEntity(entity)
      }
    },
    getImg(url: string) {
      if (this.preloadedImages[url]) {
        return this.preloadedImages[url]
      }
      const img = new Image()
      img.src = url
      this.preloadedImages[url] = img
      return img
    },
    drawEntity(entity: Entity) {
      const canvas = this.canvas;
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }
      // Draw sprite entity.url at entity.x and entity.y
      // ...
      const img = this.getImg(entity.sprites[0][0].url)
      ctx.drawImage(img, entity.x, entity.y, entity.width, entity.height);
    }
  }
})

</script>

<template>
  <div>
    <canvas id="game-map" width="800" height="600"></canvas>
  </div>
</template>

<style scoped></style>
