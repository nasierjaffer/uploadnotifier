import fetch from 'node-fetch';

export default async ({ req, res, log, error, env }) => {
    try {
        // Extracting bucketId and projectId from environment variables
        const bucketId = env.bucketid;
        const projectId = env.projectid;

        // Ensure the function is triggered only for the correct bucket
        if (req.body.$bucketId !== bucketId) {
            log(`Ignored event for bucket ID: ${req.body.$bucketId}`);
            return res.status(200).send('Event ignored.');
        }

        // Extracting relevant details from req.body
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

        // Log the API response
        const result = await response.text(); // Adjust if API returns JSON
        log(`API Response: ${result}`);

        // Return success response
        return res.status(200).send('Post request sent successfully.');
    } catch (err) {
        log(`Error occurred: ${err.message}`);
        return res.status(500).send('An error occurred while handling the event.');
    }
};
