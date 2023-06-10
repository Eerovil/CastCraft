#! /usr/bin/python3
# -*- encoding: utf-8 -*-

from flask import Flask, request, redirect
from flask_socketio import SocketIO, emit
from sqlitedict import SqliteDict
from actions import update_actions
from db import get_entity_db
from movement import handle_player_move
from user_utils import handle_user_connected
from nature_utils import spawn_nature_things
from typing import List, Optional, Literal  # noqa


import logging
logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_url_path='/', static_folder='../static/')

app.config['SECRET_KEY'] = 'eero'
socketio = SocketIO(app)



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

    handle_user_connected(request.sid, nickname)

    return build_full_entity_dump()


@socketio.on('movePlayer')
def receive_move_player(data):
    if data.get("direction") is None:
        return

    direction: Literal[0, 1, 2, 3] = data["direction"]
    logger.info(f"Received move player: {direction}")
    deleted_entity_ids, changed_entities = handle_player_move(request.sid, direction)
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
    changed_entities = update_actions()
    if len(changed_entities) == 0:
        return
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
