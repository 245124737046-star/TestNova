
require("dotenv").config();

const OPENROUTER_URL =
    "https://openrouter.ai/api/v1/chat/completions";

// Our AI models for comparison
const MODELS = [
    "cohere/north-mini-code:free"
];

// Function to send a request to an AI model
async function generateResponse(model, prompt) {

    const startTime = Date.now();
console.log(`[OpenRouter] Starting model: ${model}`);


    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("OpenRouter API key is missing in .env");
    }

    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Title": "TestNova"
        },
      body: JSON.stringify({
    model: model,
    messages: [
        {
            role: "user",
            content: prompt
        }
    ],
    temperature: 0.1,
    max_tokens: 4000,
    reasoning: {
        effort: "none"
    }
})
    });

    const data = await response.json();

    console.log(
    `[OpenRouter] ${model} responded in ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`
);

console.log("Finish reason:", data.choices?.[0]?.finish_reason);
console.log("Usage:", data.usage);

    if (!response.ok) {
        throw new Error(
            data.error?.message || `OpenRouter error: ${response.status}`
        );
    }

   const message = data.choices?.[0]?.message;

if (!response.ok) {
    throw new Error(data.error?.message || `OpenRouter error: ${response.status}`);
}

if (typeof message?.content !== "string" || !message.content.trim()) {
    console.log("AI response details:", {
        finish_reason: data.choices?.[0]?.finish_reason,
        usage: data.usage,
        messageKeys: Object.keys(message || {})
    });

    throw new Error("AI returned empty content.");
}

return message.content;
}

module.exports = {
    MODELS,
    generateResponse
};
