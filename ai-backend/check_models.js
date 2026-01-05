import 'dotenv/config';
import fetch from 'node-fetch';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API key found.");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`Fetching models with key length: ${apiKey.length}`);

try {
    const response = await fetch(url);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${text}`);
    }
    const data = await response.json();
    console.log("Available models:");
    if (data.models) {
        data.models.forEach(model => {
            if (model.name.includes("gemini")) {
                console.log(model.name);
            }
        });
    } else {
        console.log("No models property in response", data);
    }
} catch (error) {
    console.error("Error fetching models:", error);
}
