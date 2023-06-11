# This is a client that connects to the server. It will keep track of ongoing actions
# And send a request when it thinks there should be an update to the game state.
import socketio
import time

from time_utils import get_current_time

import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
# logger.addHandler(logging.StreamHandler())
# Add YYYY-MM-DD timestamp to log messages
logging.basicConfig(format='%(asctime)s %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
next_update = get_current_time() + 1

# standard Python
sio = socketio.Client()

logger.info("Connecting to socketio")
sio.connect('http://localhost:5174/', socketio_path='/castcraft/socket.io')

@sio.on('entity_update')
def on_entity_update(data):
    # Find the lowest action timeout
    global next_update
    lowest_timeout = get_current_time() + 10000  # 10 seconds as a default
    for entity in data.get('changedEntities', {}).values():
        if entity.get('action') is None:
            continue
        if entity['action']['timeout'] < lowest_timeout:
            lowest_timeout = entity['action']['timeout']
    
    next_update = lowest_timeout
    logger.info(f"Next update in {(next_update - get_current_time()) / 1000} seconds")


logger.info("Waiting for update: %s, %s", get_current_time(), next_update)
while True:
    time.sleep(40.0 / 1000.0)
    if get_current_time() >= next_update:
        logger.info("Requesting update")
        sio.emit('fetch_entity_update')
        next_update = get_current_time() + 10000
    else:
        pass
        # logger.info("Waiting for update: %s", next_update - get_current_time())
