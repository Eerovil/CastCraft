#! /usr/bin/python
# -*- encoding: utf-8 -*-

import datetime
import re
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from sqlitedict import SqliteDict

app = Flask(__name__, template_folder='templates', static_url_path='../frontend/dist/', static_folder='static')
SqliteDict('main.db', tablename="main", autocommit=True)

app.config['SECRET_KEY'] = 'eero'
socketio = SocketIO(app)


@app.route('/')
def index():
	return render_template('./index.html')


if __name__ == '__main__':
	socketio.run(app, debug=True, host="0.0.0.0", port=5005)
