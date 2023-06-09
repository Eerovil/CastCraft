import { io } from "socket.io-client";
import { EntityMap, FullDump, PartialDump } from "./moreTypes";
import { getCurrentTime } from "./timeUtils";

// "undefined" means the URL will be computed from the `window.location` object
const URL = undefined;

export const socket = io(URL);

interface socketUtilsProps {
    entities: EntityMap
}

class socketUtils {
    entities: EntityMap

    constructor(props: socketUtilsProps) {
        this.entities = props.entities
        socket.on("connect", () => {
            console.log(socket.id); // x8WIv7-mJelg7on_ALbx
        });
    }

    setEntities(entities: EntityMap) {
        console.log("setEntities: ", entities);
        Object.assign(this.entities, entities);
    }

    fetchEntityUpdate() {
        socket.emit("fetch_entity_update");
    }

    handleEntityActionCheck() {
        // Go through entities and find one that has an action
        // That has the lowest timeout
        const currentTime = getCurrentTime();
        let lowestTimeout = Infinity;
        for (const entity of Object.values(this.entities)) {
            if (entity.action && entity.action.timeout < lowestTimeout) {
                lowestTimeout = entity.action.timeout;
            }
        }
        if (lowestTimeout === Infinity) {
            return;
        }
        const timeUntilNextAction = lowestTimeout - currentTime;
        if (timeUntilNextAction <= 0) {
            this.fetchEntityUpdate();
        } else {
            setTimeout(() => {
                this.fetchEntityUpdate();
            }, timeUntilNextAction);
        }
    }

    handleEntityUpdate(data: PartialDump) {
        console.log("update: ", data);
        for (const id of data.deletedEntityIds) {
            delete this.entities[id];
        }
        for (const entity of Object.values(data.changedEntities)) {
            this.entities[entity.id] = entity;
        }
        this.handleEntityActionCheck();
    }

    afterFirstConnect() {
        socket.on('entity_update', (data: PartialDump) => {
            console.log("entity_update: ", data);
            this.handleEntityUpdate(data);
        });
    }

    waitUntilConnected() {
        return new Promise((resolve, reject) => {
            socket.on('connect', () => {
                socket.emit('connected', {
                    'hello': 'world'
                }, (data: FullDump) => {
                    console.log("connected: ", data);
                    this.setEntities(data.entities);
                    this.afterFirstConnect();
                    resolve(null);
                });
            });
        });
    }

    movePlayer(direction: number) {
        socket.emit('movePlayer', {
            direction: direction
        }, (data: PartialDump) => {
            console.log("movePlayer: ", data);
        });
    }
}

export async function initNetwork(props: socketUtilsProps) {
    const ret = new socketUtils(props);
    await ret.waitUntilConnected();
    return ret;
}
