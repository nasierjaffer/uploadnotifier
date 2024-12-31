import fetch from 'node-fetch';

export default async ({ req, res, log, error, env }) => {
    try {
        // Access environment variables safely
        const bucketId = env.bucketid;
        const projectId = env.projectid;

        if (!bucketId || !projectId) {
            throw new Error("Environment variables 'bucketid' or 'projectid' are not set.");
        }

        // Check if the triggered bucket ID matches
        if (req.body.$bucketId !== bucketId) {
            log(`Ignored event for bucket ID: ${req.body.$bucketId}`);
            return res.json({ message: 'Event ignored.' });
        }

        // Extract file details from the request body
        const fileDetails = {
            Type: req.body.mimeType,
            Size: req.body.size,
            Created: req.body.$createdAt,
        };

        log(`File details: ${JSON.stringify(fileDetails)}`);

        // External API URL
        const url = 'http://160.119.102.51:5000/';
        const headers = { 'Content-Type': 'application/json' };

        // Send POST request with file details
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(fileDetails),
        });

        const result = await response.text(); // Assuming the API returns text

        log(`API Response: ${result}`);
        return res.json({ message: 'Post request sent successfully.', apiResponse: result });
    } catch (err) {
        log(`Error occurred: ${err.message}`);
        return res.json({ error: 'An error occurred while handling the event.', details: err.message });
    }
};
