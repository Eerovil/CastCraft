
import random
from models import Action
from time_utils import get_current_time
from db import get_entity_db, get_free_entity_id
from entity_types.cozy_farm import Animal, AnimalSlug, BaseAnimalSlug
import utils


def spawn_animal(base_animal_slug: BaseAnimalSlug, animal_slug: AnimalSlug):
    _id = get_free_entity_id()

    x, y = utils.get_random_free_position(0, 0, utils.MAP_BOUNDS[2], utils.MAP_BOUNDS[3], allow_edges=False)

    entity = Animal(
        id=_id,
        animal_slug=animal_slug,
        base_animal_slug=base_animal_slug,
        x=x,
        y=y,
    )
    entity.update_sprites()
    entity_db = get_entity_db()
    entity_db[_id] = entity
    return entity


def move_animals():
    changed_entities = []
    current_time = get_current_time()
    entity_db = get_entity_db()
    for entity in list(get_entity_db().values()):
        if not isinstance(entity, Animal):
            continue
        if current_time > entity.last_update + 5000:
            entity.last_update = current_time + random.randint(-1000, 1000)
            if random.randint(0, 1) == 0:
                # Start a walk action to a random direction
                entity.direction = random.randint(0, 3)
                new_x, new_y = utils.move_coordinates_at_direction(entity.x, entity.y, entity.direction)
                if utils.coordinates_are_walkable(new_x, new_y):
                    entity.x_from = entity.x
                    entity.y_from = entity.y
                    entity.x = new_x
                    entity.y = new_y
                    entity.action = Action(
                        action="move",
                        timeout=current_time + 1000,
                        time=1000
                    )
                    entity.update_sprites()
                    entity_db[entity.id] = entity
                    changed_entities.append(entity)
    
    return changed_entities


def spawn_animals():
    chicken = spawn_animal("chicken", "chicken animation")
    brown_chicken = spawn_animal("chicken", "chicken_brown animation")

    return [chicken, brown_chicken]
