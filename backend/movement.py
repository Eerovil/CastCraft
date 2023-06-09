

from db import get_entity_at_position, get_entity_db
from user_utils import get_player_entity_from_request
from utils import MAP_BOUNDS, TILE_SIZE
from models import Action, Directions, Entity

import logging

from time_utils import get_current_time
logger = logging.getLogger(__name__)


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


def handle_player_move(request, direction):
    """
    figure out what the input does

    return a list of entities that were affected
    """
    player_entity = get_player_entity_from_request(request)
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
