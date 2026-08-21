// ============================================
// WHATSAPP CHECKOUT — builds order message & opens WhatsApp
// ============================================

// Build the order message text from cart contents
function buildOrderMessage() {
  const cart = getCart();

  let message = `Hello, I'd like to place an order:\n\n`;

  cart.forEach((item) => {
    const lineTotal = item.price * item.quantity;
    message += `${item.name} × ${item.quantity} — ${
      CONFIG.currency
    }${lineTotal.toLocaleString()}\n`;
  });

  const total = getCartTotal();
  message += `\nTotal: ${CONFIG.currency}${total.toLocaleString()}\n\n`;
  message += `Please confirm if these products are still available.\n\nThank you.`;

  return message;
}

// Generate the full WhatsApp URL
function buildWhatsAppUrl() {
  const message = buildOrderMessage();
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;
}

// Handle the "Order Now" button click
function handleOrderNow() {
  const cart = getCart();

  if (cart.length === 0) {
    alert("Your cart is empty. Add some fragrances before ordering!");
    return;
  }

  const whatsappUrl = buildWhatsAppUrl();
  window.open(whatsappUrl, "_blank");
}

// ============================================
// CONTACT FORM — builds a WhatsApp inquiry message
// ============================================

function buildInquiryMessage(name, phone, userMessage) {
  let message = `Hello, my name is ${name}.\n\n`;
  message += `${userMessage}\n\n`;
  if (phone) {
    message += `You can reach me on WhatsApp at: ${phone}\n\n`;
  }
  message += `Thank you.`;
  return message;
}

function handleContactFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("contactName").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const userMessage = document.getElementById("contactMessage").value.trim();

  const errorEl = document.getElementById("contactFormError");

  if (!name || !userMessage) {
    errorEl.textContent =
      "Please enter your name and a message before sending.";
    return;
  }

  errorEl.textContent = "";

  const message = buildInquiryMessage(name, phone, userMessage);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;

  window.open(whatsappUrl, "_blank");
  document.getElementById("contactForm").reset();
}

// Direct "Chat on WhatsApp" button — generic opener, no form needed
function handleDirectWhatsAppClick(e) {
  e.preventDefault();
  const message = `Hello, I have a question about Scentora fragrances.`;
  const encodedMessage = encodeURIComponent(message);
  window.open(
    `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`,
    "_blank"
  );
}

// Wire both up
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("contactForm")
    ?.addEventListener("submit", handleContactFormSubmit);
  document
    .getElementById("whatsappContact")
    ?.addEventListener("click", handleDirectWhatsAppClick);
});
