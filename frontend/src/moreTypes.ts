import { Entity } from "./apiTypes";

export interface EntityMap {
    [key: string]: Entity
}

export interface FullDump {
    entities: EntityMap
}
