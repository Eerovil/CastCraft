#! /usr/bin/python3
# -*- encoding: utf-8 -*-

import os
from flask import Flask, request, redirect
from flask_socketio import SocketIO, emit
from sqlitedict import SqliteDict
from actions import handle_player_action, update_actions, handle_player_touch
from animals import check_stuck_animals, move_animals, spawn_animals
from utils import MAP_BOUNDS
from entity_types.cozy_farm import Animal, get_grass
from time_utils import get_current_time
from db import get_entity_db
from user_utils import handle_user_connected
from nature_utils import grow_nature, spawn_nature_things
from inventory import select_item
from typing import List, Optional, Literal  # noqa


import logging
logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)


def debug_mode():
    return os.environ.get('CC_DEBUG', False) == '1'


if not debug_mode():
    import sentry_sdk
    from sentry_sdk.integrations.flask import FlaskIntegration
    sentry_sdk.init(
        dsn="https://f9913dcaee9f42bb9ad1ef91e04f2261@o4505339492433920.ingest.sentry.io/4505361727225856",
        integrations=[
            FlaskIntegration(),
        ],

        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        # We recommend adjusting this value in production.
        traces_sample_rate=1.0
    )

app = Flask(__name__, static_url_path='/castcraft/', static_folder='../static/')

app.config['SECRET_KEY'] = 'eero'
socketio = SocketIO(app, path="/castcraft/socket.io", cors_allowed_origins="*")



@app.route('/')
def index():
    return redirect('/castcraft/index.html')


@app.route('/castcraft/')
def index2():
    return redirect('/castcraft/index.html')


@app.route('/castcraft/api/firstConnect', methods=['POST'])
def conn():
    data = request.get_json()
    logger.info("Connected: %s", data)
    nickname = data.get("nickname")
    request_sid = data.get("requestSid")
    if nickname:
        player_entity = handle_user_connected(request_sid, nickname)

        logger.info("Player %s connected, entity id %s",
                    nickname, player_entity.id if player_entity else None)

        if player_entity:
            socketio.emit('entity_update', {
                'deletedEntityIds': [],
                'changedEntities': {
                    player_entity.id: player_entity.dict()
                }
            })

    return build_full_entity_dump()


@app.route('/castcraft/api/ping', methods=['POST'])
def ping():
    return {"serverTime": get_current_time()}


@socketio.on('movePlayer')
def receive_move_player(data):
    """
    User tapped to move or touched soething that is next to them
    """
    if data.get("direction") is None:
        return

    direction: Literal[0, 1, 2, 3] = data["direction"]
    logger.info(f"Received move player: {direction}")
    deleted_entity_ids, changed_entities = handle_player_touch(request.sid, direction)
    if len(deleted_entity_ids) == 0 and len(changed_entities) == 0:
        return
    emit('entity_update', {
        'deletedEntityIds': deleted_entity_ids,
        'changedEntities': {
            entity.id: entity.dict() for entity in changed_entities
        }
    }, broadcast=True)


@socketio.on('selectItem')
def receive_select_item(data):
    """
    User tapped to move or touched soething that is next to them
    """
    if data.get("item") is None:
        return

    logger.info(f"Received select item: {data['item']}")
    item = data['item']
    deleted_entity_ids, changed_entities = select_item(request.sid, item['slug'])
    if len(deleted_entity_ids) == 0 and len(changed_entities) == 0:
        return
    emit('entity_update', {
        'deletedEntityIds': deleted_entity_ids,
        'changedEntities': {
            entity.id: entity.dict() for entity in changed_entities
        }
    }, broadcast=True)


@socketio.on('playerAction')
def receive_player_action(data):
    """
    User tapped on player
    """
    deleted_entity_ids, changed_entities = handle_player_action(request.sid)
    if len(deleted_entity_ids) == 0 and len(changed_entities) == 0:
        return
    emit('entity_update', {
        'deletedEntityIds': deleted_entity_ids,
        'changedEntities': {
            entity.id: entity.dict() for entity in changed_entities
        }
    }, broadcast=True)



def game_tick():
    changed_entities, deleted_entity_ids = [], []
    changed_entities += grow_nature()
    changed_entities += move_animals()
    return changed_entities, deleted_entity_ids


@socketio.on('fetch_entity_update')
def fetch_entity_update():
    changed_entities, deleted_entity_ids = update_actions()
    changed_entities2, deleted_entity_ids2 = game_tick()
    changed_entities += changed_entities2
    deleted_entity_ids += deleted_entity_ids2
    if len(changed_entities) == 0:
        return
    emit('entity_update', {
        'deletedEntityIds': deleted_entity_ids,
        'changedEntities': {
            entity.id: entity.dict() for entity in changed_entities
        }
    }, broadcast=True)


def build_full_entity_dump():
    update_actions()
    entity_db = get_entity_db()
    ret = {
        "entities": {},
        "background": {
            "grass": {
                key: value.dict() for key, value in get_grass().items()
            }
        },
        "mapSize": MAP_BOUNDS,
    }
    for entity_id, entity in entity_db.items():
        entity.update_sprites()
        entity_db[entity_id] = entity
        ret["entities"][entity_id] = entity.dict()
    return ret



if __name__ == '__main__':
    SqliteDict('entities.db', tablename="entities", autocommit=True)

    import sys
    # If --reset is passed, clear the database
    if "--reset" in sys.argv:
        logger.info("Resetting database")
        entities = get_entity_db()
        entities.clear()
        spawn_nature_things()
        spawn_animals()

    if "--reset_animals" in sys.argv:
        logger.info("Resetting animals")
        entities = get_entity_db()
        for entity_id, entity in entities.items():
            if isinstance(entity, Animal):
                del entities[entity_id]
        spawn_animals()

    check_stuck_animals()

    socketio.run(app, debug=True, host="0.0.0.0", port=5174)
