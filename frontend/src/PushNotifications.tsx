import React from 'react';
import { handlePush, regSw, subscribe, unregister } from './helper';

export const PushNotifications = () => {
    const [subscription, setSubscription] = React.useState(null);

    const handleSubscribe = async () => {
        try {
            // Request permission to send push notifications
            const permission = await window.Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Permission not granted for push notifications');
            }

            const serviceWorkerReg = await regSw();
            const subscription = await subscribe(serviceWorkerReg);

            setSubscription(subscription);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUnregister = async () => {
        setSubscription(null)
        return await unregister()
    }

    return (
        <div>
            <button
                onClick={handleSubscribe}
                disabled={!!subscription}
            >
                Subscribe
            </button>
            <button
                onClick={() => handlePush(subscription)}
                disabled={!subscription}
            >
                Send Notification
            </button>
            <button onClick={handleUnregister}>
                Unregister SW
            </button>
        </div>
    );
};
