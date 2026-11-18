
const { chromium } = require("playwright");

async function testCouponStacking() {
    const browser = await chromium.launch({
        headless: true
    });

    try {
        const page = await browser.newPage();

        // Prepare a clean cart
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

        // Apply SAVE500 for the first time
        await page.locator("#couponInput").fill("SAVE500");
        await page.locator("#applyCouponBtn").click();

        const firstDiscountText = await page
            .locator("#cartDiscount")
            .textContent();

        // Apply the same coupon again
        await page.locator("#couponInput").fill("SAVE500");
        await page.locator("#applyCouponBtn").click();

        const secondDiscountText = await page
            .locator("#cartDiscount")
            .textContent();

        // Extract numeric discount values
        const firstDiscount = Number(
            firstDiscountText.replace(/[^\d]/g, "")
        );

        const secondDiscount = Number(
            secondDiscountText.replace(/[^\d]/g, "")
        );

        const bugDetected = secondDiscount > firstDiscount;

        return {
            testName: "Repeated coupon application",
            status: bugDetected ? "FAIL" : "PASS",
            expected: "Applying SAVE500 twice should not increase the discount",
            actual: `First discount: ₹${firstDiscount}, Second discount: ₹${secondDiscount}`,
            bugDetected: bugDetected
        };

    } finally {
        await browser.close();
    }
}

module.exports = { testCouponStacking };

if (require.main === module) {
    testCouponStacking()
        .then(result => console.log(result))
        .catch(error => console.error(error));
}
