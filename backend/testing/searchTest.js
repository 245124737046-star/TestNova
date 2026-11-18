
const { chromium } = require("playwright");

async function testProductSearch() {
    const browser = await chromium.launch({
        headless: true
    });

    try {
        const page = await browser.newPage();

        await page.goto("http://localhost:5000/shopbug/");

        // Search using lowercase letters
        await page.locator("#searchInput").fill("headphones");
        await page.locator("#searchBtn").click();

        // Count visible products
        const visibleProducts = await page.locator(
            ".product-card:visible"
        ).count();

        const bugDetected = visibleProducts === 0;

        return {
            testName: "Product search with lowercase keyword",
            status: bugDetected ? "FAIL" : "PASS",
            expected: "Wireless Headphones should be displayed",
            actual: visibleProducts > 0
                ? `${visibleProducts} matching product(s) displayed`
                : "No matching products displayed",
            bugDetected: bugDetected
        };

    } finally {
        await browser.close();
    }
}

module.exports = { testProductSearch };

// Allow standalone execution
if (require.main === module) {
    testProductSearch()
        .then(result => console.log(result))
        .catch(error => console.error(error));
}
