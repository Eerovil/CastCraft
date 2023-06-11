
from models import Sprite

GRASS_TILE = 16


BASE_URL = 'castcraft/sprites/cozy_farm/global.png'


class CozyFarmSprite(Sprite):
    url: str = BASE_URL


class GrassSprite(CozyFarmSprite):
    width: int = GRASS_TILE
    height: int = GRASS_TILE



def get_grass():
    return {
        'top-left': GrassSprite(
            x=0 * GRASS_TILE,
            y=12 * GRASS_TILE,
        ),
        'top': GrassSprite(
            x=1 * GRASS_TILE,
            y=12 * GRASS_TILE,
        ),
        'top-right': GrassSprite(
            x=2 * GRASS_TILE,
            y=12 * GRASS_TILE,
        ),
        'left': GrassSprite(
            x=0 * GRASS_TILE,
            y=13 * GRASS_TILE,
        ),
        'center': GrassSprite(
            x=1 * GRASS_TILE,
            y=13 * GRASS_TILE,
        ),
        'right': GrassSprite(
            x=2 * GRASS_TILE,
            y=13 * GRASS_TILE,
        ),
        'bottom-left': GrassSprite(
            x=0 * GRASS_TILE,
            y=14 * GRASS_TILE,
        ),
        'bottom': GrassSprite(
            x=1 * GRASS_TILE,
            y=14 * GRASS_TILE,
        ),
        'bottom-right': GrassSprite(
            x=2 * GRASS_TILE,
            y=14 * GRASS_TILE,
        ),
        'extra1': GrassSprite(
            x=5 * GRASS_TILE,
            y=0 * GRASS_TILE,
        ),
        'extra2': GrassSprite(
            x=6 * GRASS_TILE,
            y=0 * GRASS_TILE,
        ),
        'extra3': GrassSprite(
            x=7 * GRASS_TILE,
            y=0 * GRASS_TILE,
        ),
        'extra4': GrassSprite(
            x=8 * GRASS_TILE,
            y=0 * GRASS_TILE,
        ),
        'extra5': GrassSprite(
            x=9 * GRASS_TILE,
            y=0 * GRASS_TILE,
        ),
        'extra6': GrassSprite(
            x=10 * GRASS_TILE,
            y=0 * GRASS_TILE,
        ),
        'extra7': GrassSprite(
            x=11 * GRASS_TILE,
            y=0 * GRASS_TILE,
        ),
    }