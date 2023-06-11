import { io } from "socket.io-client";
import { EntityMap, FullDump, PartialDump } from "./moreTypes";
import { getCurrentTime, setCurrentTime } from "./timeUtils";
import { Item } from "./apiTypes";

// "undefined" means the URL will be computed from the `window.location` object
// Create url like this: /castcraft/socketio

const URL = window.location.protocol + "//" + window.location.host;
console.log("URL: ", URL);

interface socketUtilsProps {
    entities: EntityMap,
    nickname: string,
}

interface ServerTimeData {
    serverTime: number
}

class socketUtils {
    entities: EntityMap
    actionCheckTimeout: NodeJS.Timeout | null = null
    nickname: string
    socket: any

    constructor(props: socketUtilsProps) {
        this.entities = props.entities
        this.nickname = props.nickname
        this.socket = io(URL, {
            path: "/castcraft/socket.io",
            forceNew: true,
            retries: 10,
            ackTimeout: 1000
        });
        window.onunload = () => {
            this.socket.close();
        }
    }

    setEntities(entities: EntityMap) {
        console.log("setEntities: ", entities);
        Object.assign(this.entities, entities);
    }

    fetchEntityUpdate() {
        this.socket.emit("fetch_entity_update");
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
            if (this.actionCheckTimeout !== null) {
                clearTimeout(this.actionCheckTimeout);
            }
            return;
        }
        const timeUntilNextAction = lowestTimeout - currentTime;
        if (timeUntilNextAction <= 0) {
            this.fetchEntityUpdate();
        } else {
            if (this.actionCheckTimeout !== null) {
                clearTimeout(this.actionCheckTimeout);
            }
            this.actionCheckTimeout = setTimeout(() => {
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
        this.socket.on('entity_update', (data: PartialDump) => {
            console.log("entity_update: ", data);
            this.handleEntityUpdate(data);
        });
        this.socket.on('disconnect', () => {
            // After a disconnect, we want to reload the page
            // after reconnecting
            this.socket.on('connect', () => {
                window.location.reload();
            });
        });
    }

    waitUntilConnected() {
        return new Promise((resolve) => {
            this.socket.on('connect', () => {
                this.socket.emit('connected', {
                    'nickname': this.nickname,
                }, (data: FullDump) => {
                    console.log("connected: ", data);
                    if (!data.entities) {
                        return;
                    }
                    this.setEntities(data.entities);
                    this.afterFirstConnect();
                    const pingStart = getCurrentTime();
                    this.socket.emit('ping', {}, (data: ServerTimeData) => {
                        const pingEnd = getCurrentTime();
                        const serverTime = data.serverTime;
                        const currentServerTime = serverTime + (pingEnd - pingStart) / 2;
                        setCurrentTime(currentServerTime); 
                        resolve(null);
                    });
                });
            });
        });
    }

    movePlayer(direction: number) {
        this.socket.emit('movePlayer', {
            direction: direction
        }, (data: PartialDump) => {
            console.log("movePlayer: ", data);
        });
    }

    selectItem(item: Item) {
        // User selects an item to holding
        this.socket.emit('selectItem', {
            item: item
        }, (data: PartialDump) => {
            console.log("selectItem: ", data);
        });
    }
}

export async function initNetwork(props: socketUtilsProps) {
    const ret = new socketUtils(props);
    await ret.waitUntilConnected();
    return ret;
}
