interface TouchCallbacks {
    tapNextToPlayer?: (direction: number) => void,
    tapOnPlayer?: () => void,
}

class TouchInput {
    callbacks: TouchCallbacks

    constructor(touchElement: HTMLDivElement, callbacks: TouchCallbacks) {
        this.callbacks = callbacks;
        touchElement.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        touchElement.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        touchElement.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        console.log('touch input started');
    }

    handleTouchStart(e: TouchEvent) {
        e.preventDefault();
        console.log('touchstart');
        console.log(e);
        this.sendTapNextToPlayer(e);
    }

    sendTapNextToPlayer(e: TouchEvent) {
        // Figure out direction from center of screen
        // Send tapNextToPlayer
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const xCenter = width / 2;
        const yCenter = height / 2 - 32;

        const xDiff = x - xCenter;
        const yDiff = y - yCenter;

        console.log('xDiff', xDiff, 'yDiff', yDiff);

        if ((xDiff < -60 || xDiff > 30) && (yDiff < -60 || yDiff > 30)) {
            // Too far away in the diagonal direction
            return;
        }

        if ((-60 < yDiff && yDiff < 20) && (-40 < xDiff && xDiff < 40)) {
            // Tapped center
            this.callbacks.tapOnPlayer && this.callbacks.tapOnPlayer();
            return;
        }


        // DirectionsType.down is 0
        // DirectionsType.up is 1
        // DirectionsType.right is 2
        // DirectionsType.left is 3
        
        let direction = 0;
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) {
                direction = 2;
            } else {
                direction = 3;
            }
        } else {
            if (yDiff > 0) {
                direction = 0;
            } else {
                direction = 1;
            }
        }
        this.callbacks.tapNextToPlayer && this.callbacks.tapNextToPlayer(direction);
    }

    handleTouchMove(e: TouchEvent) {
        e.preventDefault();
        console.log('touchmove');
        console.log(e);
    }

    handleTouchEnd(e: TouchEvent) {
        e.preventDefault();
        console.log('touchend');
        console.log(e);
    }
}

export function startTouchInput(element: HTMLDivElement, callbacks: TouchCallbacks) {
    return new TouchInput(element, callbacks);
}