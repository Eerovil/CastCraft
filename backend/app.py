#! /usr/bin/python3
# -*- encoding: utf-8 -*-

import re
from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit
from sqlitedict import SqliteDict
from time_utils import get_current_time
from entity_types.cozy_character import get_tiles_for, CharacterChoice, CozyEntity
from models import Entity, Directions, TileSize, Action  # noqa
from typing import List, Optional, Literal  # noqa

TILE_SIZE = TileSize(width=32).width

import logging
logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_url_path='/', static_folder='../static/')
SqliteDict('entities.db', tablename="entities", autocommit=True)

app.config['SECRET_KEY'] = 'eero'
socketio = SocketIO(app)


@app.route('/')
def index():
    return redirect('/index.html')


@socketio.on('connected')
def conn(msg):
    print("Connected")
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


def init_test_entity_db():
    first_entity = CozyEntity(
        id="0",
        width=32,
        height=32,
        x=0,
        y=0,
        x_from=0,
        y_from=0,
        speed=0,
        animations=[],
        animation_speed=2,  # 10 ticks per animation
        sprites=[],
        sprite_speed=1,
        direction=Directions.down,
        choice=CharacterChoice(
            char_index=0,
            clothes="basic",
            pants="pants",
            shoes="shoes",
            eyes="eyes",
            eyes_color=2,
            acc=None,
            hair=None,
        )
    )
    first_entity.update_sprites()

    second_entity = CozyEntity(
        id="1",
        width=32,
        height=32,
        x=1 * 32,
        y=1 * 32,
        x_from=0,
        y_from=0,
        speed=0,
        animations=[],
        animation_speed=2,  # 10 ticks per animation
        sprites=[],
        sprite_speed=1,
        direction=Directions.down,
        choice=CharacterChoice(
            char_index=2,
            clothes="basic",
            pants="pants",
            shoes="shoes",
            eyes="eyes",
            eyes_color=3,
            acc=None,
            hair=None,
        )
    )
    second_entity.update_sprites()

    entity_db = get_entity_db()
    entity_db[first_entity.id] = first_entity
    entity_db[second_entity.id] = second_entity


def handle_player_move(direction):
    """
    Find user ID from data  TODO

    figure out what the input does

    return a list of entities that were affected
    """
    entity_db = get_entity_db()

    player_entity = entity_db["0"]

    if player_entity.action is not None:
        logger.info("Player is already doing something")
        return [], []

    player_entity.x_from = player_entity.x
    player_entity.y_from = player_entity.y
    logger.info(f"Player started moving from {player_entity.x} to direction {direction}")
    if direction == Directions.up:
        player_entity.y -= TILE_SIZE
        player_entity.direction = Directions.up
    elif direction == Directions.down:
        player_entity.y += TILE_SIZE
        player_entity.direction = Directions.down
    elif direction == Directions.left:
        player_entity.x -= TILE_SIZE
        player_entity.direction = Directions.left
    elif direction == Directions.right:
        player_entity.x += TILE_SIZE
        player_entity.direction = Directions.right

    player_entity.action = Action(
        action='move',
        time=2000,
        timeout=get_current_time() + 2000
    )
    player_entity.update_sprites()

    entity_db[player_entity.id] = player_entity

    return [], [player_entity]


if __name__ == '__main__':
    init_test_entity_db()
    socketio.run(app, debug=True, host="0.0.0.0", port=5174)
