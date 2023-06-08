#! /usr/bin/python
# -*- encoding: utf-8 -*-

import datetime
import re
from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit
from sqlitedict import SqliteDict

app = Flask(__name__, static_url_path='/', static_folder='../frontend/dist/')
SqliteDict('main.db', tablename="main", autocommit=True)

app.config['SECRET_KEY'] = 'eero'
socketio = SocketIO(app)


@app.route('/')
def index():
	return redirect('/index.html')


@socketio.on('connected')
def conn(msg):
	return build_full_entity_dump()


@socketio.on('user_input')
def receive_user_input(data):
	changed_entities = handle_user_input(data)
	emit('entity_update', changed_entities, broadcast=True)


def build_full_entity_dump():
	return {}


def handle_user_input(data):
	"""
	Find user ID from data

	figure out what the input does

	return a list of entities that were affected
	"""

if __name__ == '__main__':
	socketio.run(app, debug=True, host="0.0.0.0", port=5005)
