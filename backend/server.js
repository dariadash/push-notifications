const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const webpush = require('web-push');
const cors = require('cors')

const dotenv = require('dotenv');
dotenv.config();


const app = express();
const port = process.env.PORT || 5000;

// Configure web-push with VAPID keys
const publicVapidKey = process.env.YOUR_PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.YOUR_PRIVATE_VAPID_KEY;

webpush.setVapidDetails(
    'mailto:YOUR_EMAIL_ADDRESS',
    publicVapidKey,
    privateVapidKey
);

// MySQL Connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

app.use(cors())

// Body Parser Middleware
app.use(bodyParser.json());

// Subscribe Route
app.post('/api/subscribe', (req, res) => {
    const subscription = req.body;

    // Store subscription details in MySQL database
    pool.getConnection((err, connection) => {
        if (err) throw err;
        connection.query(
            'INSERT INTO subscriptions (endpoint, expirationTime, p256dh, auth) VALUES (?, ?, ?, ?)',
            [
                subscription.endpoint,
                subscription.expirationTime,
                subscription.keys.p256dh,
                subscription.keys.auth
            ],
            (error, results) => {
                connection.release();
                if (error) throw error;
                res.status(201).json({ message: 'Subscription successful' });
            });
    });
});

// Send Notification Route
app.post('/api/push', (req, res) => {
    const notification = req.body.notification;
    const userEndpoint = req.body.endpoint;

    // Retrieve all subscriptions from database
    pool.getConnection((err, connection) => {
        if (err) throw err;
        connection.query('SELECT * FROM subscriptions WHERE endpoint = ?', [userEndpoint], (error, results) => {
            connection.release();
            if (error) throw error;
            const subscriptions = results;

            // Send notifications to all subscribers
            Promise.all(subscriptions.map(sub => webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    }
                },
                JSON.stringify(notification)
            ).catch((error) => {
                if (error.statusCode === 410) {
                    const endpoint = sub.endpoint;
                    connection.query('DELETE FROM subscriptions WHERE endpoint = ?', [endpoint], (error, results, fields) => {
                        if (error) {
                            console.error(error);
                        } else {
                            console.log('Subscription deleted');
                        }
                    });
                }
            })))
                .then(() => res.status(200).json({ message: 'Notification sent successfully' }))
                .catch((error) => {
                    console.error('Error sending notification:', error);
                });
        });
    });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
