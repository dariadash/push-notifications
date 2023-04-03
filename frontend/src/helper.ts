import axios from 'axios';

export async function regSw() {
    if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.register('sw.js');
        console.log('service config is', { reg });
        return reg;
    }
    throw Error('serviceworker not supported');
}

export async function subscribe(serviceWorkerReg: any) {
    let subscription = await serviceWorkerReg.pushManager.getSubscription();
    if (subscription === null) {
        subscription = await serviceWorkerReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.REACT_APP_YOUR_PUBLIC_VAPID_KEY,
        });
        axios.post(`${process.env.REACT_APP_PUBLIC_URL}/subscribe`, subscription);
        return subscription
    }
    return subscription
}

export async function handlePush(subscription: any) {
    try {
        await axios.post(`${process.env.REACT_APP_PUBLIC_URL}/push`, {
            endpoint: subscription.endpoint,
            notification: {
                title: 'Test notification',
                options: {
                    body: 'This is a test notification',
                    icon: './favicon.ico',
                    badge: './favicon.ico',
                    vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500],
                    tag: "vibration-sample",
                    actions: [
                        {
                            action: 'coffee-action',
                            title: 'Coffee',
                        },
                        {
                            action: 'doughnut-action',
                            title: 'Doughnut',
                        },
                    ]
                }
            }
        });

        let unreadCount = 42;

        // @ts-ignore
        navigator.setAppBadge(unreadCount).catch((error) => {
            console.log(error)
        });

    } catch (err) {
        console.error(err);
    }
}

export const unregister = () => {
    const unReg = navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            registration.unregister();
        }
    });

    // @ts-ignore
    navigator.clearAppBadge().catch((error) => {
        console.log(error)
    });

    return unReg
}