from pydantic import BaseModel
from typing import List, Optional, Literal  # noqa


class DirectionsType(BaseModel):
    down: Literal[0]
    up: Literal[1]
    right: Literal[2]
    left: Literal[3]


Directions = DirectionsType(down=0, up=1, right=2, left=3)


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


class Action(BaseModel):
    timeout: int  # When it will finish
    time: int  # How long it takes from start to finish (ms)
    action: Literal["move", "attack"]
    target_id: Optional[int]


class Entity(BaseModel):
    id: str
    nickname: str = ''
    width: int = 64
    height: int = 64
    x: int
    y: int
    x_from: int = 0
    y_from: int = 0
    x_offset: int = -32 / 2
    y_offset: int = -34
    speed: int = 0
    direction: Literal[0, 1, 2, 3] = 0  # Where facing
    animations: List[BasicAnimation] = []
    animation_speed: int = 0
    sprites: List[List[Sprite]] = []
    action: Optional[Action]

    def update_sprites(self):
        raise NotImplementedError("TODO")


class User(BaseModel):
    nickname: str
    entity_id: str  # Entity this player is controlling
    last_seen: int  # Last time this player was seen
    request_id: Optional[str]  # Request ID for this player
