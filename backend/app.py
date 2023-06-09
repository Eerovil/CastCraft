#! /usr/bin/python3
# -*- encoding: utf-8 -*-

import re
import random
from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit
from sqlitedict import SqliteDict
from time_utils import get_current_time
from entity_types.cozy_character import get_tiles_for, CharacterChoice, CozyEntity
from models import Entity, Directions, TileSize, Action, User  # noqa
from typing import List, Optional, Literal  # noqa

TILE_SIZE = TileSize(width=32).width

import logging
logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_url_path='/', static_folder='../static/')
SqliteDict('entities.db', tablename="entities", autocommit=True)

app.config['SECRET_KEY'] = 'eero'
socketio = SocketIO(app)


MAP_BOUNDS = (0, 0, 60 * 32, 33 * 32)


@app.route('/')
def index():
    return redirect('/index.html')


@socketio.on('connected')
def conn(data):
    logger.info("Connected: %s", data)
    print("Connected")
    nickname = data.get("nickname")
    if nickname is None:
        return
    user_db = get_user_db()
    user = user_db.get(nickname)
    if user is None:
        user = User(
            nickname=nickname,
            entity_id='',
            last_seen=get_current_time(),
            request_id=request.sid
        )
    user.last_seen = get_current_time()
    user.request_id = request.sid

    entity_db = get_entity_db()
    entity = entity_db.get(user.entity_id)
    if entity is None:
        entity = generate_player_entity()
    entity.nickname = nickname
    entity_db[entity.id] = entity
    user.entity_id = entity.id

    user_db[nickname] = user

    return build_full_entity_dump()


@socketio.on('movePlayer')
def receive_move_player(data):
    if data.get("direction") is None:
        return

    direction: Literal[0, 1, 2, 3] = data["direction"]
    logger.info(f"Received move player: {direction}")
    deleted_entity_ids, changed_entities = handle_player_move(direction)
    emit('entity_update', {
        'deletedEntityIds': deleted_entity_ids,
        'changedEntities': {
            entity.id: entity.dict() for entity in changed_entities
        }
    }, broadcast=True)


@socketio.on('fetch_entity_update')
def fetch_entity_update():
    changed_entities = update_actions()
    emit('entity_update', {
        'deletedEntityIds': [],
        'changedEntities': {
            entity.id: entity.dict() for entity in changed_entities
        }
    }, broadcast=True)


def get_user_from_request():
    user_db = get_user_db()
    for user in user_db.values():
        if user.request_id == request.sid:
            return user


def get_player_entity_from_request():
    user = get_user_from_request()
    if user is None:
        return None
    entity_db = get_entity_db()
    ret = entity_db.get(user.entity_id)
    if not ret:
        logger.warning("No entity found for user %s", user)
        return None
    return ret


def build_full_entity_dump():
    entity_db = get_entity_db()
    ret = {
        "entities": {}
    }
    for entity_id, entity in entity_db.items():
        ret["entities"][entity_id] = entity.dict()
    return ret


def get_entity_db():
    return SqliteDict('entities.db', tablename="entities", autocommit=True)


def get_user_db():
    return SqliteDict('nicknames.db', tablename="nicknames", autocommit=True)


def handle_action_finished(entity: Entity, action: Action, entity_db: SqliteDict):
    if action.action == 'move':
        entity.x_from = entity.x
        entity.y_from = entity.y
        entity.action = None
        entity.update_sprites()
        entity_db[entity.id] = entity



def update_actions() -> list:
    """
    Handle actions in progress, and remove them if they are done
    """
    entity_db = get_entity_db()
    finished_action = []
    now = get_current_time()
    for entity_id, entity in entity_db.items():
        if entity.action is None:
            continue
        if entity.action.timeout < now:
            finished_action.append(entity)
            continue
    
    if len(finished_action) == 0:
        return []

    for entity in finished_action:
        handle_action_finished(entity, entity.action, entity_db)

    return finished_action


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
        sprite_speed=1,
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
        )
    )
    player_entity.update_sprites()
    entity_db[_id] = player_entity
    return player_entity


def get_entity_at_position(x, y):
    entity_db = get_entity_db()
    for entity in entity_db.values():
        if entity.x == x and entity.y == y:
            return entity
    return None


def fix_player_if_out_of_bounds(entity: Entity):
    if entity.x < MAP_BOUNDS[0]:
        entity.x = MAP_BOUNDS[0]
    if entity.x > MAP_BOUNDS[2]:
        entity.x = MAP_BOUNDS[2]
    if entity.y < MAP_BOUNDS[1]:
        entity.y = MAP_BOUNDS[1]
    if entity.y > MAP_BOUNDS[3]:
        entity.y = MAP_BOUNDS[3]


def get_moving_allowed_to(x, y, entity: Entity):
    if x < MAP_BOUNDS[0]:
        return False
    if x > MAP_BOUNDS[2]:
        return False
    if y < MAP_BOUNDS[1]:
        return False
    if y > MAP_BOUNDS[3]:
        return False
    
    blocking_entity = get_entity_at_position(x, y)
    if blocking_entity is not None and blocking_entity.id != entity.id:
        return False
    
    return True


def handle_player_move(direction):
    """
    Find user ID from data  TODO

    figure out what the input does

    return a list of entities that were affected
    """
    player_entity = get_player_entity_from_request()
    entity_db = get_entity_db()

    if player_entity.action is not None:
        logger.info("Player is already doing something")
        return [], []

    player_entity.x_from = player_entity.x
    player_entity.y_from = player_entity.y
    logger.info(f"Player started moving from {player_entity.x} to direction {direction}")

    target_x = player_entity.x
    target_y = player_entity.y

    if direction == Directions.up:
        target_y -= TILE_SIZE
        player_entity.direction = Directions.up
    elif direction == Directions.down:
        target_y += TILE_SIZE
        player_entity.direction = Directions.down
    elif direction == Directions.left:
        target_x -= TILE_SIZE
        player_entity.direction = Directions.left
    elif direction == Directions.right:
        target_x += TILE_SIZE
        player_entity.direction = Directions.right

    if get_moving_allowed_to(target_x, target_y, player_entity) is False:
        logger.info(f"Player can't move to {target_x}, {target_y}")
        fix_player_if_out_of_bounds(player_entity)
    else:
        player_entity.x = target_x
        player_entity.y = target_y
        player_entity.action = Action(
            action='move',
            time=1000,
            timeout=get_current_time() + 1000
        )
    player_entity.update_sprites()

    entity_db[player_entity.id] = player_entity

    return [], [player_entity]


if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0", port=5174)
