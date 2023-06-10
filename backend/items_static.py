from typing import Literal


ITEM_SLUGS = Literal[
    'axe',
    'pickaxe',
    'wood_block',
    'stone_block',
]


def get_item_slugs():
    # As list
    return list(ITEM_SLUGS)
