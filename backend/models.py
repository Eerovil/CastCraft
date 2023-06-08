from pydantic import BaseModel
from typing import List, Optional, Literal  # noqa


class TileSize(BaseModel):
    width: Literal[32]


class BasicAnimation(BaseModel):
    type: Literal["shake", "rotate"]


class Sprite(BaseModel):
    url: str
    x: int
    y: int
    width: int
    height: int


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
    sprites: List[List[Sprite]]
    sprite_speed: int
