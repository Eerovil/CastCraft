<script lang="ts">
import { defineComponent, reactive } from 'vue'
import GameMap from './components/GameMap.vue'
import { Entity } from "./apiTypes";
import { io } from "socket.io-client";

interface EntityMap {
    [key: string]: Entity
}

export const state = reactive({
  connected: false,
  fooEvents: [],
  barEvents: []
});

// "undefined" means the URL will be computed from the `window.location` object
const URL = undefined;

export const socket = io(URL);

socket.on("connect", () => {
  state.connected = true;
  console.log("connected");
});

socket.on("disconnect", () => {
  state.connected = false;
});


export default defineComponent({
  data() {
    return {
      entities: {} as EntityMap,
    }
  }
})

</script>

<template>
  <GameMap :entities="entities" />
</template>

<style scoped>

</style>
