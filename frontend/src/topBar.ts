export function initializeTopBar(element: HTMLDivElement) {
    element.innerHTML = `
        <div class="reload-button">
        </div>
        `
    const reloadButton = element.querySelector<HTMLDivElement>('.reload-button')!
    reloadButton.addEventListener('click', () => {
        window.location.reload()
    });
}
