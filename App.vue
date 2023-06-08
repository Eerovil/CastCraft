<script setup lang="ts">
import { defineComponent, reactive } from 'vue'
import GameMap from './components/GameMap.vue'
import { Entity } from "./apiTypes";
import { io } from "socket.io-client";

interface EntityMap {
  [key: string]: Entity
}
interface FullDump {
  entities: EntityMap
}

export const state = reactive({
  connected: false,
  fooEvents: [],
  barEvents: []
});

// "undefined" means the URL will be computed from the `window.location` object
const URL = undefined;

export const socket = io(URL);

export default defineComponent({
  data() {
    return {
      entities: {} as EntityMap,
    }
  },
  mounted() {
    socket.on("connect", () => {
      state.connected = true;
      console.log("connected");
      // Send 
      socket.emit('connected', {
        'hello': 'world'
      }, (data: FullDump) => {
        console.log("connected: ", data);
        this.setEntities(data.entities);
      });
    });

    socket.on("disconnect", () => {
      state.connected = false;
    });
  },
  methods: {
    setEntities(entities: EntityMap) {
      console.log("setEntities: ", entities);
      this.entities = entities;
    },
  }
})


</script>

<template>
  <div>
    <GameMap :entities="entities" />
  </div>
</template>

<style scoped></style>
