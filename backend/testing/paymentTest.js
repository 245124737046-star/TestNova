
const { chromium } = require("playwright");

async function testExpiredCard() {
    const browser = await chromium.launch({
        headless: true
    });

    try {
        const page = await browser.newPage();

        // Prepare a cart and customer details
        await page.addInitScript(() => {
            localStorage.setItem("cart", JSON.stringify([
                {
                    name: "Wireless Headphones",
                    price: 1499,
                    quantity: 1
                }
            ]));

            localStorage.setItem("customer", JSON.stringify({
                name: "Test User",
                address: "Hyderabad",
                phone: "9876543210"
            }));
        });

        // Open payment page
        await page.goto("http://localhost:5000/shopbug/payment.html");

        // Select Card payment
        await page.locator('input[name="payment"][value="Card"]').check();

        // Enter card details with an expired date
        await page.locator("#cardName").fill("Test User");
        await page.locator("#cardNumber").fill("1234567890123456");
        await page.locator("#expiryDate").fill("2020-01");
        await page.locator("#cvv").fill("123");

        // Submit payment form
        await page.locator("#cardPayButton").click();

        await page.waitForTimeout(500);

        const currentUrl = page.url();

        const bugDetected = currentUrl.includes("success.html");

        return {
            testName: "Payment using expired card",
            status: bugDetected ? "FAIL" : "PASS",
            expected: "Expired cards should be rejected",
            actual: bugDetected
                ? "Expired card accepted and navigated to success page"
                : "Expired card was rejected",
            bugDetected: bugDetected
        };

    } finally {
        await browser.close();
    }
}

module.exports = { testExpiredCard };

if (require.main === module) {
    testExpiredCard()
        .then(result => console.log(result))
        .catch(error => console.error(error));
}
