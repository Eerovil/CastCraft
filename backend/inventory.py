import logging
from db import get_entity_db

from user_utils import get_player_entity_from_request
logger = logging.getLogger(__name__)


def select_item(request_sid: str, slug: str):
    """
    Select an item from the inventory
    """
    player_entity = get_player_entity_from_request(request_sid)
    if player_entity is None:
        return

    if player_entity.carrying_entity_id:
        logger.info(f"Player {player_entity.id} tried to select item {slug} but they are already carrying")
        player_entity.holding = None
        player_entity.update_sprites()
        entity_db = get_entity_db()
        entity_db[player_entity.id] = player_entity
        return [], [player_entity]

    for item in player_entity.inventory.items:
        if item.slug == slug:
            player_entity.holding = item
            break
    else:
        logger.info(f"Player {player_entity.id} tried to select item {slug} but they don't have it")
    
    player_entity.update_sprites()
    entity_db = get_entity_db()
    entity_db[player_entity.id] = player_entity

    return [], [player_entity]
