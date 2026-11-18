
const { testLogin } = require("./loginTest");
const { testAddToCart } = require("./cartTest");
const { testProductSearch } = require("./searchTest");
const { testNegativeQuantity } = require("./quantityTest");
const { testCouponStacking } = require("./couponTest");
const { testEmptyCartCheckout } = require("./checkoutTest");
const { testInvalidPhoneNumber } = require("./phoneTest");
const { testExpiredCard } = require("./paymentTest");

async function runAllTests() {

    const results = [];

    const tests = [
        { name: "Login Test", execute: testLogin },
        { name: "Add to Cart Test", execute: testAddToCart },
        { name: "Product Search Test", execute: testProductSearch },
        { name: "Negative Quantity Test", execute: testNegativeQuantity },
        { name: "Coupon Stacking Test", execute: testCouponStacking },
        { name: "Empty Cart Checkout Test", execute: testEmptyCartCheckout },
        { name: "Invalid Phone Number Test", execute: testInvalidPhoneNumber },
        { name: "Expired Card Test", execute: testExpiredCard }
    ];

    for (const test of tests) {

        try {
            console.log("Running:", test.name);

            const result = await test.execute();

            results.push(result);

        } catch (error) {

            results.push({
                testName: test.name,
                status: "ERROR",
                expected: "Test should execute successfully",
                actual: error.message,
                bugDetected: false
            });
        }
    }

    const total = results.length;

    const passed = results.filter(
        test => test.status === "PASS"
    ).length;

    const failed = results.filter(
        test => test.status === "FAIL"
    ).length;

    const errors = results.filter(
        test => test.status === "ERROR"
    ).length;

    return {
        summary: {
            total,
            passed,
            failed,
            errors
        },
        results
    };
}

module.exports = { runAllTests };

// Allow running all tests directly
if (require.main === module) {
    console.log("Starting TestNova test execution...\n");

    runAllTests()
        .then(result => {
            console.log("\n========== TEST SUMMARY ==========");
            console.log(result.summary);

            console.log("\n========== INDIVIDUAL RESULTS ==========");

            result.results.forEach(test => {
                console.log("\n", test);
            });
        })
        .catch(error => {
            console.error("Test execution failed:", error);
        });
}
