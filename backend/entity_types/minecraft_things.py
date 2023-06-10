from typing import Literal

from models import ACTION_SLUGS, Entity, Item, Sprite


TILE_SIZE = 16

BASE_URL = '/sprites/minecraft.png'

BlockType = Literal['wood', 'stone']

BLOCKS = {
    'wood': (16, 4),
    'stone': (3, 5),
    'axe': (11, 18),
    'pickaxe': (13, 18),
}


class DroppedMinecraftBlock(Entity):
    width: int = 16
    height: int = 16

    x_offset: int = 8
    y_offset: int = 8

    block_type: BlockType

    on_touch: ACTION_SLUGS = "to_inventory"

    def update_sprites(self):
        tile_x, tile_y = BLOCKS[self.block_type]
        tile_x *= TILE_SIZE
        tile_y *= TILE_SIZE
        sprites = [
            [
                Sprite(
                    url=f'{BASE_URL}',
                    x=tile_x,
                    y=tile_y,
                    width=TILE_SIZE,
                    height=TILE_SIZE,
                )
            ]
        ]
        self.sprites = sprites


class PlacedMinecraftBlock(DroppedMinecraftBlock):
    width: int = 32
    height: int = 32

    x_offset: int = 16
    y_offset: int = 16

    block_type: BlockType

    on_touch: ACTION_SLUGS = "swing"


class MinecraftItem(Item):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        block_type = self.slug.replace('_block', '')
        tile_x, tile_y = BLOCKS[block_type]
        tile_x *= TILE_SIZE
        tile_y *= TILE_SIZE
        self.sprite = Sprite(
            url=f'{BASE_URL}',
            x=tile_x,
            y=tile_y,
            width=TILE_SIZE,
            height=TILE_SIZE,
        )
