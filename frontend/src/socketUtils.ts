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
    fullDumpCallback?: (data: FullDump) => void,
}

interface ServerTimeData {
    serverTime: number
}

class socketUtils {
    entities: EntityMap
    fullDumpCallback: (data: FullDump) => void
    actionCheckTimeout: NodeJS.Timeout | null = null
    nickname: string
    socket: any

    constructor(props: socketUtilsProps) {
        this.entities = props.entities
        this.nickname = props.nickname
        this.fullDumpCallback = props.fullDumpCallback || (() => { })
        try {
            this.socket = io(URL, {
                path: "/castcraft/socket.io",
                forceNew: true,
                retries: 10,
                ackTimeout: 1000
            });
        } catch (e) {
            console.log("Error: ", e);
        }
        window.onunload = () => {
            this.socket.close();
        }
    }

    setEntities(entities: EntityMap) {
        console.log("setEntities: ", entities);
        Object.assign(this.entities, entities);
    }

    handleEntityUpdate(data: PartialDump) {
        for (const id of data.deletedEntityIds) {
            delete this.entities[id];
        }
        for (const entity of Object.values(data.changedEntities)) {
            this.entities[entity.id] = entity;
        }
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
                // Send a POST request to /castcraft/api/firstConnect
                // to get the initial state of the game
                // NOTE: Don't use socketio
                fetch('/castcraft/api/firstConnect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nickname: this.nickname,
                        requestSid: this.socket.id,
                    })
                }).then((response) => response.json()).then((data: FullDump) => {
                    console.log("connected: ", data);
                    if (!data || !data.entities) {
                        return;
                    }
                    this.setEntities(data.entities);
                    this.fullDumpCallback(data);
                    this.afterFirstConnect();
                    const pingStart = getCurrentTime();
                    fetch('/castcraft/api/ping', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                    }).then((response) => response.json()).then((data: ServerTimeData) => {
                        const pingEnd = getCurrentTime();
                        const serverTime = data.serverTime;
                        const currentServerTime = serverTime + (pingEnd - pingStart) / 2;
                        setCurrentTime(currentServerTime);
                        console.log(getCurrentTime(), currentServerTime, (pingEnd - pingStart) / 2)
                        resolve(null);
                    })
                });
            });
        });
    }

    movePlayer(direction: number) {
        this.socket.emit('movePlayer', {
            direction: direction
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
