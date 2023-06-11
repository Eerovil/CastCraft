export type UTCMilliseconds = number;


class TimeHandler {
    timeOffset: number = 0;

    getCurrentTime() {
        return (Date.now() + this.timeOffset) as UTCMilliseconds;
    }

    setCurrentTime(currentTime: UTCMilliseconds) {
        this.timeOffset = currentTime - Date.now();
        console.log("Time offset: ", this.timeOffset);
    }
}

const timeHandlerInstance = new TimeHandler();

export function getCurrentTime() {
    // Return UTC time in milliseconds
    return timeHandlerInstance.getCurrentTime();
}

export function setCurrentTime(currentTime: UTCMilliseconds) {
    timeHandlerInstance.setCurrentTime(currentTime);
}
