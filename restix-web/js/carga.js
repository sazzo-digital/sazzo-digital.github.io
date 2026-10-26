export async function esperarPantallas(pantallas, cont, reintentar = () => location.reload()) {
    try {
        return await pantallas.listo;
    } catch {
        cont.innerHTML = `<section class="panel" role="alert"><h1 class="titulo">No se pudieron cargar las pantallas</h1><p>Revisá la conexión y volvé a intentar.</p><button class="boton" type="button" data-reintentar>Reintentar</button></section>`;
        cont.querySelector("[data-reintentar]").addEventListener("click", reintentar, { once: true });
        return null;
    }
}
