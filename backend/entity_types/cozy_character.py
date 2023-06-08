"""

"""

from pydantic import BaseModel
from typing import List, Optional, Literal  # noqa
from models import Sprite


BASE_URL = '/sprites/cozy_people/'
TILE_SIZE = 32  # 32*32 pixels tiled pngs
CHAR_WIDTH = 8  # 8 tiles wide  (Also used for colors)
TOOL_HEIGHT = 4  # 4 tiles of height for each tool (max of 8 * 4 = 32 sprites per tool)

# We will have 6 different layers.
LAYERS = [
    "characters",
    "eyes",
    "clothes",
    "hair",
    "acc",
    "tool",  # Only when using a tool
]

ASD = {
    "characters": {
        "char_all.png": {

        }
    }
}

ToolType = Literal[
    "axe", "block", "carry", "die", "fish", "hoe", "hurt", "jump", "pickaxe", "pickup",
    "sword", "walk", "water"
]

TOOLS: dict[ToolType, int] = {}
tool_index = 0
TOOLS['walk'] = 0
TOOLS['jump'] = 4
TOOLS['pickup'] = 8
TOOLS['carry'] = 12
TOOLS['sword'] = 16
TOOLS['block'] = 20
TOOLS['hurt'] = 24
TOOLS['die'] = 28
TOOLS['pickaxe'] = 29  # NOTE: Only 1 tile height for die
TOOLS['axe'] = 33
TOOLS['fish'] = 37
TOOLS['hoe'] = 41
TOOLS['water'] = 45
TOOLS['end'] = 49  # NOT A TOOL, just a marker for the last tool index

ANIMATION_LENGTH: dict[ToolType, int] = {}
ANIMATION_LENGTH['walk'] = 8
ANIMATION_LENGTH['jump'] = 5
ANIMATION_LENGTH['pickup'] = 5
ANIMATION_LENGTH['carry'] = 8
ANIMATION_LENGTH['sword'] = 4
ANIMATION_LENGTH['block'] = 1
ANIMATION_LENGTH['hurt'] = 1
ANIMATION_LENGTH['die'] = 2
ANIMATION_LENGTH['pickaxe'] = 5
ANIMATION_LENGTH['axe'] = 5
ANIMATION_LENGTH['fish'] = 2
ANIMATION_LENGTH['hoe'] = 5
ANIMATION_LENGTH['water'] = 5

ClothesType = Literal[
    "basic", "clown", "dress ", "floral", "overalls", "pants_suit", "pants", "pumpkin",
    "sailor_bow", "sailor", "shoes", "skirt", "skull", "spaghetti", "spooky ", "sporty",
    "stripe", "suit", "witch"
]
CLOTHES_CHOICES: dict[ClothesType: int] = {}
CLOTHES_CHOICES["basic"] = 10  # 10 different colors
CLOTHES_CHOICES["clown"] = 2
CLOTHES_CHOICES["dress"] = 10
CLOTHES_CHOICES["floral"] = 10
CLOTHES_CHOICES["overalls"] = 10
CLOTHES_CHOICES["pants_suit"] = 10
CLOTHES_CHOICES["pants"] = 10
CLOTHES_CHOICES["pumpkin"] = 2
CLOTHES_CHOICES["sailor_bow"] = 10
CLOTHES_CHOICES["sailor"] = 10
CLOTHES_CHOICES["shoes"] = 10
CLOTHES_CHOICES["skirt"] = 10
CLOTHES_CHOICES["skull"] = 10
CLOTHES_CHOICES["spaghetti"] = 10
CLOTHES_CHOICES["spooky"] = 1
CLOTHES_CHOICES["sporty"] = 10
CLOTHES_CHOICES["stripe"] = 10
CLOTHES_CHOICES["suit"] = 10
CLOTHES_CHOICES["witch"] = 1

EyesType = Literal[
    "eyes"
]
EYES_CHOICES: dict[EyesType: int] = {}
EYES_CHOICES["eyes"] = 10
AccType = Literal[
    "beard", "earring_emerald", "earring_emerald_silver", "earring_red", "earring_red_silver",
    "glasses", "glasses_sun", "hat_cowboy", "hat_lucky", "hat_pumpkin", "hat_pumpkin_purple",
    "hat_witch", "mask_clown_blue", "mask_clown_red", "mask_spooky"
]
ACC_CHOICES: dict[AccType: int] = {}
ACC_CHOICES["beard"] = 14
ACC_CHOICES["earring_emerald"] = 1
ACC_CHOICES["earring_emerald_silver"] = 1
ACC_CHOICES["earring_red"] = 1
ACC_CHOICES["earring_red_silver"] = 1
ACC_CHOICES["glasses"] = 10
ACC_CHOICES["glasses_sun"] = 10
ACC_CHOICES["hat_cowboy"] = 1
ACC_CHOICES["hat_lucky"] = 1
ACC_CHOICES["hat_pumpkin"] = 1
ACC_CHOICES["hat_pumpkin_purple"] = 1
ACC_CHOICES["hat_witch"] = 1
ACC_CHOICES["mask_clown_blue"] = 1
ACC_CHOICES["mask_clown_red"] = 1
ACC_CHOICES["mask_spooky"] = 1

HairType = Literal[
    "bob", "braids", "buzzcut", "curly", "emo", "extra_long", "extra_long_skirt",
    "french_curl", "gentleman", "long_straight", "long_straight_skirt", "midiwave",
    "ponytail", "spacebuns", "wavy"
]
HAIR_CHOICES: dict[HairType: int] = {}
HAIR_CHOICES["bob"] = 14
HAIR_CHOICES["braids"] = 14
HAIR_CHOICES["buzzcut"] = 14
HAIR_CHOICES["curly"] = 14
HAIR_CHOICES["emo"] = 14
HAIR_CHOICES["extra_long"] = 14
HAIR_CHOICES["extra_long_skirt"] = 14
HAIR_CHOICES["french_curl"] = 14
HAIR_CHOICES["gentleman"] = 14
HAIR_CHOICES["long_straight"] = 14
HAIR_CHOICES["long_straight_skirt"] = 14
HAIR_CHOICES["midiwave"] = 14
HAIR_CHOICES["ponytail"] = 14
HAIR_CHOICES["spacebuns"] = 14
HAIR_CHOICES["wavy"] = 14



class CharacterChoice(BaseModel):
    char_index: int
    clothes: Optional[ClothesType]
    clothes_color: int
    eyes: EyesType
    eyes_color: int
    acc: Optional[AccType]
    acc_color: int
    hair: Optional[HairType]
    hair_color: int


Direction = Literal[0, 1, 2, 3]


def get_tiles_for(char_choice: CharacterChoice, tool: ToolType, direction: Direction) -> list[List[Sprite]]:
    """
    return a list. Each item in the list represents a tick of the animation.
    Each item contains a list of layers, each layer has a specific tile x,y.

    e.g. [
        [
            {
                "url": "characters/char_all.png",
                "x": 0,
                "y": 0
            },
            {
                "url": "clothes/basic.png",
                "x": 0,
                "y": 0
            }
        ]
    ]
    """
    animation_length = ANIMATION_LENGTH[tool]
    ret: List[List[Sprite]] = []
    for i in range(animation_length):
        ret.append([])

    char_index = char_choice.char_index
    char_last_index = char_index + CHAR_WIDTH
    tool_index = TOOLS[tool]
    tool_last_index = tool_index
    # Find the first tool that has a bigger index than the current tool
    for tool_name, tool_last_index in TOOLS.items():
        if tool_last_index > tool_index:
            break

    tool_index += direction
    if tool_index >= tool_last_index:
        tool_index = tool_last_index - 1
    # Now we know the exact row to use from each sprite sheet

    # From the characters/char_all.png
    # We want sprites at column char_index to char_last_index
    # and rows tool_index to tool_last_index
    for i in range(animation_length):
        ret[i].append(
            Sprite(
                url=f"{BASE_URL}characters/char_all.png",
                x=(char_index * CHAR_WIDTH + i) * TILE_SIZE,
                y=(tool_index) * TILE_SIZE,
                width=32,
                height=32,
            )
        )
        

    # Now we must figure out what extra layers we need
    if char_choice.clothes:
        # From the clothes/{char_choice.clothes}.png
        # we want sprites at column char_choice.clothes_color to char_choice.clothes_color + CHAR_WIDTH
        for i in range(animation_length):
            ret[i].append(
                Sprite(
                    url=f"{BASE_URL}clothes/{char_choice.clothes}.png",
                    x=(char_choice.clothes_color * CHAR_WIDTH + i) * TILE_SIZE,
                    y=(tool_index) * TILE_SIZE,
                    width=32,
                    height=32,
                )
            )

        
    if char_choice.eyes:
        # From the eyes/{char_choice.eyes}.png
        # we want sprites at column char_choice.eyes_color to char_choice.eyes_color + CHAR_WIDTH
        for i in range(animation_length):
            ret[i].append(
                Sprite(
                    url=f"{BASE_URL}eyes/{char_choice.eyes}.png",
                    x=(char_choice.eyes_color * CHAR_WIDTH + i) * TILE_SIZE,
                    y=(tool_index) * TILE_SIZE,
                    width=32,
                    height=32,
                )
            )

    if char_choice.acc:
        # From the acc/{char_choice.acc}.png
        # we want sprites at column char_choice.acc_color to char_choice.acc_color + CHAR_WIDTH
        for i in range(animation_length):
            ret[i].append(
                Sprite(
                    url=f"{BASE_URL}acc/{char_choice.acc}.png",
                    x=(char_choice.acc_color * CHAR_WIDTH + i) * TILE_SIZE,
                    y=(tool_index) * TILE_SIZE,
                    width=32,
                    height=32,
                )
            )

    if char_choice.hair:
        # From the hair/{char_choice.hair}.png
        # we want sprites at column char_choice.hair_color to char_choice.hair_color + CHAR_WIDTH
        for i in range(animation_length):
            ret[i].append(
                Sprite(
                    url=f"{BASE_URL}hair/{char_choice.hair}.png",
                    x=(char_choice.hair_color * CHAR_WIDTH + i) * TILE_SIZE,
                    y=(tool_index) * TILE_SIZE,
                    width=32,
                    height=32,
                )
            )

    # Now we have all the layers we need
    return ret


def test_this() -> list[List[Sprite]]:
    choice = CharacterChoice(
        char_index=0,
        clothes="basic",
        clothes_color=0,
        eyes="eyes",
        eyes_color=0,
        acc=None,
        acc_color=0,
        hair=None,
        hair_color=0
    )
    return get_tiles_for(choice, "axe", 0)
