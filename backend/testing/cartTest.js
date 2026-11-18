
const { chromium } = require("playwright");

async function testAddToCart() {
    const browser = await chromium.launch({
        headless: true
    });

    try {
        const page = await browser.newPage();

        // Clear old cart data before testing
        await page.addInitScript(() => {
            localStorage.removeItem("cart");
        });

        // Accept the alert displayed by ShopBug
        page.on("dialog", dialog => dialog.accept());

        // Open ShopBug homepage
        await page.goto("http://localhost:5000/shopbug/");

        // Select Wireless Headphones and click Add to Cart
        const product = page
            .locator(".product-card")
            .filter({ hasText: "Wireless Headphones" });

        await product.locator("button").click();

        // Read actual cart data from browser storage
        const cart = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem("cart")) || [];
        });

        // Verify the product details
        const addedProduct = cart.find(
            item => item.name === "Wireless Headphones"
        );

        const bugDetected =
            !addedProduct ||
            addedProduct.price !== 1499 ||
            addedProduct.quantity !== 1;

        return {
            testName: "Add product to cart",
            status: bugDetected ? "FAIL" : "PASS",
            expected: "Wireless Headphones, ₹1499, quantity 1",
            actual: addedProduct
                ? JSON.stringify(addedProduct)
                : "Product not found in cart",
            bugDetected: bugDetected
        };

    } finally {
        await browser.close();
    }
}

module.exports = { testAddToCart };
