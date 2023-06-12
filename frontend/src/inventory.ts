import { Item } from "./apiTypes"
import { getImg } from "./imgUtils"
import { EntityMap } from "./moreTypes"

interface InventoryCallbacks {
    selectItem?: (item: Item) => void
}

class Inventory {
    playerId: string
    element: HTMLDivElement
    globalEntityMap: EntityMap
    callbacks: InventoryCallbacks

    constructor(element: HTMLDivElement, globalEntityMap: EntityMap, playerId: string, callbacks: InventoryCallbacks) {
        this.playerId = playerId
        this.element = element
        this.globalEntityMap = globalEntityMap
        this.callbacks = callbacks

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
        const holdingSlug = playerEntity.holding ? playerEntity.holding.slug : null;

        if (!inventory || !inventory.items) {
            return;
        }
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
            const ctx = canvas.getContext('2d', {
                willReadFrequently: true,
            })!
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
            if (item.slug == holdingSlug) {
                // Draw square around item
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 5;
                ctx.strokeRect(0, 0, 50, 50);
            }

            slot.appendChild(canvas);

            if (this.callbacks.selectItem) {
                slot.addEventListener('click', () => {
                    this.callbacks.selectItem!(item);
                });
            }
        }
    }
}

export function initializeInventory(element: HTMLDivElement, globalEntityMap: EntityMap, playerId: string, callbacks: InventoryCallbacks): Inventory {
    const inventory = new Inventory(element, globalEntityMap, playerId, callbacks);
    return inventory;
}
