// ============================================
// ADMIN DASHBOARD — stats + product list
// ============================================

let adminProducts = []; // cache of all products for the admin view

// Fetch ALL products (admin sees everything — available, sold out, featured or not)
async function fetchAdminProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin products:", error);
    return [];
  }

  return data;
}

// Calculate dashboard stats from the product list
function calculateStats(products) {
  return {
    total: products.length,
    available: products.filter((p) => p.available).length,
    soldOut: products.filter((p) => !p.available).length,
    featured: products.filter((p) => p.featured).length,
  };
}

// Render the stats cards
function renderStatsCards(stats) {
  return `
    <div class="admin-stats">
      <div class="stat-card">
        <p class="stat-card__value">${stats.total}</p>
        <p class="stat-card__label">Total Products</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__value">${stats.available}</p>
        <p class="stat-card__label">Available</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__value">${stats.soldOut}</p>
        <p class="stat-card__label">Sold Out</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__value">${stats.featured}</p>
        <p class="stat-card__label">Featured</p>
      </div>
    </div>
  `;
}

// Render a single row in the product list
function renderAdminProductRow(product) {
  return `
    <div class="admin-product-row" data-id="${product.id}">
      <img src="${product.image_url}" alt="${
    product.name
  }" class="admin-product-row__image">
      
      <div class="admin-product-row__info">
        <h4>${product.name}</h4>
        <p>${product.category} · ${product.size} · ${CONFIG.currency}${Number(
    product.price
  ).toLocaleString()}</p>
      </div>

      <div class="admin-product-row__badges">
        <span class="badge ${
          product.available ? "badge--available" : "badge--sold-out"
        }">
          ${product.available ? "Available" : "Sold Out"}
        </span>
        ${
          product.featured
            ? '<span class="badge badge--featured">Featured</span>'
            : ""
        }
      </div>

      <div class="admin-product-row__actions">
        <button class="admin-action-btn edit-product-btn" data-id="${
          product.id
        }">Edit</button>
        <button class="admin-action-btn toggle-available-btn" data-id="${
          product.id
        }" data-current="${product.available}">
          ${product.available ? "Mark Sold Out" : "Mark Available"}
        </button>
        <button class="admin-action-btn toggle-featured-btn" data-id="${
          product.id
        }" data-current="${product.featured}">
          ${product.featured ? "Unfeature" : "Feature"}
        </button>
        <button class="admin-action-btn admin-action-btn--danger delete-product-btn" data-id="${
          product.id
        }">Delete</button>
      </div>
    </div>
  `;
}

// Render the full dashboard content
function renderDashboardContent() {
  const container = document.getElementById("adminMain");
  if (!container) return;

  const stats = calculateStats(adminProducts);

  container.innerHTML = `
    ${renderStatsCards(stats)}

    <div class="admin-section-header">
      <h2>Manage Products</h2>
      <button class="btn btn--primary" id="addProductBtn">+ Add New Product</button>
    </div>

    <div class="admin-product-list" id="adminProductList">
      ${
        adminProducts.length === 0
          ? '<p class="loading-text">No products yet. Add your first one!</p>'
          : adminProducts.map(renderAdminProductRow).join("")
      }
    </div>
  `;

  attachAdminListeners();
}

// Attach all click handlers for the dashboard
function attachAdminListeners() {
  // Add product button
  document
    .getElementById("addProductBtn")
    ?.addEventListener("click", openAddProductModal);

  // Edit buttons
  document.querySelectorAll(".edit-product-btn").forEach((btn) => {
    btn.addEventListener("click", () => openEditProductModal(btn.dataset.id));
  });

  // Delete buttons
  document.querySelectorAll(".delete-product-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteProduct(btn.dataset.id));
  });

  // Toggle available
  document.querySelectorAll(".toggle-available-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = btn.dataset.current === "true";
      handleToggleAvailable(btn.dataset.id, current);
    });
  });

  // Toggle featured
  document.querySelectorAll(".toggle-featured-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = btn.dataset.current === "true";
      handleToggleFeatured(btn.dataset.id, current);
    });
  });
}

// Called by auth.js once login is confirmed
let modalInitialized = false;

async function initAdminDashboard() {
  const container = document.getElementById("adminMain");
  container.innerHTML = '<p class="loading-text">Loading dashboard...</p>';

  adminProducts = await fetchAdminProducts();
  renderDashboardContent();

  if (!modalInitialized) {
    initProductModal();
    modalInitialized = true;
  }
}

// ============================================
// ADD / EDIT PRODUCT MODAL
// ============================================

let editingProductId = null; // null = adding new, otherwise = editing this ID

// Open the modal for adding a new product
function openAddProductModal() {
  editingProductId = null;
  document.getElementById("modalTitle").textContent = "Add New Product";
  document.getElementById("productForm").reset();
  document.getElementById("imagePreview").style.display = "none";
  document.getElementById("formError").textContent = "";
  document.getElementById("formSubmitBtn").textContent = "Publish Product";
  document.getElementById("productModalOverlay").classList.add("is-active");
}

// Close the product modal
function closeProductModal() {
  document.getElementById("productModalOverlay").classList.remove("is-active");
}

// Open the modal pre-filled with an existing product's data
function openEditProductModal(productId) {
  const product = adminProducts.find((p) => p.id === productId);
  if (!product) return;

  editingProductId = productId;

  document.getElementById("modalTitle").textContent = "Edit Product";
  document.getElementById("formError").textContent = "";
  document.getElementById("formSubmitBtn").textContent = "Save Changes";

  document.getElementById("productName").value = product.name;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productSize").value = product.size;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productDescription").value =
    product.description || "";
  document.getElementById("productAvailable").checked = product.available;
  document.getElementById("productFeatured").checked = product.featured;

  document.getElementById("productImage").value = ""; // file inputs can't be pre-filled
  const preview = document.getElementById("imagePreview");
  preview.src = product.image_url;
  preview.style.display = "block";

  document.getElementById("productModalOverlay").classList.add("is-active");
}

// Show a live preview of the selected image before upload
function handleImagePreview() {
  const fileInput = document.getElementById("productImage");
  const preview = document.getElementById("imagePreview");

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) {
      preview.style.display = "none";
      return;
    }

    // Basic validation: type and size
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please choose a PNG, JPEG, or WebP image.");
      fileInput.value = "";
      preview.style.display = "none";
      return;
    }

    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Image is too large. Please choose one under ${maxSizeMB}MB.`);
      fileInput.value = "";
      preview.style.display = "none";
      return;
    }

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  });
}

// Upload the selected image to Supabase Storage, return the public URL
async function uploadProductImage(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const { data, error } = await supabaseClient.storage
    .from("product-images")
    .upload(fileName, file);

  if (error) {
    console.error("Image upload error:", error);
    throw new Error("Failed to upload image.");
  }

  const { data: urlData } = supabaseClient.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

// Handle form submission — works for both Add and Edit
async function handleProductFormSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("formSubmitBtn");
  const errorEl = document.getElementById("formError");
  errorEl.textContent = "";

  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const size = document.getElementById("productSize").value.trim();
  const category = document.getElementById("productCategory").value;
  const description = document
    .getElementById("productDescription")
    .value.trim();
  const available = document.getElementById("productAvailable").checked;
  const featured = document.getElementById("productFeatured").checked;
  const imageFile = document.getElementById("productImage").files[0];

  if (!name || !price || !size || !category) {
    errorEl.textContent = "Please fill in all required fields.";
    return;
  }

  if (!editingProductId && !imageFile) {
    errorEl.textContent = "Please select a product image.";
    return;
  }

  submitBtn.textContent = editingProductId ? "Saving..." : "Publishing...";
  submitBtn.disabled = true;

  try {
    let imageUrl;

    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
    }

    const productData = {
      name,
      price,
      size,
      category,
      description,
      available,
      featured,
      ...(imageUrl && { image_url: imageUrl }),
    };

    let error;

    if (editingProductId) {
      // UPDATE existing product
      ({ error } = await supabaseClient
        .from("products")
        .update(productData)
        .eq("id", editingProductId));
    } else {
      // INSERT new product
      ({ error } = await supabaseClient.from("products").insert([productData]));
    }

    if (error) throw error;

    closeProductModal();
    adminProducts = await fetchAdminProducts();
    renderDashboardContent();
  } catch (error) {
    console.error("Error saving product:", error);
    errorEl.textContent = "Something went wrong. Please try again.";
  } finally {
    submitBtn.textContent = editingProductId
      ? "Save Changes"
      : "Publish Product";
    submitBtn.disabled = false;
  }
}

// Wire up modal open/close + form submit + image preview
function initProductModal() {
  handleImagePreview();
  document
    .getElementById("modalCloseBtn")
    .addEventListener("click", closeProductModal);
  document
    .getElementById("productModalOverlay")
    .addEventListener("click", (e) => {
      if (e.target.id === "productModalOverlay") closeProductModal(); // click outside to close
    });
  document
    .getElementById("productForm")
    .addEventListener("submit", handleProductFormSubmit);
}

// ============================================
// DELETE / TOGGLE ACTIONS
// ============================================

// Delete a product (with confirmation)
async function handleDeleteProduct(productId) {
  const product = adminProducts.find((p) => p.id === productId);
  if (!product) return;

  const confirmed = confirm(
    `Are you sure you want to delete "${product.name}"? This cannot be undone.`
  );
  if (!confirmed) return;

  // Delete the database row
  const { error: deleteError } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", productId);

  if (deleteError) {
    console.error("Error deleting product:", deleteError);
    alert("Failed to delete product. Please try again.");
    return;
  }

  // Best-effort: also remove the image file from storage
  // (extract filename from the stored URL)
  try {
    const urlParts = product.image_url.split("/product-images/");
    if (urlParts[1]) {
      await supabaseClient.storage.from("product-images").remove([urlParts[1]]);
    }
  } catch (storageError) {
    console.warn("Could not delete image file (non-critical):", storageError);
  }

  adminProducts = await fetchAdminProducts();
  renderDashboardContent();
}

// Toggle available/sold-out
async function handleToggleAvailable(productId, currentValue) {
  const newValue = !currentValue;

  const { error } = await supabaseClient
    .from("products")
    .update({ available: newValue })
    .eq("id", productId);

  if (error) {
    console.error("Error toggling availability:", error);
    alert("Failed to update product. Please try again.");
    return;
  }

  adminProducts = await fetchAdminProducts();
  renderDashboardContent();
}

// Toggle featured/unfeatured
async function handleToggleFeatured(productId, currentValue) {
  const newValue = !currentValue;

  const { error } = await supabaseClient
    .from("products")
    .update({ featured: newValue })
    .eq("id", productId);

  if (error) {
    console.error("Error toggling featured status:", error);
    alert("Failed to update product. Please try again.");
    return;
  }

  adminProducts = await fetchAdminProducts();
  renderDashboardContent();
}
