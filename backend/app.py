#! /usr/bin/python3
# -*- encoding: utf-8 -*-

import datetime
import re
from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit
from sqlitedict import SqliteDict
from entity_types.cozy_character import get_tiles_for, CharacterChoice
from models import Entity

import logging
logger = logging.getLogger(__name__)

app = Flask(__name__, static_url_path='/', static_folder='../static/')
SqliteDict('main.db', tablename="main", autocommit=True)

app.config['SECRET_KEY'] = 'eero'
socketio = SocketIO(app)


@app.route('/')
def index():
    return redirect('/index.html')


@socketio.on('connected')
def conn(msg):
    print("Connected")
    return build_full_entity_dump()


@socketio.on('user_input')
def receive_user_input(data):
    changed_entities = handle_user_input(data)
    emit('entity_update', changed_entities, broadcast=True)


def build_full_entity_dump():
    sprites = get_tiles_for(CharacterChoice(
        char_index=0,
        clothes="dress ",
        clothes_color=0,
        eyes="eyes",
        eyes_color=0,
        acc="glasses",
        acc_color=0,
        hair="curly",
        hair_color=6
    ), "pickaxe", 2)
    first_entity = Entity(
        id=0,
        width=80,
        height=150,
        x=0,
        y=0,
        x_from=0,
        y_from=0,
        speed=0,
        animations=[],
        sprites=sprites,
        sprite_speed=1,
    )

    return {
        "entities": {
            "0": first_entity.dict()
        }
    }


def handle_user_input(data):
    """
    Find user ID from data

    figure out what the input does

    return a list of entities that were affected
    """


if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0", port=5174)
