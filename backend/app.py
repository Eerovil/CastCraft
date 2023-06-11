#! /usr/bin/python3
# -*- encoding: utf-8 -*-

from flask import Flask, request, redirect
from flask_socketio import SocketIO, emit
from sqlitedict import SqliteDict
from actions import update_actions, handle_player_touch
from db import get_entity_db
from user_utils import handle_user_connected
from nature_utils import spawn_nature_things
from inventory import select_item
from typing import List, Optional, Literal  # noqa


import logging
logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_url_path='/castcraft/', static_folder='../static/')

app.config['SECRET_KEY'] = 'eero'
socketio = SocketIO(app, path="/castcraft/socket.io", cors_allowed_origins="*")



@app.route('/')
def index():
    return redirect('/castcraft/index.html')


@app.route('/castcraft/')
def index():
    return redirect('/castcraft/index.html')


@socketio.on('connected')
def conn(data):
    logger.info("Connected: %s", data)
    print("Connected")
    nickname = data.get("nickname")
    if nickname is None:
        return

    player_entity = handle_user_connected(request.sid, nickname)

    logger.info("Player %s connected, entity id %s",
                nickname, player_entity.id if player_entity else None)

    if player_entity:
        emit('entity_update', {
            'deletedEntityIds': [],
            'changedEntities': {
                player_entity.id: player_entity.dict()
            }
        }, broadcast=True)

    return build_full_entity_dump()


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


@socketio.on('fetch_entity_update')
def fetch_entity_update():
    changed_entities, deleted_entity_ids = update_actions()
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
        "entities": {}
    }
    for entity_id, entity in entity_db.items():
        entity.update_sprites()
        entity_db[entity_id] = entity
        ret["entities"][entity_id] = entity.dict()
    return ret



if __name__ == '__main__':
    SqliteDict('entities.db', tablename="entities", autocommit=True)
    entities = get_entity_db()
    entities.clear()
    spawn_nature_things()

    socketio.run(app, debug=True, host="0.0.0.0", port=5174)
