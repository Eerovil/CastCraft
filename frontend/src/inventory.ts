import { getImg } from "./imgUtils"
import { EntityMap } from "./moreTypes"

class Inventory {
    playerId: string
    element: HTMLDivElement
    globalEntityMap: EntityMap

    constructor(element: HTMLDivElement, globalEntityMap: EntityMap, playerId: string) {
        this.playerId = playerId
        this.element = element
        this.globalEntityMap = globalEntityMap
        setInterval(() => {this.updateInventory()}, 1000)
    }

    drawEmptyInventory() {
        this.element.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            this.element.innerHTML += `<div class="inventory-slot"></div>`;
        }
    }

    async updateInventory() {
        this.drawEmptyInventory();
        const playerEntity = this.globalEntityMap[this.playerId];
        if (!playerEntity) {
            return;
        }
        const inventory = playerEntity.inventory;
        if (!inventory || !inventory.items) {
            return;
        }
        console.log(inventory);
        for (let i = 0; i < inventory.items.length; i++) {
            const item = inventory.items[i];
            const slot = this.element.children[i] as HTMLDivElement;
            const sprite = item.sprite;
            if (!sprite) {
                continue;
            }
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                continue;
            }

            const img = await getImg(sprite.url)
            ctx.drawImage(
                img,
                sprite.x, sprite.y, sprite.width, sprite.height,
                0, 0, 50, 50
            );
            if (item.quantity && item.quantity > 1) {
                ctx.fillStyle = 'black'
                ctx.font = '20px Arial'
                ctx.fillText(item.quantity.toString(), 40, 40)
            }

            slot.appendChild(canvas);
        }
    }
}

export function initializeInventory(element: HTMLDivElement, globalEntityMap: EntityMap, playerId: string): Inventory {
    const inventory = new Inventory(element, globalEntityMap, playerId);
    return inventory;
}
