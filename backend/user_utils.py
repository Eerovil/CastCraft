import logging
import random
from utils import get_random_free_position
from entity_types.minecraft_things import MinecraftItem

from db import get_entity_db, get_free_entity_id, get_user_db
from entity_types.cozy_character import CharacterChoice, CozyEntity, get_all_choices
from models import Directions, Item, User, Inventory
from time_utils import get_current_time

from typing import Optional


logger = logging.getLogger(__name__)


def get_user_from_request(request_sid):
    user_db = get_user_db()
    for user in user_db.values():
        if user.request_id == request_sid:
            return user


def get_player_entity_from_request(request_sid) -> Optional[CozyEntity]:
    user = get_user_from_request(request_sid)
    if user is None:
        logger.warning("No user found for request %s", request_sid)
        return None
    entity_db = get_entity_db()
    ret = entity_db.get(user.entity_id)
    if not ret:
        logger.warning("No entity found for user %s", user)
        return None
    return ret


def get_random_character_choice():
    char_choices = get_all_choices()
    clothes = random.choice(list(char_choices['clothes'].keys()))
    clothes_color = random.randrange(0, char_choices['clothes'][clothes])
    pants = random.choice(list(char_choices['pants'].keys()))
    pants_color = random.randrange(0, char_choices['pants'][pants])
    shoes = random.choice(list(char_choices['shoes'].keys()))
    shoes_color = random.randrange(0, char_choices['shoes'][shoes])
    eyes = 'eyes'
    eyes_color = random.randrange(0, char_choices['eyes'][eyes])
    hair = random.choice(list(char_choices['hair'].keys()))
    hair_color = random.randrange(0, char_choices['hair'][hair])
    acc = random.choice(list(char_choices['acc'].keys()))
    acc_color = random.randrange(0, char_choices['acc'][acc])

    return CharacterChoice(
        char_index=random.randrange(0, 8),
        clothes=clothes,
        clothes_color=clothes_color,
        pants=pants,
        pants_color=pants_color,
        # shoes=shoes,
        # shoes_color=shoes_color,
        eyes=eyes,
        eyes_color=eyes_color,
        hair=hair,
        hair_color=hair_color,
        # acc=acc,
        # acc_color=acc_color,
    )


def generate_player_entity():
    _id = get_free_entity_id()

    x, y = get_random_free_position(0, 0, 100, 100)


    player_entity = CozyEntity(
        id=_id,
        width=64,
        height=64,
        x=x,
        y=y,
        x_from=0,
        y_from=0,
        speed=0,
        animations=[],
        animation_speed=2,  # 10 ticks per animation
        sprites=[],
        direction=Directions.down,
        choice=get_random_character_choice(),
        holding=MinecraftItem(
            slug="axe",
            woodcutting=10,
            mining=1,
        ),
        inventory=Inventory(
            items=[
                MinecraftItem(
                    slug="axe",
                    woodcutting=10,
                    mining=1,
                ),
                MinecraftItem(
                    slug="pickaxe",
                    woodcutting=1,
                    mining=10,
                ),
            ]
        )
    )
    player_entity.update_sprites()
    entity_db = get_entity_db()
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

    entity = None
    entity_db = get_entity_db()
    if nickname and nickname != 'TV':
        entity = entity_db.get(user.entity_id)
        if entity is None:
            entity = generate_player_entity()
        if entity.nickname != nickname:
            del entity_db[entity.id]
            entity = generate_player_entity()
        elif not isinstance(entity, CozyEntity):
            del entity_db[entity.id]
            entity = generate_player_entity()
        entity.nickname = nickname
        entity_db[entity.id] = entity
        user.entity_id = entity.id

    # Delete entities that have no nickname
    for entity in list(entity_db.values()):
        if not isinstance(entity, CozyEntity):
            continue
        if not entity.nickname:
            del entity_db[entity.id]

    user_db[nickname] = user
    return entity
