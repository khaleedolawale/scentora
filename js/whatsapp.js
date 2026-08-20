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
