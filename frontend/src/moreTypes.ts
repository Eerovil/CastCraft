import { Entity } from "./apiTypes";

export interface EntityMap {
    [key: string]: Entity
}

export interface FullDump {
    entities: EntityMap
}

export interface PartialDump {
    changedEntities: EntityMap
    deletedEntityIds: number[]
}
