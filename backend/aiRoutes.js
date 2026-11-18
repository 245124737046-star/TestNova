
const express = require("express");
const router = express.Router();

// Import testing functions
const { testLogin } = require("./testing/loginTest");
const { testAddToCart } = require("./testing/cartTest");
const { runAllTests } = require("./testing/runAllTests");
const { buildTestCasePrompt } = require("./testing/testCasePrompt");
const { executeGeneratedTests } = require("./testing/executeGeneratedTests");

// Import OpenRouter AI service
const {
    MODELS,
    generateResponse
} = require("./services/openrouter");


// ======================================================
// HELPER: EXTRACT AND VALIDATE AI JSON
// ======================================================

   
function parseGeneratedTestCases(generatedText) {
    if (typeof generatedText !== "string" || !generatedText.trim()) {
        throw new Error("AI returned an empty response.");
    }

    let cleanedText = generatedText
        .replace(/```(?:json)?/gi, "")
        .trim();

    // Extract the JSON array from the AI response.
    const start = cleanedText.indexOf("[");

    if (start === -1) {
        throw new Error("AI response does not contain a test-case array.");
    }

    let depth = 0;
    let insideString = false;
    let escaped = false;
    let end = -1;

    for (let i = start; i < cleanedText.length; i++) {
        const char = cleanedText[i];

        if (insideString) {
            if (escaped) {
                escaped = false;
            } else if (char === "\\") {
                escaped = true;
            } else if (char === '"') {
                insideString = false;
            }
            continue;
        }

        if (char === '"') {
            insideString = true;
        } else if (char === "[") {
            depth++;
        } else if (char === "]") {
            depth--;

            if (depth === 0) {
                end = i;
                break;
            }
        }
    }

    if (end === -1) {
        throw new Error("AI returned incomplete JSON.");
    }

    let jsonText = cleanedText.substring(start, end + 1);

    // Remove trailing commas before closing braces or brackets.
    jsonText = jsonText.replace(/,\s*([}\]])/g, "$1");

    let parsed;

    try {
        parsed = JSON.parse(jsonText);
    } catch (error) {
        throw new Error("AI returned invalid JSON: " + error.message);
    }

    const testCases = Array.isArray(parsed)
        ? parsed
        : parsed.testCases;

    if (!Array.isArray(testCases) || testCases.length === 0) {
        throw new Error("AI did not return a valid test-case array.");
    }

    return testCases;
}


// ======================================================
// 1. AI TEST GENERATION
// ======================================================

router.post("/test", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Please provide a prompt"
            });
        }

        const selectedModel = MODELS[0];

        const aiResponse = await generateResponse(
            selectedModel,
            prompt
        );

        res.json({
            success: true,
            model: selectedModel,
            response: aiResponse
        });

    } catch (error) {
        console.error("AI Error:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ======================================================
// 2. AUTOMATED LOGIN TEST
// ======================================================

router.get("/run-login-test", async (req, res) => {
    try {
        const result = await testLogin();

        res.json({
            success: true,
            result
        });

    } catch (error) {
        console.error("Login Test Error:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ======================================================
// 3. AUTOMATED CART TEST
// ======================================================

router.get("/run-cart-test", async (req, res) => {
    try {
        const result = await testAddToCart();

        res.json({
            success: true,
            result
        });

    } catch (error) {
        console.error("Cart Test Error:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ======================================================
// 4. RUN ALL TESTS + AI FAILURE ANALYSIS
// ======================================================

router.get("/run-all-tests", async (req, res) => {
    try {
        const report = await runAllTests();

        let aiAnalysis = [];

        if (report.summary.failed > 0) {
            const failedTests = report.results.filter(
                test => test.status === "FAIL"
            );

            const prompt = `
You are an expert software testing and debugging assistant for TestNova.

Analyze the following failed e-commerce website test cases:

FAILED TEST DATA:
${JSON.stringify(failedTests, null, 2)}

Provide an executive breakdown titled:
"OpenRouter LLM Synthesis & Evidence Analysis: Failed Test Analysis".

For each failed test provide:
1. Index
2. Test case name
3. Status
4. Expected result
5. Actual result
6. Severity: Critical, High, Medium, or Low
7. Five numbered engineering action steps.

Explain the failure mechanisms and recommend actionable solutions.
`;

            try {
                aiAnalysis = await generateResponse(
                    MODELS[0],
                    prompt
                );

            } catch (aiError) {
                console.error("AI Analysis Error:", aiError.message);

                aiAnalysis =
                    "AI analysis is currently unavailable: " +
                    aiError.message;
            }
        }

        res.json({
            success: true,
            report,
            aiAnalysis
        });

    } catch (error) {
        console.error("Full Test Suite Error:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ======================================================
// 5. AI TEST CASE GENERATION
// ======================================================

router.post("/generate-test-cases", async (req, res) => {
    try {
        const { url, sourceCode } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: "Website URL is required."
            });
        }

        // Build AI prompt
       const selectedScenario = req.body.selectedScenario || "ALL";

const prompt = buildTestCasePrompt(
    url,
    sourceCode || "No source code or requirements provided.",
    selectedScenario
);

        let testCases = null;
        let selectedModel = null;
        let lastError = null;

        // Try each model until valid test cases are generated.
        for (const model of MODELS) {
            try {
                console.log(`[TestNova] Trying model: ${model}`);

                const generatedText = await generateResponse(
                    model,
                    prompt
                );

                // Parse and validate the response.
                testCases = parseGeneratedTestCases(generatedText);

                selectedModel = model;

                console.log(
                    `[TestNova] Successfully generated ${testCases.length} test cases using ${model}`
                );

                break;

            } catch (error) {
                lastError = error;

                console.error(
                    `[TestNova] Model ${model} failed:`,
                    error.message
                );
            }
        }

        if (!testCases) {
            throw new Error(
                "All AI models failed to generate valid test cases. " +
                (lastError?.message || "")
            );
        }

        res.json({
            success: true,
            model: selectedModel,
            testCases
        });

    } catch (error) {
        console.error(
            "Test case generation error:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// ======================================================
// 6. EXECUTE AI-GENERATED TEST CASES USING PLAYWRIGHT
// ======================================================

router.post("/run-generated-tests", async (req, res) => {
    try {
        const { url, testCases } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: "Website URL is required."
            });
        }

        if (!Array.isArray(testCases) || testCases.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide generated test cases."
            });
        }

        if (testCases.length > 30) {
            return res.status(400).json({
                success: false,
                message: "Maximum 30 test cases are allowed per execution."
            });
        }

        const report = await executeGeneratedTests(
            url,
            testCases
        );

        res.json({
            success: true,
            message: "Generated test cases executed successfully.",
            report
        });

    } catch (error) {
        console.error(
            "Generated Test Execution Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;
