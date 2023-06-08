from pydantic import BaseModel
from typing import List, Optional, Literal  # noqa


class BasicAnimation(BaseModel):
    type: Literal["shake", "rotate"]


class Coordinates(BaseModel):
    x: int
    y: int


class Sprite(BaseModel):
    slug: str
    url: str
    animation_speed: int
    coordinates: List[Coordinates]  # for sprite tile animation


class Entity(BaseModel):
    id: int
    width: int
    height: int
    x: int
    y: int
    x_from: int
    y_from: int
    speed: int
    animations: List[BasicAnimation]
    sprite: Sprite

