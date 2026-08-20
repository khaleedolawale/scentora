// ============================================
// PRODUCTS — fetching from Supabase & rendering to the page
// ============================================

// Fetch only featured, available products for the homepage
async function fetchFeaturedProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("featured", true)
    .eq("available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }

  return data;
}

// Turn one product object into an HTML card
function renderProductCard(product) {
  return `
      <div class="product-card">
        <div class="product-card__image">
          <img src="${product.image_url}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-card__info">
          <h3>${product.name}</h3>
          <p class="product-card__size">${product.size}</p>
          <p class="product-card__price">${CONFIG.currency}${Number(
    product.price
  ).toLocaleString()}</p>
        </div>
      </div>
    `;
}

// Load featured products into the homepage section
async function loadFeaturedProducts() {
  const container = document.getElementById("featured-products");
  if (!container) return; // safety check — only run on pages that have this element

  container.innerHTML = '<p class="loading-text">Loading fragrances...</p>';

  const products = await fetchFeaturedProducts();

  if (products.length === 0) {
    container.innerHTML =
      '<p class="loading-text">No featured fragrances yet.</p>';
    return;
  }

  container.innerHTML = products.map(renderProductCard).join("");
}

// Run when the page loads
document.addEventListener("DOMContentLoaded", loadFeaturedProducts);

// ============================================
// SHOP PAGE LOGIC
// ============================================

let allProducts = []; // cache so we don't refetch on every filter/search

// Fetch ALL products (not just featured) for the shop page
async function fetchAllProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data;
}

// Build a product card, with SOLD OUT handling
function renderShopProductCard(product) {
  const soldOut = !product.available;

  return `
    <div class="product-card">
      <a href="product.html?id=${product.id}" class="product-card__link">
        <div class="product-card__image">
          <img src="${product.image_url}" alt="${product.name}" loading="lazy">
          ${soldOut ? '<span class="sold-out-badge">SOLD OUT</span>' : ""}
        </div>
        <div class="product-card__info">
          <h3>${product.name}</h3>
          <p class="product-card__size">${product.size} · ${
    product.category
  }</p>
          <p class="product-card__price">${CONFIG.currency}${Number(
    product.price
  ).toLocaleString()}</p>
        </div>
      </a>
      <button class="btn btn--primary add-to-cart-btn" 
              data-id="${product.id}" 
              ${soldOut ? "disabled" : ""}>
        ${soldOut ? "Sold Out" : "Add to Cart"}
      </button>
    </div>
  `;
}

// Apply search + category filter to the cached products, then render
function applyFiltersAndRender() {
  const searchTerm =
    document.getElementById("searchInput")?.value.toLowerCase() || "";
  const activeBtn = document.querySelector(".filter-btn.active");
  const activeCategory = activeBtn ? activeBtn.dataset.category : "all";

  let filtered = allProducts;

  if (activeCategory !== "all") {
    filtered = filtered.filter((p) => p.category === activeCategory);
  }

  if (searchTerm) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
    );
  }

  const container = document.getElementById("shopProducts");
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML =
      '<p class="loading-text">No fragrances match your search.</p>';
    return;
  }

  container.innerHTML = filtered.map(renderShopProductCard).join("");
}

// Initialize the shop page
async function initShopPage() {
  const container = document.getElementById("shopProducts");
  if (!container) return; // only run on shop.html

  container.innerHTML = '<p class="loading-text">Loading fragrances...</p>';

  allProducts = await fetchAllProducts();

  // Check for ?category=Oud in the URL (from homepage category cards)
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get("category");

  if (categoryFromUrl) {
    const matchingBtn = document.querySelector(
      `.filter-btn[data-category="${categoryFromUrl}"]`
    );
    if (matchingBtn) {
      document.querySelector(".filter-btn.active")?.classList.remove("active");
      matchingBtn.classList.add("active");
    }
  }

  applyFiltersAndRender();

  // Category filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".filter-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      applyFiltersAndRender();
    });
  });

  // Search input — filter as you type
  document
    .getElementById("searchInput")
    ?.addEventListener("input", applyFiltersAndRender);

  // Add to cart buttons (event delegation — handles all cards, even after re-render)
  document.getElementById("shopProducts")?.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-cart-btn") && !e.target.disabled) {
      const productId = e.target.dataset.id;
      const product = allProducts.find((p) => p.id === productId);
      if (product) {
        addToCart(product, 1);
        e.target.textContent = "Added ✓";
        setTimeout(() => {
          e.target.textContent = "Add to Cart";
        }, 1500);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", initShopPage);

// ============================================
// PRODUCT DETAIL PAGE LOGIC
// ============================================

let currentQuantity = 1; // tracks the quantity selector state

// Fetch a single product by its ID
async function fetchProductById(id) {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  return data;
}

// Build the full product detail layout
function renderProductDetail(product) {
  const soldOut = !product.available;

  return `
    <div class="product-detail__image">
      <img src="${product.image_url}" alt="${product.name}">
      ${
        soldOut
          ? '<span class="sold-out-badge sold-out-badge--large">SOLD OUT</span>'
          : ""
      }
    </div>

    <div class="product-detail__info">
      <p class="product-detail__category">${product.category}</p>
      <h1>${product.name}</h1>
      <p class="product-detail__price">${CONFIG.currency}${Number(
    product.price
  ).toLocaleString()}</p>
      <p class="product-detail__size">Size: ${product.size}</p>
      <p class="product-detail__description">${product.description || ""}</p>

      ${
        soldOut
          ? `
        <p class="sold-out-text">This fragrance is currently sold out.</p>
        <button class="btn btn--primary" disabled>Sold Out</button>
      `
          : `
        <div class="quantity-selector">
          <button id="qtyMinus" class="qty-btn">−</button>
          <span id="qtyValue">1</span>
          <button id="qtyPlus" class="qty-btn">+</button>
        </div>
        <button class="btn btn--primary add-to-cart-btn" id="addToCartBtn" data-id="${product.id}">
          Add to Cart
        </button>
      `
      }

      <a href="shop.html" class="back-link">← Back to Shop</a>
    </div>
  `;
}

// Set up quantity +/- buttons
function initQuantitySelector() {
  const minusBtn = document.getElementById("qtyMinus");
  const plusBtn = document.getElementById("qtyPlus");
  const qtyValue = document.getElementById("qtyValue");

  if (!minusBtn || !plusBtn) return; // sold out products don't have these

  currentQuantity = 1;

  minusBtn.addEventListener("click", () => {
    if (currentQuantity > 1) {
      currentQuantity--;
      qtyValue.textContent = currentQuantity;
    }
  });

  plusBtn.addEventListener("click", () => {
    currentQuantity++;
    qtyValue.textContent = currentQuantity;
  });
}

// Initialize the product detail page
async function initProductPage() {
  const container = document.getElementById("productDetail");
  if (!container) return; // only run on product.html

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    container.innerHTML =
      '<p class="loading-text">No product specified. <a href="shop.html">Return to shop</a>.</p>';
    return;
  }

  const product = await fetchProductById(productId);

  if (!product) {
    container.innerHTML =
      '<p class="loading-text">Fragrance not found. <a href="shop.html">Return to shop</a>.</p>';
    return;
  }

  container.innerHTML = renderProductDetail(product);
  container.classList.add("product-detail--loaded");

  initQuantitySelector();

  // Add to cart button — cart logic comes in Phase 7, this is just the hook point
  const addBtn = document.getElementById("addToCartBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      addToCart(product, currentQuantity);
      addBtn.textContent = "Added ✓";
      setTimeout(() => {
        addBtn.textContent = "Add to Cart";
      }, 1500);
    });
  }
}

document.addEventListener("DOMContentLoaded", initProductPage);
