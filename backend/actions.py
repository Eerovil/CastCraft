
from typing import Optional
from entity_types.minecraft_things import DroppedMinecraftBlock, MinecraftItem, PlacedMinecraftBlock
from time_utils import get_current_time

from sqlitedict import SqliteDict

from db import get_entity_at_position, get_entity_db, get_free_entity_id
from user_utils import get_player_entity_from_request
from utils import MAP_BOUNDS, TILE_SIZE, get_position_is_in_bounds
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

    if not player_entity:
        logger.info("Player entity not found")
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

    if action == "move" and player_entity.holding and 'block' in player_entity.holding.slug:
        action = "place"

    if player_entity.action is not None:
        if player_entity.action.action == "action":
            # Probably clicked again, just return nothing
            return [], []
        logger.info("Player is already doing something: %s", player_entity.action)

        if player_entity.action.action == 'move':
            return [], []

        # Cancel the current action
        player_entity.action = None
        player_entity.update_sprites()
        entity_db[player_entity.id] = player_entity
        return [], [player_entity]

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
            base_time = 10000
            efficiency = 1
            if player_entity.holding:
                efficiency = (
                    player_entity.holding.get_material_swinging_efficiency(blocking_entity.made_of)
                ) or 1
            logger.info(f"Player started swinging at {blocking_entity.id} with efficiency {efficiency}")
            final_time = base_time / efficiency
            player_entity.action = Action(
                action='swing',
                time=final_time,
                timeout=get_current_time() + final_time,
                target_id=blocking_entity.id
            )
        elif action == "to_inventory":
            logger.info(f"Player started picking up {blocking_entity.id}")
            player_entity.action = Action(
                action='to_inventory',
                time=500,
                timeout=get_current_time() + 500,
                target_id=blocking_entity.id
            )
        elif action == "place":
            logger.info(f"Player started placing")
            player_entity.action = Action(
                action='place',
                time=500,
                timeout=get_current_time() + 500,
            )



    player_entity.update_sprites()

    entity_db[player_entity.id] = player_entity

    return [], [player_entity]


def handle_action_finished(entity: Entity, action: Action, entity_db: SqliteDict) -> tuple[list[Entity], list[str]]:
    changed_entities = []
    deleted_entity_ids = []
    if not action:
        return changed_entities, deleted_entity_ids
    logger.info(f"Action finished: {action}")
    if action.action == 'move':
        entity.x_from = entity.x
        entity.y_from = entity.y
        entity.action = None
        entity.update_sprites()
        entity_db[entity.id] = entity
    elif action.action == 'swing':
        target_entity = entity_db[action.target_id]
        changed_entities = target_entity.on_swing_destroy()
        del entity_db[action.target_id]
        deleted_entity_ids.append(action.target_id)
        entity.action = None
        entity.update_sprites()
        entity_db[entity.id] = entity
    elif action.action == 'to_inventory':
        target_entity: DroppedMinecraftBlock = entity_db[action.target_id]
        for item in entity.inventory.items:
            if item.slug == f"{target_entity.block_type}_block":
                item.quantity += 1
                break
        else:
            inventory_item = MinecraftItem(
                slug=f"{target_entity.block_type}_block",
                quantity=1
            )
            entity.inventory.items.append(inventory_item)
        del entity_db[action.target_id]
        deleted_entity_ids.append(action.target_id)
        entity.action = None
        entity.update_sprites()
        entity_db[entity.id] = entity
    elif action.action == 'place':
        if entity.holding:
            block_type = entity.holding.slug

            if entity.direction == Directions.up:
                target_x = entity.x
                target_y = entity.y - TILE_SIZE
            elif entity.direction == Directions.down:
                target_x = entity.x
                target_y = entity.y + TILE_SIZE
            elif entity.direction == Directions.left:
                target_x = entity.x - TILE_SIZE
                target_y = entity.y
            elif entity.direction == Directions.right:
                target_x = entity.x + TILE_SIZE
                target_y = entity.y
            new_block = PlacedMinecraftBlock(
                id=get_free_entity_id(),
                block_type=block_type.replace('_block', ''),
                made_of=block_type.replace('_block', ''),
                x=target_x,
                y=target_y,
            )
            new_block.update_sprites()
            entity_db[new_block.id] = new_block
            changed_entities.append(new_block)

            entity.holding.quantity -= 1
            index = -1
            for item in entity.inventory.items:
                index += 1
                if item.slug == entity.holding.slug:
                    item.quantity = entity.holding.quantity
                    if item.quantity <= 0:
                        del entity.inventory.items[index]
                        entity.holding = None
                    break

            entity.action = None
            entity.update_sprites()
            entity_db[entity.id] = entity
    else:
        entity.action = None
        entity.update_sprites()
        entity_db[entity.id] = entity
    return changed_entities, deleted_entity_ids


def update_actions() -> tuple[list[Entity], list[str]]:
    """
    Handle actions in progress, and remove them if they are done
    """
    entity_db = get_entity_db()
    changed_entities = []
    deleted_entity_ids = []
    now = get_current_time()
    for entity_id, entity in entity_db.items():
        if entity.action is None:
            continue
        if entity.action.timeout < now:
            changed_entities.append(entity)
            continue

    if len(changed_entities) == 0:
        return ([], [])

    for entity in changed_entities:
        handle_result = (
            handle_action_finished(entity, entity.action, entity_db)
        )
        changed_entities.extend(handle_result[0])
        deleted_entity_ids.extend(handle_result[1])

    return changed_entities, deleted_entity_ids
