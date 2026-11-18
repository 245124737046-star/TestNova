
const { chromium } = require("playwright");

async function testLogin() {
    const browser = await chromium.launch({
        headless: true
    });

    try {
        const page = await browser.newPage();

        await page.goto("http://localhost:5000/shopbug/login.html");

        await page.locator("#email").fill("wronguser@gmail.com");
        await page.locator("#password").fill("wrongpassword123");

        await page.locator("#loginForm button[type='submit']").click();

        const message = await page.locator("#loginMessage").textContent();

        const bugDetected = message.includes("Login successful");

        return {
            testName: "Login with incorrect credentials",
            status: bugDetected ? "FAIL" : "PASS",
            expected: "Invalid email or password",
            actual: message.trim(),
            bugDetected: bugDetected
        };

    } finally {
        await browser.close();
    }
}

// Allow other backend files to use this function
module.exports = { testLogin };

// Also allow running this file directly
if (require.main === module) {
    testLogin()
        .then(result => console.log(result))
        .catch(error => console.error(error));
}
