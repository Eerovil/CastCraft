
from typing import Literal
from models import ACTION_SLUGS, Directions, Entity, Sprite

GRASS_TILE = 16


BASE_URL = 'sprites/cozy_farm/global.png'


class CozyFarmSprite(Sprite):
    url: str = BASE_URL


class GrassSprite(CozyFarmSprite):
    width: int = GRASS_TILE
    height: int = GRASS_TILE



def get_grass():
    return {
        'topLeft': GrassSprite(
            x=0 * GRASS_TILE,
            y=12 * GRASS_TILE,
        ),
        'top': GrassSprite(
            x=1 * GRASS_TILE,
            y=12 * GRASS_TILE,
        ),
        'topRight': GrassSprite(
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
        'bottomLeft': GrassSprite(
            x=0 * GRASS_TILE,
            y=14 * GRASS_TILE,
        ),
        'bottom': GrassSprite(
            x=1 * GRASS_TILE,
            y=14 * GRASS_TILE,
        ),
        'bottomRight': GrassSprite(
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
        'water': GrassSprite(
            x=12 * GRASS_TILE,
            y=13 * GRASS_TILE,
        ),
    }


ANIMAL_TILE = 16
ANIMAL_BASE_URL = 'sprites/cozy_farm/animals/'

BaseAnimalSlug = Literal["chicken"]
AnimalSlug = Literal["chicken animation", "chicken_baby animation", "chicken_brown animation"]


class Animal(Entity):
    width: int = 32
    height: int = 32

    x_offset: int = 0
    y_offset: int = 0

    base_animal_slug: BaseAnimalSlug
    animal_slug: AnimalSlug

    last_update: int = 0

    on_touch: ACTION_SLUGS = "pick_up"

    def update_sprites(self):
        tool = "walk"  # If we don't have an action, we're walking with 0 speed
        self.animation_speed = 2

        if self.action:
            if self.action.action == 'move':
                tool = "walk"
            elif self.action.action == 'sleep':
                tool = "sleep"
        else:
            tool = "walk"
            self.animation_speed = 0

        if tool == "walk":
            if self.direction == Directions.down:
                y = 0
            elif self.direction == Directions.up:
                y = 1
            elif self.direction == Directions.right:
                y = 2
            elif self.direction == Directions.left:
                y = 3
        elif tool == "sleep":
            y = 4

        sprites = []
        for x in range(4):
            sprites.append([
                Sprite(
                    url=f'{ANIMAL_BASE_URL}{self.animal_slug}.png',
                    x=x * ANIMAL_TILE,
                    y=y * ANIMAL_TILE,
                    width=ANIMAL_TILE,
                    height=ANIMAL_TILE,
                )
            ])
        self.sprites = sprites
