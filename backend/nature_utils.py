import random

from entity_types.nature_things import TreeEntity, RockEntity
from db import get_entity_at_position, get_entity_db, get_free_entity_id

import logging
logger = logging.getLogger(__name__)


def generate_tree_entity():
    _id = get_free_entity_id()
    x, y = 0, 0
    while get_entity_at_position(x, y) is not None:
        x, y = random.randrange(2, 15) * 32, random.randrange(2, 15) * 32

    tree_entity = TreeEntity(
        id=_id,
        width=64,
        height=64 + 32,
        x=x,
        y=y,
        treeIndex=random.randrange(0, 6),
        on_touch='swing',
    )
    tree_entity.update_sprites()
    entity_db = get_entity_db()
    entity_db[_id] = tree_entity
    return tree_entity


def generate_rock_entity():
    _id = get_free_entity_id()
    x, y = 0, 0
    while get_entity_at_position(x, y) is not None:
        x, y = random.randrange(2, 15) * 32, random.randrange(2, 15) * 32

    rock_entity = RockEntity(
        id=_id,
        width=32,
        height=32,
        x_offset=1,
        y_offset=-2,
        x=x,
        y=y,
        rockIndex=random.randrange(0, 9),
        on_touch='swing',
    )
    rock_entity.update_sprites()
    entity_db = get_entity_db()
    entity_db[_id] = rock_entity
    return rock_entity


def spawn_nature_things():
    # Make sure 5 of Tree and 5 of Rock are spawned
    entity_db = get_entity_db()
    tree_count = 0
    rock_count = 0
    for entity in list(entity_db.values()):
        if isinstance(entity, TreeEntity):
            del entity_db[entity.id]
        elif isinstance(entity, RockEntity):
            del entity_db[entity.id]
    while tree_count < 5:
        generate_tree_entity()
        tree_count += 1
    while rock_count < 5:
        generate_rock_entity()
        rock_count += 1

    logger.info(f'Spawned {tree_count} trees and {rock_count} rocks')
