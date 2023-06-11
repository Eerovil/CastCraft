from pydantic import BaseModel
from typing import List, Optional, Literal

from time_utils import get_current_time

try:
    from items_static import ITEM_SLUGS  # noqa
except ImportError:
    # For pydantic2ts
    from .items_static import ITEM_SLUGS  # noqa


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


ACTION_SLUGS = Literal["move", "swing", "to_inventory", "pick_up", "place"]


class Action(BaseModel):
    timeout: int  # When it will finish
    time: int  # How long it takes from start to finish (ms)
    action: ACTION_SLUGS
    target_id: Optional[str]


ENTITY_MADE_OF = Literal["flesh", "wood", "stone", "iron", "gold", "diamond"]


class Item(BaseModel):
    quantity: int = 1  # Single item can merge with other same items
    slug: Literal[ITEM_SLUGS]
    sprite: Optional[Sprite] = None
    woodcutting: Optional[int] = None
    mining: Optional[int] = None
    watering: Optional[int] = None

    def get_material_swinging_efficiency(self, material: ENTITY_MADE_OF):
        if material == "wood":
            if self.woodcutting is None:
                return 0
            return self.woodcutting
        elif material == "stone":
            if self.mining is None:
                return 0
            return self.mining
        elif material == "flesh":
            return 0


class Inventory(BaseModel):
    items: List[Item] = []
    slots: int = 5


class Entity(BaseModel):
    id: str

    made_of: ENTITY_MADE_OF = "flesh"
    nickname: str = ''
    width: int = 64
    height: int = 64
    x: int
    y: int
    x_from: int = 0
    y_from: int = 0
    x_offset: int = -32 / 2
    y_offset: int = -34

    # Bounds for movement (Given as tile coordinates)
    x_bound: int = 1
    y_bound: int = 1

    speed: int = 0
    direction: Literal[0, 1, 2, 3] = 0  # Where facing
    animations: List[BasicAnimation] = []
    animation_speed: int = 0
    sprites: List[List[Sprite]] = []
    action: Optional[Action]

    holding: Optional[Item] = None

    carrying_entity_id: Optional[str] = None
    carried_by_entity_id: Optional[str] = None

    # What happens when user tries to walk into this entity
    on_touch: Optional[ACTION_SLUGS] = None

    inventory: Optional[Inventory] = None

    def update_sprites(self):
        return

    def on_swing_destroy(self):
        return

    def start_moving(self, target_x, target_y):
        self.x_from = self.x
        self.y_from = self.y
        self.x = target_x
        self.y = target_y

        self.action = Action(
            action='move',
            time=1000,
            timeout=get_current_time() + 1000
        )

    def finish_moving(self):
        self.x_from = self.x
        self.y_from = self.y
        self.action = None


class User(BaseModel):
    nickname: str
    entity_id: str  # Entity this player is controlling
    last_seen: int  # Last time this player was seen
    request_id: Optional[str]  # Request ID for this player
