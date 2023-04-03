this.addEventListener('activate', function (event) {
    console.log('service worker activated');
});

this.addEventListener('push', async function (event) {
    const message = await event.data.json();
    let { title, options } = message;

    await event.waitUntil(
        this.registration.showNotification(title, options)
    );
});

this.addEventListener('fetch', () => console.log("fetch"));
