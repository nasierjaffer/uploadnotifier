import { Client, Storage } from "appwrite";
import FormData from "form-data";
import fetch from "node-fetch";

export default async ({ req, res, log, error, env }) => {
    try {
        log("Function execution started.");

        // Retrieve environment variables
        const endpoint = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
        const projectId = process.env.projectid || null;
        const apiKey = process.env.APPWRITE_API_KEY || null;
        const bucketId = process.env.bucketid || null;

        if (!endpoint || !projectId || !apiKey || !bucketId) {
            throw new Error(
                `Missing required environment variables: 
                endpoint=${endpoint || "undefined"}, 
                projectid=${projectId || "undefined"}, 
                bucketid=${bucketId || "undefined"}, 
                apiKey=${apiKey ? "present" : "missing"}`
            );
        }

        log(`Environment Variables: endpoint=${endpoint}, projectId=${projectId}, bucketId=${bucketId}, apiKey=${apiKey ? "present" : "missing"}`);

        // Initialize Appwrite client
        const client = new Client();
        const storage = new Storage(client);

        client
            .setEndpoint(endpoint)
            .setProject(projectId)
            .addHeader("X-Appwrite-Key", apiKey);

        // Check triggered bucket ID
        if (req.body.bucketId !== bucketId) {
            log(`Ignored event for bucket ID: ${req.body.bucketId}`);
            return res.json({ message: "Event ignored." });
        }

        const fileId = req.body.$id;
        log(`Retrieving file with ID: ${fileId}`);

        // Use Appwrite SDK to get the file download URL
        const fileUrl = storage.getFileDownload(bucketId, fileId);
        log(`Retrieved file URL: ${fileUrl}`);

        // Download the file
        const fileResponse = await fetch(fileUrl, {
            headers: {
                "X-Appwrite-Project": projectId,
                "X-Appwrite-Key": apiKey,
            },
        });

        if (!fileResponse.ok) {
            throw new Error(`Failed to download file: ${fileResponse.statusText}`);
        }

        const fileBuffer = await fileResponse.buffer();
        log(`File retrieved successfully. File size: ${fileBuffer.length} bytes.`);

        // Send the file and metadata to the external API
        const externalApiUrl = "http://160.119.102.51:5000/";
        log(`Sending POST request to URL: ${externalApiUrl}`);

        const formData = new FormData();
        formData.append("file", fileBuffer, req.body.name);
        formData.append("details", JSON.stringify({
            Type: req.body.mimeType,
            Size: req.body.sizeOriginal,
            Created: req.body.$createdAt,
        }));

        const externalResponse = await fetch(externalApiUrl, {
            method: "POST",
            body: formData,
        });

        const result = await externalResponse.text();
        log(`External API Response: ${result}`);

        return res.json({ message: "Post request sent successfully.", apiResponse: result });
    } catch (err) {
        log(`Error occurred: ${err.message}`);
        log(`Stack trace: ${err.stack}`);
        return res.json({ error: "An error occurred while handling the event.", details: err.message });
    }
};
