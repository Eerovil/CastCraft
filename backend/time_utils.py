import time

# Create UTC milliseconds type
UtcMilliseconds = int

from typing import cast

def get_current_time() -> UtcMilliseconds:
    """
    Return UTC time as milliseconds
    """
    return cast(UtcMilliseconds, int(time.time() * 1000))
