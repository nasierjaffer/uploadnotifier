import fetch from 'node-fetch';

export default async ({ req, res, log, error, env }) => {
    try {
        log('Function execution started.');

        // Log all available environment variables
        log(`Environment variables: ${JSON.stringify(env)}`);

        // Access environment variables
        const bucketId = process.env.bucketid; // Check case sensitivity
        const projectId = process.env.projectid;

        log(`Resolved Environment Variables: bucketid=${bucketId}, projectid=${projectId}`);

        if (!bucketId || !projectId) {
            log('Environment variables are missing.');
            throw new Error("Environment variables 'bucketid' or 'projectid' are not set.");
        }

        // Check if the triggered bucket ID matches
        log(`Triggered bucket ID: ${req.body.bucketId}`);
        if (req.body.bucketId !== bucketId) {
            log(`Ignored event for bucket ID: ${req.body.bucketId}`);
            return res.json({ message: 'Event ignored.' });
        }

        // Extract file details
        const fileDetails = {
            Type: req.body.mimeType,
            Size: req.body.sizeOriginal,
            Created: req.body.$createdAt,
        };

        log(`File details extracted: ${JSON.stringify(fileDetails)}`);

        // Prepare the file retrieval
        const fileId = req.body.$id;
        log(`Retrieving file with ID: ${fileId}`);
        const fileUrl = `https://appwrite.io/v1/storage/buckets/${bucketId}/files/${fileId}/download`;

        const fileResponse = await fetch(fileUrl, {
            method: 'GET',
            headers: {
                'X-Appwrite-Project': projectId,
                'X-Appwrite-Key': process.env.APPWRITE_API_KEY, // Ensure API key is set
            },
        });

        if (!fileResponse.ok) {
            throw new Error(`Failed to retrieve file: ${fileResponse.statusText}`);
        }

        const fileBuffer = await fileResponse.buffer();
        log(`File retrieved successfully.`);

        // Send POST request to external API with file and metadata
        const url = 'http://160.119.102.51:5000/';
        log(`Sending POST request to URL: ${url}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            body: (() => {
                const formData = new FormData();
                formData.append('file', fileBuffer, req.body.name);
                formData.append('details', JSON.stringify(fileDetails));
                return formData;
            })(),
        });

        const result = await response.text();
        log(`API Response: ${result}`);
        return res.json({ message: 'Post request sent successfully.', apiResponse: result });
    } catch (err) {
        log(`Error occurred: ${err.message}`);
        log(`Stack trace: ${err.stack}`);
        return res.json({ error: 'An error occurred while handling the event.', details: err.message });
    }
};
