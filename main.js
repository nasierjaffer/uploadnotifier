import fetch from 'node-fetch';

export default async ({ req, res, log, error, env }) => {
    try {
        log('Function execution started.');

        // Log the incoming request body for debugging
        log(`Request body: ${JSON.stringify(req.body)}`);

        // Access environment variables safely and log them
        const bucketId = env.bucketid;
        const projectId = env.projectid;

        log(`Environment Variables: bucketid=${bucketId}, projectid=${projectId}`);

        if (!bucketId || !projectId) {
            log('Environment variables are missing.');
            throw new Error("Environment variables 'bucketid' or 'projectid' are not set.");
        }

        // Check if the triggered bucket ID matches and log the bucket ID
        log(`Triggered bucket ID: ${req.body.$bucketId}`);
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

        log(`File details extracted: ${JSON.stringify(fileDetails)}`);

        // Log the external API URL
        const url = 'http://160.119.102.51:5000/';
        log(`Sending POST request to URL: ${url}`);

        // Send POST request with file details
        const headers = { 'Content-Type': 'application/json' };
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(fileDetails),
        });

        const result = await response.text(); // Assuming the API returns text
        log(`API Response: ${result}`);

        // Return success response
        log('Function execution completed successfully.');
        return res.json({ message: 'Post request sent successfully.', apiResponse: result });
    } catch (err) {
        // Log detailed error information
        log(`Error occurred: ${err.message}`);
        log(`Stack trace: ${err.stack}`);
        return res.json({ error: 'An error occurred while handling the event.', details: err.message });
    }
};
