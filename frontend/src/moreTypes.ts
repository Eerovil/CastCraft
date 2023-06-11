import { Entity } from "./apiTypes";

export interface EntityMap {
    [key: string]: Entity
}

export interface BackgroundTileMap {
    [key: string]: { [key: string]: string }
}

export interface FullDump {
    entities: EntityMap
    background: BackgroundTileMap
    mapSize: number[]
}

export interface PartialDump {
    changedEntities: EntityMap
    deletedEntityIds: number[]
}
