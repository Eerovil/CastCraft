import random
from time_utils import get_current_time

from entity_types.nature_things import TreeEntity, RockEntity
from db import get_entity_db, get_free_entity_id
from utils import get_random_free_position

import logging
logger = logging.getLogger(__name__)


def generate_tree_entity():
    _id = get_free_entity_id()

    x, y = get_random_free_position(20, 5, 40, 20, allow_edges=False)

    tree_entity = TreeEntity(
        id=_id,
        made_of='wood',
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

    x, y = get_random_free_position(5, 20, 20, 40, allow_edges=False)

    rock_entity = RockEntity(
        id=_id,
        made_of='stone',
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


def get_nature_count():
    entity_db = get_entity_db()
    tree_count = 0
    rock_count = 0
    for entity in list(entity_db.values()):
        if isinstance(entity, TreeEntity):
            tree_count += 1
        elif isinstance(entity, RockEntity):
            rock_count += 1

    return tree_count, rock_count


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
    while tree_count < 20:
        generate_tree_entity()
        tree_count += 1
    while rock_count < 20:
        generate_rock_entity()
        rock_count += 1

    logger.info(f'Spawned {tree_count} trees and {rock_count} rocks')


class NatureGrowingSingleton(object):
    def __init__(self):
        self.last_roll = 0

    def grow_nature(self):
        changed_entities = []
        current_time = get_current_time()
        if current_time - self.last_roll > 60 * 1000:
            tree_count, rock_count = get_nature_count()
            self.last_roll = current_time
            if random.random() < 0.5:
                if tree_count < 20:
                    changed_entities.append(generate_tree_entity())
            else:
                if rock_count < 20:
                    changed_entities.append(generate_rock_entity())

        return changed_entities

nature_growing_singleton = NatureGrowingSingleton()


def grow_nature():
    return nature_growing_singleton.grow_nature()