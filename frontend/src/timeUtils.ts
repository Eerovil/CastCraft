export type UTCMilliseconds = number;

export function getCurrentTime() {
    // Return UTC time in milliseconds
    return Date.now() as UTCMilliseconds;
}
