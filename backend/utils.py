# Stuff that doesn't fit anywhere else

from typing import Literal
from models import TileSize


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
