
from db import get_entity_db
from models import Entity, Action
from time_utils import get_current_time

from sqlitedict import SqliteDict


def handle_action_finished(entity: Entity, action: Action, entity_db: SqliteDict):
    if action.action == 'move':
        entity.x_from = entity.x
        entity.y_from = entity.y
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


