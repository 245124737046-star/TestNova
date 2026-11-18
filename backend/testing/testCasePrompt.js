
function buildTestCasePrompt(url, sourceCode, selectedScenario = "ALL") {
    const isAll = selectedScenario === "ALL";

    return `
You are an expert software testing engineer working for TestNova.

WEBSITE URL:
${url}

WEBSITE SOURCE CODE OR REQUIREMENTS:
${sourceCode}

SELECTED SCENARIO:
${selectedScenario}

GENERATION RULES:

1. Analyze the supplied website source code and identify relevant features.
2. If the selected scenario is ALL, cover all identifiable e-commerce modules.
3. If a specific scenario is selected, generate exactly 4 test cases for that scenario.
4. If ALL is selected, generate 4 test cases for EACH identifiable major module.
5. Do not stop after generating only 4 test cases when ALL is selected.
6. Include positive, negative, and boundary test cases.
7. Use only selectors supported by the supplied source code.
8. Never invent selectors or website functionality.
9. Do not perform real purchases or real payments.
10. Generate independent test cases.

SUPPORTED ACTIONS:
navigate, click, fill, selectOption, check, uncheck, waitFor

SUPPORTED ASSERTIONS:
visible, text, url, count, value, hidden

OUTPUT FORMAT:

Return ONLY a valid JSON object:

{
  "testCases": [
    {
      "id": "TC-001",
      "name": "Valid login test",
      "feature": "Login",
      "priority": "High",
      "url": "/login.html",
      "steps": [
        {
          "action": "navigate",
          "value": "/login.html"
        },
        {
          "action": "fill",
          "selector": "#email",
          "value": "test@example.com"
        }
      ],
      "expectedResult": "User should be logged in successfully.",
      "assertions": [
        {
          "type": "visible",
          "selector": "#loginMessage",
          "expected": true
        }
      ]
    }
  ]
}

MANDATORY RULES:

1. Every test case MUST contain:
   id, name, feature, priority, url, steps, expectedResult, assertions.

2. expectedResult MUST be a meaningful human-readable string.
3. Every assertion MUST contain type, selector and expected.
4. Every step MUST use a supported action.
5. Every assertion MUST use a supported assertion type.
6. Every action except navigate MUST have a valid CSS selector.
7. Do not generate empty steps or assertions.
8. Do not include explanations, Markdown, or code fences.
9. Do not claim that tests passed or failed.
10. Return only valid JSON.

${isAll
    ? "Generate 4 test cases for EACH major e-commerce module identifiable from the supplied source code. Cover all relevant modules, not just one."
    : "Generate exactly 4 test cases for the selected scenario."}
`;
}

module.exports = { buildTestCasePrompt };
