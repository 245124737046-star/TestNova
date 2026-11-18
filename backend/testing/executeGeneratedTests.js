
const { chromium } = require("playwright");

const SUPPORTED_ACTIONS = [
    "navigate",
    "click",
    "fill",
    "selectOption",
    "check",
    "uncheck",
    "waitFor"
];

const SUPPORTED_ASSERTIONS = [
    "visible",
    "text",
    "url",
    "count",
    "value",
    "hidden"
];

// Resolve relative URLs and prevent tests from navigating to another domain.
function resolveUrl(value, baseUrl) {
    const resolved = new URL(value, baseUrl);
    const base = new URL(baseUrl);

    if (!["http:", "https:"].includes(resolved.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are allowed.");
    }

    if (resolved.origin !== base.origin) {
        throw new Error("Navigation to a different website domain is not allowed.");
    }

    return resolved.href;
}

function validateTestCase(testCase) {
    if (
        !testCase ||
        typeof testCase.name !== "string" ||
        !Array.isArray(testCase.steps) ||
        !Array.isArray(testCase.assertions)
    ) {
        throw new Error("Invalid test case structure.");
    }

    for (const step of testCase.steps) {
        if (!SUPPORTED_ACTIONS.includes(step.action)) {
            throw new Error(`Unsupported action: ${step.action}`);
        }

        if (
            step.action !== "navigate" &&
            typeof step.selector !== "string"
        ) {
            throw new Error(`${step.action} requires a selector.`);
        }

        if (
            ["click", "fill", "selectOption", "check", "uncheck"].includes(step.action) &&
            !step.selector
        ) {
            throw new Error(`${step.action} requires a valid selector.`);
        }

        if (
            ["fill", "selectOption"].includes(step.action) &&
            step.value === undefined
        ) {
            throw new Error(`${step.action} requires a value.`);
        }

        if (step.action === "navigate" && typeof step.value !== "string") {
            throw new Error("Navigate requires a URL in value.");
        }
    }

    for (const assertion of testCase.assertions) {
        if (!SUPPORTED_ASSERTIONS.includes(assertion.type)) {
            throw new Error(`Unsupported assertion: ${assertion.type}`);
        }

        if (assertion.expected === undefined) {
            throw new Error(
                `Assertion "${assertion.type}" requires an expected value.`
            );
        }

        if (
            assertion.type !== "url" &&
            typeof assertion.selector !== "string"
        ) {
            throw new Error(
                `Assertion "${assertion.type}" requires a selector.`
            );
        }
    }
}

async function executeStep(page, step, baseUrl) {
    const timeout = 10000;

    switch (step.action) {
        case "navigate": {
            const targetUrl = resolveUrl(step.value, baseUrl);
            await page.goto(targetUrl, {
                waitUntil: "domcontentloaded",
                timeout
            });
            break;
        }

        case "click":
            await page.locator(step.selector).click({ timeout });
            break;

        case "fill":
            await page.locator(step.selector).fill(String(step.value), {
                timeout
            });
            break;

        case "selectOption":
            await page.locator(step.selector).selectOption(String(step.value), {
                timeout
            });
            break;

        case "check":
            await page.locator(step.selector).check({ timeout });
            break;

        case "uncheck":
            await page.locator(step.selector).uncheck({ timeout });
            break;

        case "waitFor":
            await page.locator(step.selector).waitFor({
                state: step.state || "visible",
                timeout
            });
            break;

        default:
            throw new Error(`Unsupported action: ${step.action}`);
    }
}

async function verifyAssertion(page, assertion) {
    const { type, selector, expected } = assertion;
    let actual;

    switch (type) {
        case "visible":
            actual = await page.locator(selector).isVisible();
            break;

        case "hidden":
            actual = await page.locator(selector).isHidden();
            break;

        case "text":
            actual = await page.locator(selector).innerText();
            break;

        case "url":
            actual = page.url();
            break;

        case "count":
            actual = await page.locator(selector).count();
            break;

        case "value":
            actual = await page.locator(selector).inputValue();
            break;

        default:
            throw new Error(`Unsupported assertion: ${type}`);
    }

    let passed;

    switch (type) {
        case "visible":
        case "hidden":
            passed = actual === expected;
            break;

        case "text":
            passed = actual.includes(String(expected));
            break;

        case "url":
            passed = actual.includes(String(expected));
            break;

        case "count":
            passed = actual === Number(expected);
            break;

        case "value":
            passed = actual === String(expected);
            break;
    }

    return {
        type,
        selector: selector || null,
        expected,
        actual,
        passed
    };
}

async function executeGeneratedTests(baseUrl, testCases) {
    if (!Array.isArray(testCases) || testCases.length === 0) {
        throw new Error("Please provide at least one generated test case.");
    }

    const parsedBaseUrl = new URL(baseUrl);

    if (!["http:", "https:"].includes(parsedBaseUrl.protocol)) {
        throw new Error("Website URL must use HTTP or HTTPS.");
    }

    const browser = await chromium.launch({
        headless: true
    });

    const results = [];

    try {
        for (const testCase of testCases) {
            let context;

            try {
                validateTestCase(testCase);

                context = await browser.newContext();
                const page = await context.newPage();

                // Open the target website before executing the steps.
                await page.goto(parsedBaseUrl.href, {
                    waitUntil: "domcontentloaded",
                    timeout: 15000
                });

                for (const step of testCase.steps) {
                    await executeStep(page, step, parsedBaseUrl.href);
                }

                const assertionResults = [];

                for (const assertion of testCase.assertions) {
                    assertionResults.push(
                        await verifyAssertion(page, assertion)
                    );
                }

                const failedAssertions = assertionResults.filter(
                    item => !item.passed
                );

                results.push({
                    testName: testCase.name,
                    status: failedAssertions.length === 0 ? "PASS" : "FAIL",
                    expected: assertionResults.map(item => item.expected),
                    actual: assertionResults.map(item => item.actual),
                    bugDetected: failedAssertions.length > 0,
                    assertionResults
                });
            } catch (error) {
                results.push({
                    testName: testCase.name || "Unnamed test",
                    status: "ERROR",
                    expected: "Test should execute and verify successfully",
                    actual: error.message,
                    bugDetected: false
                });
            } finally {
                if (context) {
                    await context.close();
                }
            }
        }
    } finally {
        await browser.close();
    }

    const summary = {
        total: results.length,
        passed: results.filter(test => test.status === "PASS").length,
        failed: results.filter(test => test.status === "FAIL").length,
        errors: results.filter(test => test.status === "ERROR").length
    };

    return {
        summary,
        results
    };
}

module.exports = { executeGeneratedTests };
