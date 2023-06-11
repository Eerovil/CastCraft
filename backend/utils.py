# Stuff that doesn't fit anywhere else

import random
from typing import Literal
from db import get_entity_at_position
from models import Directions, TileSize


MAP_BOUNDS = (2 * 32, 2 * 32, 57 * 32, 31 * 32)

TILE_SIZE = TileSize(width=32).width


def literal_to_list(literal: Literal):
    """
    convert a typing.Literal to a list
    """
    str_repr: str = str(literal)
    str_repr = str_repr.replace('typing.Literal[', '')
    str_repr = str_repr.replace(']', '')
    str_repr = str_repr.replace(", ", ",")
    str_repr = str_repr.replace("'", "")
    _list = str_repr.split(',')
    return [_item for _item in _list]


def get_position_is_in_bounds(x, y, allow_edges=True):
    if x < MAP_BOUNDS[0]:
        return False
    if x > MAP_BOUNDS[2]:
        return False
    if y < MAP_BOUNDS[1]:
        return False
    if y > MAP_BOUNDS[3]:
        return False

    if not allow_edges:
        if x == MAP_BOUNDS[0]:
            return False
        if x == MAP_BOUNDS[2]:
            return False
        if y == MAP_BOUNDS[1]:
            return False
        if y == MAP_BOUNDS[3]:
            return False

    return True


def coordinates_are_walkable(x, y):
    if x is None or y is None:
        return False
    return get_position_is_in_bounds(x, y) and get_entity_at_position(x, y) is None


def get_random_free_position(top_left_x, top_left_y, bottom_right_x, bottom_right_y, allow_edges=True):
    x, y = None, None
    while (not coordinates_are_walkable(x, y)):
        x, y = random.randrange(top_left_x, bottom_right_x) * 32, random.randrange(top_left_y, bottom_right_y) * 32
    return x, y


def move_coordinates_at_direction(x, y, direction):
    x = int(x)
    y = int(y)
    if direction == Directions.up:
        y -= TILE_SIZE
    elif direction == Directions.down:
        y += TILE_SIZE
    elif direction == Directions.left:
        x -= TILE_SIZE
    elif direction == Directions.right:
        x += TILE_SIZE
    return x, y
