import { MapDrawer } from './gamemap';


class LoadingScreen {
    mapDrawer: MapDrawer;
    container: HTMLDivElement;
    progressBar: HTMLProgressElement;
    statusText: HTMLDivElement;

    constructor(mapDrawer: MapDrawer, container: HTMLDivElement) {
        this.mapDrawer = mapDrawer;
        this.container = container;
        this.progressBar = document.createElement('progress');
        this.statusText = document.createElement('div');
        this.statusText.classList.add('loading-screen-status');
        container.appendChild(this.progressBar);
        container.appendChild(this.statusText);
    }

    updateLoading(text: string, progress: number) {
        this.progressBar.value = progress;
        this.statusText.innerText = text;
    }

    async show() {
        this.updateLoading('Ladataan karttaa...', 0)
        await this.mapDrawer.buildBackground();
        this.updateLoading('Ladataan esineitä...', 0.5)
        const entities = Object.values(this.mapDrawer.entities);
        const entityCount = entities.length;
        let loadedEntities = 0;
        for (const entity of entities) {
            await this.mapDrawer.updateEntity(entity)
            loadedEntities++;
            this.updateLoading(`Ladataan esineitä...`, 0.5 + 0.5 * loadedEntities / entityCount)
        }
        this.updateLoading('Valmis!', 1)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        this.container.remove();
    }
}

export async function showLoadingScreen(mapDrawer: MapDrawer) {
    const el = document.createElement('div');
    el.id = 'loading-screen';
    document.body.appendChild(el);

    const loadingScreen = new LoadingScreen(
        mapDrawer,
        el
    );
    await loadingScreen.show();
}