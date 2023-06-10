
from typing import Optional
from time_utils import get_current_time

from sqlitedict import SqliteDict

from db import get_entity_at_position, get_entity_db
from user_utils import get_player_entity_from_request
from utils import MAP_BOUNDS, TILE_SIZE
from models import ACTION_SLUGS, Action, Directions, Entity

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


def get_position_is_in_bounds(x, y, entity: Entity):
    if x < MAP_BOUNDS[0]:
        return False
    if x > MAP_BOUNDS[2]:
        return False
    if y < MAP_BOUNDS[1]:
        return False
    if y > MAP_BOUNDS[3]:
        return False

    return True


def get_target_position_from_direction(direction, entity: Entity):
    target_x = entity.x
    target_y = entity.y

    if direction == Directions.up:
        target_y -= TILE_SIZE
        entity.direction = Directions.up
    elif direction == Directions.down:
        target_y += TILE_SIZE
        entity.direction = Directions.down
    elif direction == Directions.left:
        target_x -= TILE_SIZE
        entity.direction = Directions.left
    elif direction == Directions.right:
        target_x += TILE_SIZE
        entity.direction = Directions.right

    return target_x, target_y


def handle_player_touch(request, direction):
    """
    figure out what the input does

    return a list of entities that were affected
    """
    player_entity = get_player_entity_from_request(request)
    entity_db = get_entity_db()

    if player_entity.action is not None:
        logger.info("Player is already doing something")
        return [], []

    target_x, target_y = get_target_position_from_direction(direction, player_entity)

    blocking_entity = get_entity_at_position(target_x, target_y)

    action: Optional[ACTION_SLUGS] = None
    if blocking_entity is None:
        action = "move"
    else:
        action = blocking_entity.on_touch

    if action == "move":
        # Additional check to make sure the player doesn't move out of bounds
        if not get_position_is_in_bounds(target_x, target_y, player_entity):
            logger.info(f"Player can't move to {target_x}, {target_y}")
            fix_player_if_out_of_bounds(player_entity)      
            action = None  
    
    if action:
        if action == "move":
            logger.info(f"Player started moving from {player_entity.x} to direction {direction}")

            player_entity.x_from = player_entity.x
            player_entity.y_from = player_entity.y
            player_entity.x = target_x
            player_entity.y = target_y

            player_entity.action = Action(
                action='move',
                time=1000,
                timeout=get_current_time() + 1000
            )
        elif action == "swing":
            player_entity.action = Action(
                action='swing',
                time=10000,
                timeout=get_current_time() + 10000
            )

    player_entity.update_sprites()

    entity_db[player_entity.id] = player_entity

    return [], [player_entity]


def handle_action_finished(entity: Entity, action: Action, entity_db: SqliteDict):
    if action.action == 'move':
        entity.x_from = entity.x
        entity.y_from = entity.y
        entity.action = None
        entity.update_sprites()
        entity_db[entity.id] = entity
    else:
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


