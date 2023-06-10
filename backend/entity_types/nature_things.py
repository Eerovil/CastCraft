

from db import get_free_entity_id, get_entity_db
from models import Entity, Sprite


BASE_URL = '/sprites/nature_things/'
TREE_TILE = (32, 32 + 16)


def get_tree_tile_position(index):
    y = int(index / 5)
    x = (index % 5)
    return x * TREE_TILE[0], y * TREE_TILE[1]


class TreeEntity(Entity):
    treeIndex: int = 0

    def update_sprites(self):
        tile_x, tile_y = get_tree_tile_position(self.treeIndex)
        sprites = [
            [
                Sprite(
                    url=f'{BASE_URL}global_shadow.png',
                    x=tile_x,
                    y=tile_y,
                    width=TREE_TILE[0],
                    height=TREE_TILE[1],
                )
            ]
        ]
        self.sprites = sprites

    def on_swing_destroy(self):
        # Create a MinecraftBlock entity
        from entity_types.minecraft_things import DroppedMinecraftBlock
        block = DroppedMinecraftBlock(
            id=get_free_entity_id(),
            block_type='wood',
            x=self.x,
            y=self.y,
        )
        block.update_sprites()
        entity_db = get_entity_db()
        entity_db[block.id] = block
        return [block]


ROCK_TILE = (16, 16)


def get_rock_tile_position(index):
    y = (3 + 3 + 5)
    x = index
    return x * ROCK_TILE[0], y * ROCK_TILE[1]


class RockEntity(Entity):
    rockIndex: int = 0

    def update_sprites(self):
        tile_x, tile_y = get_rock_tile_position(self.rockIndex)
        sprites = [
            [
                Sprite(
                    url=f'{BASE_URL}global_shadow.png',
                    x=tile_x,
                    y=tile_y,
                    width=ROCK_TILE[0],
                    height=ROCK_TILE[1],
                )
            ]
        ]
        self.sprites = sprites

    def on_swing_destroy(self):
        # Create a MinecraftBlock entity
        from entity_types.minecraft_things import DroppedMinecraftBlock
        block = DroppedMinecraftBlock(
            id=get_free_entity_id(),
            block_type='stone',
            x=self.x,
            y=self.y,
        )
        block.update_sprites()
        entity_db = get_entity_db()
        entity_db[block.id] = block
        return [block]
