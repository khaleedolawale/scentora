// ============================================
// CART — localStorage-backed shopping cart
// ============================================

const CART_STORAGE_KEY = "scentora_cart";

// Safely read the cart from localStorage
function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Cart data corrupted, resetting cart:", error);
    return [];
  }
}

// Save the cart array back to localStorage
function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartBadge();
}

// Add a product to the cart (or increase quantity if already in cart)
function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      size: product.size,
      image_url: product.image_url,
      quantity: quantity,
    });
  }

  saveCart(cart);
}

// Remove a product entirely from the cart
function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  saveCart(cart);
}

// Update quantity for a specific item (used by +/- buttons on cart page)
function updateCartQuantity(productId, newQuantity) {
  let cart = getCart();

  if (newQuantity < 1) {
    cart = cart.filter((item) => item.id !== productId);
  } else {
    const item = cart.find((item) => item.id === productId);
    if (item) item.quantity = newQuantity;
  }

  saveCart(cart);
}

// Clear the entire cart
function clearCart() {
  saveCart([]);
}

// Calculate total number of items (sum of all quantities)
function getCartItemCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

// Calculate cart subtotal
function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Update the 🛒 badge count in the navbar (runs on every page)
function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (badge) {
    badge.textContent = getCartItemCount();
  }
}

// Run on every page load
document.addEventListener("DOMContentLoaded", updateCartBadge);

// ============================================
// CART PAGE RENDERING
// ============================================

// Build HTML for a single cart line item
function renderCartItem(item) {
  const lineTotal = item.price * item.quantity;

  return `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image_url}" alt="${
    item.name
  }" class="cart-item__image">
        
        <div class="cart-item__info">
          <h3>${item.name}</h3>
          <p class="cart-item__size">${item.size}</p>
          <p class="cart-item__price">${CONFIG.currency}${Number(
    item.price
  ).toLocaleString()}</p>
        </div>
  
        <div class="cart-item__controls">
          <div class="quantity-selector quantity-selector--small">
            <button class="qty-btn cart-qty-minus" data-id="${
              item.id
            }">−</button>
            <span>${item.quantity}</span>
            <button class="qty-btn cart-qty-plus" data-id="${
              item.id
            }">+</button>
          </div>
          <p class="cart-item__line-total">${
            CONFIG.currency
          }${lineTotal.toLocaleString()}</p>
          <button class="cart-item__remove" data-id="${item.id}">Remove</button>
        </div>
      </div>
    `;
}

// Render the full cart page (items + summary, or empty state)
function renderCartPage() {
  const container = document.getElementById("cartContent");
  if (!container) return; // only run on cart.html

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
        <div class="cart-empty">
          <p>Your cart is empty.</p>
          <a href="shop.html" class="btn btn--primary">Start Shopping</a>
        </div>
      `;
    return;
  }

  const itemsHtml = cart.map(renderCartItem).join("");
  const total = getCartTotal();
  const itemCount = getCartItemCount();

  container.innerHTML = `
      <div class="cart-items">
        ${itemsHtml}
      </div>
  
      <div class="cart-summary">
        <div class="cart-summary__row">
          <span>Items (${itemCount})</span>
          <span>${CONFIG.currency}${total.toLocaleString()}</span>
        </div>
        <div class="cart-summary__row cart-summary__row--total">
          <span>Total</span>
          <span>${CONFIG.currency}${total.toLocaleString()}</span>
        </div>
  
        <button class="btn btn--primary cart-order-btn" id="orderNowBtn">Order Now via WhatsApp</button>
        <div class="cart-actions">
          <a href="shop.html" class="cart-actions__continue">Continue Shopping</a>
          <button class="cart-actions__clear" id="clearCartBtn">Clear Cart</button>
        </div>
      </div>
    `;

  attachCartPageListeners();
}

// Attach all click handlers for the cart page (re-run after every render)
function attachCartPageListeners() {
  // Quantity minus
  document.querySelectorAll(".cart-qty-minus").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const item = getCart().find((i) => i.id === id);
      if (item) {
        updateCartQuantity(id, item.quantity - 1);
        renderCartPage();
      }
    });
  });

  // Quantity plus
  document.querySelectorAll(".cart-qty-plus").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const item = getCart().find((i) => i.id === id);
      if (item) {
        updateCartQuantity(id, item.quantity + 1);
        renderCartPage();
      }
    });
  });

  // Remove item
  document.querySelectorAll(".cart-item__remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeFromCart(btn.dataset.id);
      renderCartPage();
    });
  });

  // Clear cart
  document.getElementById("clearCartBtn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      clearCart();
      renderCartPage();
    }
  });

  // Order Now via WhatsApp
  document
    .getElementById("orderNowBtn")
    ?.addEventListener("click", handleOrderNow);
}

document.addEventListener("DOMContentLoaded", renderCartPage);
