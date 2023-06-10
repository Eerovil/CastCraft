# Stuff that doesn't fit anywhere else

from typing import Literal
from models import TileSize


MAP_BOUNDS = (0, 0, 60 * 32, 33 * 32)

TILE_SIZE = TileSize(width=32).width


def literal_to_list(literal: Literal):
    """
    convert a typing.Literal to a list
    """
    str_repr: str = str(literal)
    str_repr = str_repr.replace('typing.Literal[', '')
    str_repr = str_repr.replace(']', '')
    str_repr = str_repr.replace(' ', '')
    _list = str_repr.split(',')
    return [_item[1:-1] for _item in _list]
