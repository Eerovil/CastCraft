import logging
import random

from db import get_entity_db, get_user_db
from entity_types.cozy_character import CharacterChoice, CozyEntity
from models import Directions, Item, User
from time_utils import get_current_time
logger = logging.getLogger(__name__)


def get_user_from_request(request_sid):
    user_db = get_user_db()
    for user in user_db.values():
        if user.request_id == request_sid:
            return user


def get_player_entity_from_request(request_sid):
    user = get_user_from_request(request_sid)
    if user is None:
        return None
    entity_db = get_entity_db()
    ret = entity_db.get(user.entity_id)
    if not ret:
        logger.warning("No entity found for user %s", user)
        return None
    return ret


def generate_player_entity():
    _id = 0
    entity_db = get_entity_db()
    while str(_id) in entity_db:
        _id += 1
    _id = str(_id)
    player_entity = CozyEntity(
        id=_id,
        width=64,
        height=64,
        x=random.randrange(2, 15) * 32,
        y=random.randrange(2, 15) * 32,
        x_from=0,
        y_from=0,
        speed=0,
        animations=[],
        animation_speed=2,  # 10 ticks per animation
        sprites=[],
        direction=Directions.down,
        choice=CharacterChoice(
            char_index=random.randrange(0, 8),
            clothes="basic",
            pants="pants",
            shoes="shoes",
            eyes="eyes",
            eyes_color=2,
            acc=None,
            hair=None,
        ),
        holding=Item(
            id="0",
            slug="axe"
        )
    )
    player_entity.update_sprites()
    entity_db[_id] = player_entity
    return player_entity


def handle_user_connected(request_sid, nickname):
    user_db = get_user_db()
    user = user_db.get(nickname)
    if user is None:
        user = User(
            nickname=nickname,
            entity_id='',
            last_seen=get_current_time(),
            request_id=request_sid
        )
    user.last_seen = get_current_time()
    user.request_id = request_sid

    entity_db = get_entity_db()
    entity = entity_db.get(user.entity_id)
    if entity is None:
        entity = generate_player_entity()
    if entity.nickname != nickname:
        entity = generate_player_entity()
    elif not isinstance(entity, CozyEntity):
        entity = generate_player_entity()
    entity.nickname = nickname
    entity_db[entity.id] = entity
    user.entity_id = entity.id

    user_db[nickname] = user