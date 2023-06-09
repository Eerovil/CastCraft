from sqlitedict import SqliteDict

def get_entity_db():
    return SqliteDict('entities.db', tablename="entities", autocommit=True)


def get_user_db():
    return SqliteDict('nicknames.db', tablename="nicknames", autocommit=True)


def get_entity_at_position(x, y):
    entity_db = get_entity_db()
    for entity in entity_db.values():
        if entity.x == x and entity.y == y:
            return entity
    return None
