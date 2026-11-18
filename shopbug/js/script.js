// ========================================================
// SHOPBUG - DEMO E-COMMERCE APPLICATION JAVASCRIPT
// Note: Contains intentional bugs for TestNova AI Platform testing.
// Preserve all intentional bugs and locator contracts.
// ========================================================

// --------------------------------------------------------
// 1. ADD TO CART FUNCTIONALITY
// (Targeted by TestNova cartTest.js)
// --------------------------------------------------------
function addToCart(name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Push new item into cart
    cart.push({
        name: name,
        price: price,
        quantity: 1
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    // Update global cart badge
    updateCartBadge();

    // Alert required by TestNova cartTest.js Playwright assertion
    alert(name + " added to cart!");
}

// Global cart count badge updater
function updateCartBadge() {
    const badge = document.getElementById("cartCount");
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalCount = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
    badge.textContent = totalCount;
}

// Run badge update on every page load
updateCartBadge();


// --------------------------------------------------------
// 2. SEARCH & CATEGORY FILTERING (Index Page)
// INTENTIONAL BUG #2: Case-Sensitive Search Glitch
// (Searching "headphones" fails to match "Wireless Headphones"
// because it compares against raw casing without .toLowerCase()!)
// --------------------------------------------------------
function searchProducts() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    // INTENTIONAL BUG #2: Raw value taken without .toLowerCase() or .trim()
    const searchValue = searchInput.value;

    const products = document.querySelectorAll(".product, .product-card");
    let matchCount = 0;

    products.forEach(product => {
        const heading = product.querySelector("h3");
        if (!heading) return;

        const productName = heading.textContent;

        // INTENTIONAL BUG: Case-sensitive search comparison
        if (productName.includes(searchValue)) {
            product.style.display = "flex";
            matchCount++;
        } else {
            product.style.display = "none";
        }
    });

    const countLabel = document.getElementById("productsCount");
    if (countLabel) {
        countLabel.textContent = `Showing ${matchCount} products`;
    }
}

function filterCategory(category) {
    // Update active tab buttons
    const buttons = document.querySelectorAll(".category-btn");
    buttons.forEach(btn => {
        if (btn.textContent.trim() === category || (category === 'All' && btn.textContent.includes('All'))) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    const products = document.querySelectorAll(".product, .product-card");
    let matchCount = 0;

    products.forEach(product => {
        const productCategory = product.getAttribute("data-category");

        if (category === "All" || productCategory === category) {
            product.style.display = "flex";
            matchCount++;
        } else {
            product.style.display = "none";
        }
    });

    const countLabel = document.getElementById("productsCount");
    if (countLabel) {
        countLabel.textContent = `Showing ${matchCount} products`;
    }
}


// --------------------------------------------------------
// 3. LOGIN FUNCTIONALITY (Login Page)
// INTENTIONAL BUG #1: Authentication Bypass (Login with any credentials)
// (Targeted by TestNova loginTest.js)
// --------------------------------------------------------
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const message = document.getElementById("loginMessage");

        if (email === "" || password === "") {
            message.textContent = "Please fill in all fields.";
            message.style.color = "red";
        } else {
            // INTENTIONAL BUG #1: Accepts any login credentials without validation
            // TestNova loginTest.js verifies message.includes("Login successful")
            message.textContent = "Login successful! Welcome to ShopBug.";
            message.style.color = "green";

            localStorage.setItem("loggedIn", "true");
        }
    });
}


// --------------------------------------------------------
// 4. CART DISPLAY & COUPON HANDLING (Cart Page)
// INTENTIONAL BUG #3: Allows Negative Quantity Entry
// INTENTIONAL BUG #4: Multi-stackable Coupon allowing negative total
// --------------------------------------------------------
function displayCart() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cartItems.innerHTML = "";
    let subtotal = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart-state">
                <div class="empty-cart-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Explore our catalog to find great deals.</p>
                <a href="index.html" class="btn">Start Shopping</a>
            </div>
        `;
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            cartItems.innerHTML += `
                <div class="cart-item-row product">
                    <div class="cart-item-info">
                        <h3>${item.name}</h3>
                        <p class="item-price">Price: ₹${item.price.toLocaleString()}</p>
                        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Subtotal: ₹${itemTotal.toLocaleString()}</p>
                    </div>

                    <div class="quantity-controls">
                        <button type="button" class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button>
                        
                        <!-- INTENTIONAL BUG #3: Direct editable quantity allows negative values -->
                        <input
                            type="number"
                            class="qty-input"
                            value="${item.quantity}"
                            onchange="updateQuantityDirectly(${index}, this.value)"
                            title="Direct quantity entry"
                        >

                        <button type="button" class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
                        <button type="button" class="remove-btn" onclick="removeItem(${index})">Remove</button>
                    </div>
                </div>
            `;
        });
    }

    // Read any applied discount
    const discount = parseInt(localStorage.getItem("appliedDiscount")) || 0;
    const finalTotal = subtotal - discount;

    const subtotalEl = document.getElementById("cartSubtotal");
    if (subtotalEl) {
        subtotalEl.textContent = "₹" + subtotal.toLocaleString();
    }

    const discountEl = document.getElementById("cartDiscount");
    if (discountEl) {
        discountEl.textContent = "- ₹" + discount.toLocaleString();
    }

    // Required by TestNova: "Total: ₹" format
    const totalEl = document.getElementById("cartTotal");
    if (totalEl) {
        totalEl.textContent = "Total: ₹" + finalTotal;
    }

    updateCartBadge();
}

function changeQuantity(index, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart[index].quantity = (parseInt(cart[index].quantity) || 1) + change;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
}

// INTENTIONAL BUG #3: Updates quantity directly without verifying if > 0
function updateQuantityDirectly(index, newQty) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const parsed = parseInt(newQty, 10);

    // INTENTIONAL BUG: Negative values are stored directly!
    cart[index].quantity = isNaN(parsed) ? 1 : parsed;

    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);

    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
}

// INTENTIONAL BUG #4: Multi-stackable coupon allowing unlimited discounts
function applyCoupon() {
    const input = document.getElementById("couponInput");
    const msg = document.getElementById("couponMessage");
    if (!input || !msg) return;

    const code = input.value.trim().toUpperCase();

    if (!code) {
        msg.textContent = "Please enter a promo code.";
        msg.style.color = "red";
        return;
    }

    let currentDiscount = parseInt(localStorage.getItem("appliedDiscount")) || 0;

    if (code === "SAVE500") {
        // INTENTIONAL BUG #4: Stacks indefinitely every time button is clicked
        currentDiscount += 500;
        localStorage.setItem("appliedDiscount", currentDiscount);
        msg.textContent = `Promo code SAVE500 applied! Total discount: ₹${currentDiscount}`;
        msg.style.color = "green";
    } else if (code === "FREE100") {
        currentDiscount += 10000;
        localStorage.setItem("appliedDiscount", currentDiscount);
        msg.textContent = "Super Promo FREE100 applied! Enjoy free shopping.";
        msg.style.color = "green";
    } else {
        // INTENTIONAL BUG: Even invalid codes give discount!
        currentDiscount += 200;
        localStorage.setItem("appliedDiscount", currentDiscount);
        msg.textContent = `Demo discount of ₹200 applied for code "${code}"!`;
        msg.style.color = "green";
    }

    displayCart();
}

function goToCheckout() {
    window.location.href = "checkout.html";
}

// Initial cart render
displayCart();


// --------------------------------------------------------
// 5. CHECKOUT FUNCTIONALITY (Checkout Page)
// INTENTIONAL BUG #5: Empty Cart Order Allowed
// INTENTIONAL BUG #6: Non-Numeric Phone Bypass
// --------------------------------------------------------
const checkoutForm = document.getElementById("checkoutForm");

if (checkoutForm) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const discount = parseInt(localStorage.getItem("appliedDiscount")) || 0;

    let subtotal = 0;
    const checkoutItemsList = document.getElementById("checkoutItemsList");

    if (checkoutItemsList) {
        if (cart.length === 0) {
            checkoutItemsList.innerHTML = `<p style="color: var(--text-muted); font-size: 14px;">Cart is currently empty (0 items).</p>`;
        } else {
            checkoutItemsList.innerHTML = cart.map(item => `
                <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                    <span>${item.name} × ${item.quantity}</span>
                    <strong>₹${(item.price * item.quantity).toLocaleString()}</strong>
                </div>
            `).join("");
        }
    }

    cart.forEach(item => {
        subtotal += item.price * (parseInt(item.quantity) || 1);
    });

    const total = subtotal - discount;

    const checkoutTotalEl = document.getElementById("checkoutTotal");
    if (checkoutTotalEl) {
        checkoutTotalEl.textContent = "Total: ₹" + total;
    }

    checkoutForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("fullName").value.trim();
        const address = document.getElementById("address").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const message = document.getElementById("checkoutMessage");

        // Non-empty check
        if (!name || !address || !phone) {
            message.textContent = "Please fill in all details.";
            message.style.color = "red";
            return;
        }

        // INTENTIONAL BUG #6: Does not validate phone format (accepts non-digits / arbitrary text)
        // INTENTIONAL BUG #5: Does NOT prevent checkout if cart is empty!

        localStorage.setItem("customerName", name);
        localStorage.setItem("customerPhone", phone);
        localStorage.setItem("customerAddress", address);

        window.location.href = "payment.html";
    });
}

// Geolocation integration
async function getCurrentLocation() {
    const addressInput = document.getElementById("address");
    const message = document.getElementById("locationMessage");

    if (!navigator.geolocation) {
        message.textContent = "Geolocation is not supported by your browser.";
        return;
    }

    message.textContent = "Getting your coordinates...";

    navigator.geolocation.getCurrentPosition(
        async function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
                );

                if (!response.ok) {
                    throw new Error("Address lookup failed");
                }

                const data = await response.json();

                addressInput.value = data.display_name || "";
                message.textContent = addressInput.value
                    ? "Current address detected!"
                    : "Address not found. Please enter it manually.";

            } catch (error) {
                message.textContent =
                    "Unable to fetch address via reverse-lookup. Please enter manually.";
            }
        },
        function() {
            message.textContent =
                "Location permission denied or unavailable.";
        }
    );
}


// --------------------------------------------------------
// 6. PAYMENT FUNCTIONALITY (Payment Page)
// INTENTIONAL BUG #7: Expired Credit Card Accepted
// --------------------------------------------------------
const paymentForm = document.getElementById("paymentForm");

if (paymentForm) {
    const upiSection = document.getElementById("upiSection");
    const cardSection = document.getElementById("cardSection");
    const codSection = document.getElementById("codSection");
    const paymentMessage = document.getElementById("paymentMessage");

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const discount = parseInt(localStorage.getItem("appliedDiscount")) || 0;

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * (parseInt(item.quantity) || 1);
    });

    const total = subtotal - discount;

    const paymentTotalEl = document.getElementById("paymentTotal");
    if (paymentTotalEl) {
        paymentTotalEl.textContent = "Total: ₹" + total;
    }

    // Toggle payment method sections
    document.querySelectorAll('input[name="payment"]').forEach(option => {
        option.addEventListener("change", function() {
            // Update active selected visual class on parent card
            document.querySelectorAll('.payment-option').forEach(card => card.classList.remove('selected'));
            const parentCard = this.closest('.payment-option');
            if (parentCard) parentCard.classList.add('selected');

            if (upiSection) upiSection.hidden = this.value !== "UPI";
            if (cardSection) cardSection.hidden = this.value !== "Card";
            if (codSection) codSection.hidden = this.value !== "COD";

            if (paymentMessage) {
                paymentMessage.textContent = "";
            }

            // On smaller screens, automatically scroll the details into view
            if (window.innerWidth <= 850) {
                const detailsPanel = document.querySelector(".payment-details-panel");
                if (detailsPanel) {
                    detailsPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }
        });
    });

    // UPI payment simulation
    const upiPayButton = document.getElementById("upiPayButton");
    if (upiPayButton) {
        upiPayButton.addEventListener("click", function() {
            const selectedApp = document.getElementById("upiApp").value;
            const merchantUPI = "merchant@upi";

            const upiLink =
                "upi://pay?pa=" + encodeURIComponent(merchantUPI) +
                "&pn=ShopBug" +
                "&am=" + total +
                "&cu=INR" +
                "&tn=ShopBug%20Demo%20Order";

            const upiMessage = document.getElementById("upiMessage");
            if (upiMessage) {
                upiMessage.textContent = "Opening UPI payment app: " + selectedApp;
            }

            const upiContinue = document.getElementById("upiContinue");
            if (upiContinue) {
                upiContinue.hidden = false;
            }

            window.location.href = upiLink;
        });
    }

    const upiContinue = document.getElementById("upiContinue");
    if (upiContinue) {
        upiContinue.addEventListener("click", function() {
            localStorage.setItem("paymentMethod", "UPI");
            localStorage.setItem("paymentStatus", "Demo - Not Verified");
            window.location.href = "success.html";
        });
    }

    // Payment Form Submit (Card & COD)
    paymentForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const selected = document.querySelector('input[name="payment"]:checked');

        if (!selected) {
            if (paymentMessage) {
                paymentMessage.textContent = "Please select a payment method.";
                paymentMessage.style.color = "red";
            }
            return;
        }

        if (selected.value === "Card") {
            const name = document.getElementById("cardName").value.trim();
            const number = document.getElementById("cardNumber").value.replace(/\s/g, "");
            const expiry = document.getElementById("expiryDate").value;
            const cvv = document.getElementById("cvv").value;

            // INTENTIONAL BUG #7: Card expiry is only checked for presence (!expiry),
            // but NEVER checked against today's date! Expired dates (e.g. 2020-05) pass!
            if (!name || !/^\d{12,19}$/.test(number) || !expiry || !/^\d{3,4}$/.test(cvv)) {
                if (paymentMessage) {
                    paymentMessage.textContent = "Please enter valid card details.";
                    paymentMessage.style.color = "red";
                }
                return;
            }

            if (paymentMessage) {
                paymentMessage.textContent = "Demo card validation successful!";
                paymentMessage.style.color = "green";
            }
        }

        localStorage.setItem("paymentMethod", selected.value);
        localStorage.setItem("paymentStatus", "Demo - Confirmed");

        window.location.href = "success.html";
    });
}


// --------------------------------------------------------
// 7. ORDER SUCCESS FUNCTIONALITY (Success Page)
// --------------------------------------------------------
const customerNameElement = document.getElementById("customerName");

if (customerNameElement) {
    customerNameElement.textContent = localStorage.getItem("customerName") || "Guest User";

    const methodEl = document.getElementById("paymentMethod");
    if (methodEl) {
        methodEl.textContent = localStorage.getItem("paymentMethod") || "Demo Mode";
    }

    const statusEl = document.getElementById("paymentStatus");
    if (statusEl) {
        statusEl.textContent = localStorage.getItem("paymentStatus") || "Demo Order Completed";
    }

    const orderNumEl = document.getElementById("orderNumber");
    if (orderNumEl) {
        const randomId = Math.floor(10000 + Math.random() * 90000);
        orderNumEl.textContent = "SB-" + randomId;
    }

    // Clear cart and discounts after successful checkout
    localStorage.removeItem("cart");
    localStorage.removeItem("appliedDiscount");

    updateCartBadge();
}
