
const { chromium } = require("playwright");

async function testEmptyCartCheckout() {
    const browser = await chromium.launch({
        headless: true
    });

    try {
        const page = await browser.newPage();

        // Clear the cart
        await page.addInitScript(() => {
            localStorage.removeItem("cart");
            localStorage.removeItem("appliedDiscount");
        });

        // Open checkout page directly
        await page.goto("http://localhost:5000/shopbug/checkout.html");

        // Fill customer details
        await page.locator("#fullName").fill("Test User");
        await page.locator("#address").fill("Hyderabad");
        await page.locator("#phone").fill("9876543210");

        // Submit checkout form
        await page.locator("#checkoutForm button[type='submit']").click();

        // Check whether the application navigated to payment
        await page.waitForTimeout(500);

        const currentUrl = page.url();

        const bugDetected = currentUrl.includes("payment.html");

        return {
            testName: "Checkout with empty cart",
            status: bugDetected ? "FAIL" : "PASS",
            expected: "Checkout should not proceed when cart is empty",
            actual: bugDetected
                ? "Navigated to payment page with empty cart"
                : "Checkout was blocked",
            bugDetected: bugDetected
        };

    } finally {
        await browser.close();
    }
}

module.exports = { testEmptyCartCheckout };

if (require.main === module) {
    testEmptyCartCheckout()
        .then(result => console.log(result))
        .catch(error => console.error(error));
}
