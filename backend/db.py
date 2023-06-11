from sqlitedict import SqliteDict

from models import Entity
from utils import get_position_is_in_bounds

from typing import Optional

import random


def get_entity_db():
    return SqliteDict('entities.db', tablename="entities", autocommit=True)


def get_user_db():
    return SqliteDict('nicknames.db', tablename="nicknames", autocommit=True)


def get_entity_at_position(x, y) -> Optional[Entity]:
    entity_db = get_entity_db()
    for entity in entity_db.values():
        if not entity:
            continue
        if entity.x == x and entity.y == y:
            return entity
    return None


def get_free_entity_id():
    _id = 0
    entity_db = get_entity_db()
    while str(_id) in entity_db:
        _id += 1
    _id = str(_id)
    # Create dummy entity at this id
    entity_db[_id] = Entity(id=_id, x=-9999, y=-9999, width=64, height=64)
    return _id


def get_random_free_position(top_left_x, top_left_y, bottom_right_x, bottom_right_y, allow_edges=True):
    x, y = None, None
    while (
                x is None or
                y is None or
                get_entity_at_position(x, y) is not None or
                not get_position_is_in_bounds(x, y, allow_edges=allow_edges)
            ):
        x, y = random.randrange(top_left_x, bottom_right_x) * 32, random.randrange(top_left_y, bottom_right_y) * 32
    return x, y
