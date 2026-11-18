
const { chromium } = require("playwright");

async function testInvalidPhoneNumber() {
    const browser = await chromium.launch({
        headless: true
    });

    try {
        const page = await browser.newPage();

        // Prepare a cart with one product
        await page.addInitScript(() => {
            localStorage.removeItem("appliedDiscount");

            localStorage.setItem("cart", JSON.stringify([
                {
                    name: "Wireless Headphones",
                    price: 1499,
                    quantity: 1
                }
            ]));
        });

        // Open checkout page
        await page.goto("http://localhost:5000/shopbug/checkout.html");

        // Enter customer details with an invalid phone number
        await page.locator("#fullName").fill("Test User");
        await page.locator("#address").fill("Hyderabad");
        await page.locator("#phone").fill("abcdefghij");

        // Submit checkout form
        await page.locator("#checkoutForm button[type='submit']").click();

        await page.waitForTimeout(500);

        const currentUrl = page.url();

        const bugDetected = currentUrl.includes("payment.html");

        return {
            testName: "Checkout with non-numeric phone number",
            status: bugDetected ? "FAIL" : "PASS",
            expected: "Checkout should reject non-numeric phone numbers",
            actual: bugDetected
                ? "Accepted invalid phone number and navigated to payment"
                : "Invalid phone number was rejected",
            bugDetected: bugDetected
        };

    } finally {
        await browser.close();
    }
}

module.exports = { testInvalidPhoneNumber };

if (require.main === module) {
    testInvalidPhoneNumber()
        .then(result => console.log(result))
        .catch(error => console.error(error));
}
