import fetch from 'node-fetch';

export default async ({ req, res, log, error }) => {
    const url = 'http://160.119.102.51:5000/';
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify({ "do it": "yourself" });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body,
        });

        const result = await response.json(); // Assuming the API responds with JSON
        return res.json(result); // Sends the API response as the function response
    } catch (err) {
        log(`Error occurred: ${err.message}`);
        return res.status(500).send('An error occurred while making the API request.');
    }
};
