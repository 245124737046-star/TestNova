const { chromium } = require("playwright");

async function testNegativeQuantity() {
    const browser = await chromium.launch({
        headless: true
    });

    try {
        const page = await browser.newPage();

        // Clear old cart data and add one product
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

        // Open cart page
        await page.goto("http://localhost:5000/shopbug/cart.html");

        // Enter a negative quantity
        const quantityInput = page.locator(".qty-input");

        await quantityInput.fill("-2");
        await quantityInput.dispatchEvent("change");

        // Read updated cart data
        const cart = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem("cart")) || [];
        });

        const actualQuantity = cart.length > 0
            ? cart[0].quantity
            : 0;

        const bugDetected = actualQuantity < 0;

        return {
            testName: "Negative quantity entry",
            status: bugDetected ? "FAIL" : "PASS",
            expected: "Negative quantities should not be accepted",
            actual: `Quantity stored: ${actualQuantity}`,
            bugDetected: bugDetected
        };

    } finally {
        await browser.close();
    }
}

module.exports = { testNegativeQuantity };

if (require.main === module) {
    testNegativeQuantity()
        .then(result => console.log(result))
        .catch(error => console.error(error));
}