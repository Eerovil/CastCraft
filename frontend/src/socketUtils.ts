import { io } from "socket.io-client";
import { EntityMap, FullDump } from "./moreTypes";

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
        Object.assign(this.entities, entities);
    }

    waitUntilConnected() {
        return new Promise((resolve, reject) => {
            socket.on('connect', () => {
                socket.emit('connected', {
                    'hello': 'world'
                }, (data: FullDump) => {
                    console.log("connected: ", data);
                    this.setEntities(data.entities);
                    resolve(null);
                });
            });
        });
    }

}

export async function initNetwork(props: socketUtilsProps) {
    const ret = new socketUtils(props);
    await ret.waitUntilConnected();
    return ret;
}
