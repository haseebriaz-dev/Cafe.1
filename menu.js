const CAFE_WHATSAPP_NUMBER = "923071777429";

// 1. Local Storage se cart data load karna
let cart = JSON.parse(localStorage.getItem('cr_cart')) || [];

/* Hamburger Toggle Functionality */
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const backdrop = document.getElementById('menuBackdrop');
    if (mobileMenu && backdrop) {
        mobileMenu.classList.toggle('open');
        backdrop.classList.toggle('show');
    }
}

function updateCardPrice(dropdown) {
    const card = dropdown.closest('.dish-card');
    const priceDisplay = card.querySelector('.card-price');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    if (priceDisplay && selectedOption) {
        priceDisplay.innerText = "Rs. " + selectedOption.getAttribute('data-price');
    }
}

function addItemToCart(baseName, button) {
    const card = button.closest('.dish-card');
    const dropdown = card.querySelector('.size-select');
    let finalItemName = baseName, finalPrice = 0;

    if (dropdown) {
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        finalPrice = parseInt(selectedOption.getAttribute('data-price'), 10);
        finalItemName = `${baseName} (${selectedOption.value})`;
    } else {
        const priceText = card.querySelector('.card-price').innerText;
        finalPrice = parseInt(priceText.replace(/\D/g, ''), 10);
    }

    let matchedProduct = cart.find(item => item.name === finalItemName);
    if (matchedProduct) {
        matchedProduct.qty++;
    } else {
        cart.push({ name: finalItemName, price: finalPrice, qty: 1 });
    }

    saveCartAndRender();
}

function saveCartAndRender() {
    localStorage.setItem('cr_cart', JSON.stringify(cart));
    renderCartUI();
}

function renderCartUI() {
    const cartItemsList = document.getElementById('cart-items');
    const totalPriceDisplay = document.getElementById('total-price');
    const mobileCartCount = document.getElementById('mobile-cart-count');

    if (!cartItemsList || !totalPriceDisplay) return;

    cartItemsList.innerHTML = "";
    let totalBill = 0;
    let totalItemsCount = 0;

    if (cart.length === 0) {
        cartItemsList.innerHTML = `<li style="color: #888; border: none; text-align: center; padding: 15px 0;">Your cart is empty.</li>`;
        totalPriceDisplay.innerText = "0";
        if (mobileCartCount) mobileCartCount.innerText = "0";
        return;
    }

    cart.forEach((item, index) => {
        let itemCost = item.price * item.qty;
        totalBill += itemCost;
        totalItemsCount += item.qty;

        const li = document.createElement('li');
        li.className = "cart-item-row";
        li.innerHTML = `
            <div class="cart-item-details">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">Rs. ${itemCost}</span>
            </div>
            <div class="cart-item-actions">
                <div class="qty-control">
                    <button class="qty-btn minus" onclick="changeQty(${index}, -1)">−</button>
                    <span class="qty-val">${item.qty}</span>
                    <button class="qty-btn plus" onclick="changeQty(${index}, 1)">+</button>
                </div>
                <button class="cart-del-btn" onclick="removeItemFromCart(${index})" title="Remove Item">🗑️</button>
            </div>
        `;
        cartItemsList.appendChild(li);
    });

    totalPriceDisplay.innerText = totalBill;
    if (mobileCartCount) {
        mobileCartCount.innerText = totalItemsCount;
    }
}

function changeQty(index, delta) {
    if (cart[index]) {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        saveCartAndRender();
    }
}

function removeItemFromCart(index) {
    if (cart[index]) {
        cart.splice(index, 1);
        saveCartAndRender();
    }
}

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyszfYWPhNvf9eJfdF5iAI9SGYo2oRXT3yVPrX1--0uOthc0NbfAHw__Gke7Gh3bT3H/exec";
function sendOrderWhatsApp() {
    if (cart.length === 0) {
        alert("Aapka cart khali hai!");
        return;
    }

    const custNameElem = document.getElementById('cust-name');
    const custLocationElem = document.getElementById('cust-location');
    const payMethodElem = document.getElementById('pay-method');

    if (!custNameElem || !custLocationElem) {
        alert("System Error: Input fields missing!");
        return;
    }

    const customerName = custNameElem.value.trim();
    const customerLocation = custLocationElem.value.trim();
    const paymentMethod = payMethodElem ? payMethodElem.value : "Not Specified";

    if (!customerName || !customerLocation) {
        alert("Naam aur Address likhna lazmi hai!");
        return;
    }

    // === نیا فیچر: آرڈر کنفرمیشن پاپ اپ ===
    // یہ میسج موبائل اور ڈیسک ٹاپ دونوں پر شو ہوگا
    const userConfirmation = confirm("Do you want this order ?\n\nconfirm your order click or press ok۔");
    
    // اگر کسٹمر 'Cancel' پر کلک کرے گا تو یہیں سے فنکشن رک جائے گا
    // نہ گوگل شیٹ میں ڈیٹا جائے گا اور نہ ہی واٹس ایپ اوپن ہوگا
    if (!userConfirmation) {
        return; 
    }
    // ===================================

    let msg = "  NEW ORDER (CR CAFE) FROM SITE \n\n";
    msg += `👤 *Name:* ${customerName}\n📍 *Address:* ${customerLocation}\n💳 *Payment:* ${paymentMethod}\n-------------\n`;

    let total = 0;
    let itemsTextList = [];

    cart.forEach((item, idx) => {
        let cost = item.price * item.qty;
        total += cost;
        msg += `${idx + 1}. *${item.name}* x ${item.qty} = Rs. ${cost}\n`;
        itemsTextList.push(`${item.name} (Qty: ${item.qty})`);
    });
    msg += `-------------\n💰 *Total Payable: Rs. ${total}*\n\nKindly confirm my order!`;

    const orderData = {
        name: customerName,
        location: customerLocation,
        payment: paymentMethod,
        items: itemsTextList.join("\n "),
        total: total
    };

    fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
        .then(() => {
            console.log("Order successfully saved to Google Sheets!");
        })
        .catch((error) => {
            console.error("Error saving to Google Sheets:", error);
        });

    window.open(`https://wa.me/${CAFE_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');

    cart = [];
    localStorage.removeItem('cr_cart');
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-location').value = '';
    renderCartUI();
}

// ==========================================
// DATA RENDERING ENGINE WITH IMAGES
// ==========================================

// Helper to get image path (checks if customized, otherwise gives a placeholder icon)
function getItemImage(imagePath) {
    return imagePath ? imagePath : "images/placeholder.jpg"; // Default placeholder if not specified
}

function appendPizzaCards(targetId, pizzaList) {
    const grid = document.getElementById(targetId);
    if (!grid) return;

    let htmlContent = "";
    pizzaList.forEach(p => {
        let imgUrl = getItemImage(p.img);
        let options = p.s ? `<option value="Small" data-price="${p.s}">Small - Rs. ${p.s}</option>` : '';
        options += `<option value="Medium" data-price="${p.m}">Medium - Rs. ${p.m}</option>
                    <option value="Large" data-price="${p.l}">Large - Rs. ${p.l}</option>`;
        if (p.xl) options += `<option value="Extra Large" data-price="${p.xl}">XL - Rs. ${p.xl}</option>`;

        htmlContent += `
            <div class="dish-card">
                <div class="card-img-container" style="background-image: url('${imgUrl}');"></div>
                <div class="card-body">
                    <h4>${p.name}</h4>
                    <select class="size-select" onchange="updateCardPrice(this)">${options}</select>
                    <p class="card-price">Rs. ${p.s ? p.s : p.m}</p>
                    <button class="add-btn" onclick="addItemToCart('${p.name}', this)">Add 🛒</button>
                </div>
            </div>`;
    });
    grid.innerHTML = htmlContent;
}

function appendStandardItems(targetId, itemsList) {
    const grid = document.getElementById(targetId);
    if (!grid) return;

    let htmlContent = "";
    itemsList.forEach(item => {
        let imgUrl = getItemImage(item.img);
        htmlContent += `
            <div class="dish-card">
                <div class="card-img-container" style="background-image: url('${imgUrl}');"></div>
                <div class="card-body">
                    <h4>${item.name}</h4>
                    <p class="card-price">Rs. ${item.price}</p>
                    <button class="add-btn" onclick="addItemToCart('${item.name}', this)">Add 🛒</button>
                </div>
            </div>`;
    });
    grid.innerHTML = htmlContent;
}

function appendHalfFullItems(targetId, itemsList) {
    const grid = document.getElementById(targetId);
    if (!grid) return;

    let htmlContent = "";
    itemsList.forEach(item => {
        let imgUrl = getItemImage(item.img);
        htmlContent += `
            <div class="dish-card">
                <div class="card-img-container" style="background-image: url('${imgUrl}');"></div>
                <div class="card-body">
                    <h4>${item.name}</h4>
                    <select class="size-select" onchange="updateCardPrice(this)">
                        <option value="Half" data-price="${item.half}">Half - Rs. ${item.half}</option>
                        <option value="Full" data-price="${item.full}">Full - Rs. ${item.full}</option>
                    </select>
                    <p class="card-price">Rs. ${item.half}</p>
                    <button class="add-btn" onclick="addItemToCart('${item.name}', this)">Add 🛒</button>
                </div>
            </div>`;
    });
    grid.innerHTML = htmlContent;
}

function appendCustomDropdownItems(targetId, itemsList) {
    const grid = document.getElementById(targetId);
    if (!grid) return;

    let htmlContent = "";
    itemsList.forEach(item => {
        let imgUrl = getItemImage(item.img);
        htmlContent += `
            <div class="dish-card">
                <div class="card-img-container" style="background-image: url('${imgUrl}');"></div>
                <div class="card-body">
                    <h4>${item.name}</h4>
                    <select class="size-select" onchange="updateCardPrice(this)">
                        <option value="${item.val1}" data-price="${item.price1}">${item.val1} - Rs. ${item.price1}</option>
                        <option value="${item.val2}" data-price="${item.price2}">${item.val2} - Rs. ${item.price2}</option>
                    </select>
                    <p class="card-price">Rs. ${item.price1}</p>
                    <button class="add-btn" onclick="addItemToCart('${item.name}', this)">Add 🛒</button>
                </div>
            </div>`;
    });
    grid.innerHTML = htmlContent;
}

function appendDeals(targetId, dealsList) {
    const grid = document.getElementById(targetId);
    if (!grid) return;

    let htmlContent = "";
    dealsList.forEach(deal => {
        let imgUrl = getItemImage(deal.img);
        htmlContent += `
            <div class="dish-card">
                <div class="card-img-container" style="background-image: url('${imgUrl}');"></div>
                <div class="card-body">
                    <h4>${deal.title}</h4>
                    <p class="deal-details">${deal.details}</p>
                    <p class="card-price">Rs. ${deal.price}</p>
                    <button class="add-btn" onclick="addItemToCart('${deal.title}', this)">Add Deal 🛒</button>
                </div>
            </div>`;
    });
    grid.innerHTML = htmlContent;
}

document.addEventListener("DOMContentLoaded", () => {



    // Sajji Section Data
const sajjiItems = [
    { name: "Full Sajji + Rice", price: 1850, img: "images/full-sajji-rice.jpg" },
    { name: "Half Sajji + Rice", price: 990, img: "images/half-sajji-rice.jpg" },
    { name: "Rice Platter + Kebab (For 3–4 persons)", price: 990, img: "images/rice-kebab-platter.jpg" },
    { name: "Full Sajji (without rice)", price: 1390, img: "images/full-sajji.jpg" },
    { name: "Extra Rice", price: 350, img: "images/extra-rice.jpg" }
];

// Grid rendering
appendStandardItems("sajji-grid", sajjiItems);
    // 1. Premium Pizzas
    const specialPizzas = [
        { name: "Special Pizza Pasta", m: 1550, l: 2200, xl: null, img: "images/pizza-pasta.jpg" },
        { name: "CR-Special Pizza", m: 1500, l: 2050, xl: 2850, img: "images/cr-special-pizza.jpg" },
        { name: "CR-Special Lazania Pizza", m: 1550, l: 2080, xl: 2800, img: "images/lazania-pizza.jpg" },
        { name: "Cheese Lover Pizza", m: 1550, l: 2200, xl: 2850, img: "images/cheese-lover.jpg" },
        { name: "Malai Botti Pizza", m: 1450, l: 1980, xl: 2750, s: 850, img: "images/malai-botti-pizza.jpg" },
        { name: "Chicken Cheese Stick", m: 1550, l: 2300, xl: 2900, s: 950, img: "images/cheese-stick.jpg" },
        { name: "Donor Pizza", m: 1500, l: 2200, xl: 2850, img: "images/donor-pizza.jpg" }
    ];
    appendPizzaCards("special-pizzas-grid", specialPizzas);

    const regularPizzas = [
        { name: "Kabab Bite Pizza", m: 1550, l: 2200, xl: 2900, img: "images/kabab-bite.jpg" },
        { name: "Kabab Crust Pizza", m: 1480, l: 2050, xl: 2800, s: 880, img: "images/kabab-crust.jpg" },
        { name: "Crown Crust Pizza", m: 1480, l: 2050, xl: 2850, s: 880, img: "images/crown-crust.jpg" },
        { name: "Chicken Crust Pizza", m: 1500, l: 2050, xl: 2850, s: 850, img: "images/chicken-crust.jpg" },
        { name: "Chicken & Cheese Crust", m: 1550, l: 2200, xl: 2900, s: 950, img: "images/chicken-cheese-crust.jpg" },
        { name: "Chicken Tikka", m: 1350, l: 1800, xl: 2600, s: 800, img: "images/chicken-tikka.jpg" },
        { name: "Chicken Fajita", m: 1350, l: 1800, xl: 2600, s: 800, img: "images/chicken-Fajita.jpg" },
        { name: "B.B.Q Pizza", m: 1450, l: 1950, xl: 2750, s: 850, img: "images/bbq-pizza.jpg" },
        { name: "Royal Crust Pizza", m: 1500, l: 1990, xl: 2800, s: 900, img: "images/royal-crust.jpg" },
        { name: "Mexican (Four Flavor)", l: 2200, xl: 2950, img: "images/mexican.jpg" },
        { name: "Extra Topping", s: 100, m: 150, l: 200, xl: 250, img: "images/topping.jpg" }
    ];
    appendPizzaCards("regular-pizzas-grid", regularPizzas);

    // 2. Burgers & Shawarma
    const burgersAndShawarma = [
        { name: "CR Special Burger", price: 480, img: "images/cr-burger.jpg" }, { name: "Zinger Burger", price: 340, img: "images/zinger.jpg" },
        { name: "Jumbo Zinger Burger", price: 390, img: "images/jumbo-zinger.jpg" }, { name: "Student Zinger Burger", price: 290, img: "images/student-zinger.jpg" },
        { name: "Zinger Cheese Burger", price: 400, img: "images/zinger-cheese.jpg" }, { name: "Jumbo Zinger Cheese Burger", price: 440, img: "images/jumbo-cheese.jpg" },
        { name: "Tower Burger", price: 550, img: "images/tower-burger.jpg" }, { name: "Pizza Burger", price: 600, img: "images/pizza-burger.jpg" },
        { name: "Petty Burger", price: 310, img: "images/petty-burger.jpg" }, { name: "Add on Cheese Slice", price: 99, img: "images/cheese-slice.jpg" },
        { name: "Chicken Shawarma", price: 300, img: "images/ch-shawarma.jpg" }, { name: "Chicken Cheese Shawarma", price: 400, img: "images/ch-cheese-shawarma.jpg" },
        { name: "Zinger Shawarma", price: 340, img: "images/zinger-shawarma.jpg" }, { name: "Kabab Shawarma", price: 360, img: "images/kabab-shawarma.jpg" },
        { name: "CR-Special Shawarma Platter", price: 700, img: "images/shawarma-platter.jpg" }
    ];
    appendStandardItems("burgers-grid", burgersAndShawarma);

    // 3. Rolls & Wraps
    const rollsAndWraps = [
        { name: "Chicken Pratha Roll", price: 320, img: "images/pratha-roll.jpg" }, { name: "Chicken Cheese Pratha Roll", price: 390, img: "images/cheese-pratha.jpg" },
        { name: "Zinger Pratha Roll", price: 350, img: "images/zinger-pratha.jpg" }, { name: "Zinger Cheese Pratha Roll", price: 400, img: "images/zinger-cheese-pratha.jpg" },
        { name: "Kabab Pratha Roll", price: 460, img: "images/kabab-pratha.jpg" }, { name: "Mix Pratha Platter", price: 700, img: "images/mix-pratha.jpg" },
        { name: "Malai Botti Pratha Roll", price: 500, img: "images/malai-pratha.jpg" }, { name: "Club Sandwich", price: 650, img: "images/club-sandwich.jpg" },
        { name: "Grill Sandwich", price: 730, img: "images/grill-sandwich.jpg" }, { name: "Vegetable Sandwich", price: 600, img: "images/veg-sandwich.jpg" },
        { name: "Chicken Wrap", price: 400, img: "images/chicken-wrap.jpg" }, { name: "Chicken Cheese wrap", price: 470, img: "images/ch-cheese-wrap.jpg" },
        { name: "Zinger Wrap", price: 450, img: "images/zinger-wrap.jpg" }, { name: "Zinger Cheese wrap", price: 520, img: "images/zinger-cheese-wrap.jpg" },
        { name: "Malai Botti Wrap", price: 600, img: "images/malai-wrap.jpg" }, { name: "Fish Wrap", price: 750, img: "images/fish-wrap.jpg" }
    ];
    appendStandardItems("rolls-grid", rollsAndWraps);

    // 4. Starters, Fries & Pasta
    const startersHalfFull = [
        { name: "Hot Wings", half: 350, full: 650, img: "images/hot-wings.jpg" }, { name: "B.B.Q Wings", half: 400, full: 800, img: "images/bbq-wings.jpg" },
        { name: "Oven Baked Wings", half: 400, full: 800, img: "images/baked-wings.jpg" }, { name: "Chicken Nuggets", half: 300, full: 600, img: "images/nuggets.jpg" },
        { name: "Reg. Fries", half: 250, full: 400, img: "images/reg-fries.jpg" }, { name: "Sp. Plain Fries", half: 300, full: 500, img: "images/plain-fries.jpg" }
    ];
    appendHalfFullItems("starters-grid", startersHalfFull);

    const startersStandard = [
        { name: "Loaded Fries", price: 750, img: "images/loaded-fries.jpg" }, { name: "Matka Fries", price: 800, img: "images/matka-fries.jpg" },
        { name: "Dip Sauce", price: 100, img: "images/dip-sauce.jpg" }, { name: "CR Special Pasta", price: 900, img: "images/cr-pasta.jpg" },
        { name: "Crispy Pasta", price: 900, img: "images/crispy-pasta.jpg" }, { name: "Egg Fried Pasta", price: 900, img: "images/egg-pasta.jpg" },
        { name: "Single Pc. Chicken Broast", price: 280, img: "images/broast-1pc.jpg" }, { name: "5 Piece Chicken Broast", price: 1150, img: "images/broast-5pc.jpg" },
        { name: "10 Piece Chicken Broast", price: 2080, img: "images/broast-10pc.jpg" }
    ];
    const starterGrid = document.getElementById("starters-grid");
    if (starterGrid) {
        startersStandard.forEach(item => {
            let imgUrl = getItemImage(item.img);
            starterGrid.innerHTML += `
                <div class="dish-card">
                    <div class="card-img-container" style="background-image: url('${imgUrl}');"></div>
                    <div class="card-body">
                        <h4>${item.name}</h4>
                        <p class="card-price">Rs. ${item.price}</p>
                        <button class="add-btn" onclick="addItemToCart('${item.name}', this)">Add 🛒</button>
                    </div>
                </div>`;
        });
    }

    // 5. Desi Handi (Urdu names aligned)
    const handiHalfFull = [
        { name: "Sp. Chef Kujja (سپیشل شیف کجه)", half: 1050, full: 1950, img: "images/kujja.jpg" },
        { name: "Chicken Handi (چکن ہانڈی)", half: 900, full: 1700, img: "images/ch-handi.jpg" },
        { name: "Chicken Achari Handi (چکن اچاری ہانڈی)", half: 950, full: 1750, img: "images/achari-handi.jpg" },
        { name: "Chicken White Handi (چکن وائٹ ہانڈی)", half: 950, full: 1750, img: "images/white-handi.jpg" },
        { name: "Chicken Makhni Handi (چکن مکھنی ہانڈی)", half: 950, full: 1750, img: "images/makhni-handi.jpg" },
        { name: "Mughlai Handi (مغلیہ ہانڈی)", half: 950, full: 1750, img: "images/mughlai-handi.jpg" },
        { name: "Hyderabadi Handi", half: 950, full: 1750, img: "images/hyderabadi.jpg" }
    ];
    appendHalfFullItems("handi-grid", handiHalfFull);

    const handiStandard = [
        { name: "Chicken Jalfrezi Handi", price: 1400, img: "images/jalfrezi.jpg" }, { name: "Chicken Green Chilli Lemon", price: 1300, img: "images/green-chili-lemon.jpg" },
        { name: "Nawabi Chicken Masala", price: 1300, img: "images/nawabi-ch.jpg" }, { name: "Kabab Masala", price: 1300, img: "images/kabab-masala.jpg" },
        { name: "Chicken Ginger Handi", price: 1300, img: "images/ch-ginger.jpg" }, { name: "Chicken Hari Mirch Handi", price: 1300, img: "images/hari-mirch.jpg" },
        { name: "Special Shahi Daal", price: 590, img: "images/shahi-daal.jpg" }, { name: "Daal Makhni", price: 550, img: "images/daal-makhni.jpg" },
        { name: "Daal Mash", price: 490, img: "images/daal-mash.jpg" }, { name: "Mix Vegetable", price: 490, img: "images/mix-veg.jpg" }
    ];
    const handiGrid = document.getElementById("handi-grid");
    if (handiGrid) {
        handiStandard.forEach(item => {
            let imgUrl = getItemImage(item.img);
            handiGrid.innerHTML += `
                <div class="dish-card">
                    <div class="card-img-container" style="background-image: url('${imgUrl}');"></div>
                    <div class="card-body">
                        <h4>${item.name}</h4>
                        <p class="card-price">Rs. ${item.price}</p>
                        <button class="add-btn" onclick="addItemToCart('${item.name}', this)">Add 🛒</button>
                    </div>
                </div>`;
        });
    }

    // 6. Karahi Bar
    const karahiItems = [
        { name: "Chicken Special Karahi", half: 1000, full: 2000, img: "images/sp-karahi.jpg" }, { name: "Chicken Karahi", half: 950, full: 1850, img: "images/karahi.jpg" },
        { name: "Chicken Achari Karahi", half: 900, full: 1800, img: "images/achari-karahi.jpg" }, { name: "Chicken White Karahi", half: 950, full: 1900, img: "images/white-karahi.jpg" },
        { name: "Chicken Shinwari Karahi", half: 950, full: 1900, img: "images/shinwari-karahi.jpg" }, { name: "Chicken Tikka Karahi", half: 900, full: 1800, img: "images/tikka-karahi.jpg" },
        { name: "Special Mutton Karahi", half: 2150, full: 4050, img: "images/sp-mutton.jpg" }, { name: "Mutton Karahi", half: 2050, full: 3900, img: "images/mutton-karahi.jpg" },
        { name: "Mutton Achari Karahi", half: 1950, full: 3850, img: "images/mutton-achari.jpg" }, { name: "Mutton White Karahi", half: 1950, full: 3850, img: "images/mutton-white.jpg" },
        { name: "Mutton Nawabi Karahi", half: 2050, full: 3950, img: "images/mutton-nawabi.jpg" }, { name: "Mutton Shinwari Karahi", half: 2050, full: 3950, img: "images/mutton-shinwari.jpg" },
        { name: "Special Beef Karahi", half: 1450, full: 2450, img: "images/sp-beef.jpg" }, { name: "Beef Karahi", half: 1350, full: 2350, img: "images/beef-karahi.jpg" },
        { name: "Beef Achari Karahi", half: 1350, full: 2350, img: "images/beef-achari.jpg" }, { name: "Beef White Karahi", half: 1350, full: 2350, img: "images/beef-white.jpg" },
        { name: "Beef Shinwari Karahi", half: 1350, full: 2350, img: "images/beef-shinwari.jpg" }
    ];
    appendHalfFullItems("karahi-grid", karahiItems);

    // 7. BBQ & Tandoor (Platter added, Naan and Roti corrected)
    const bbqHalfFull = [
        { name: "Malai Boti (4pc/8pc)", half: 420, full: 790, img: "images/malai-boti.jpg" }, { name: "Tikka Boti (4pc/8pc)", half: 360, full: 680, img: "images/tikka-boti.jpg" },
        { name: "Qalmi Tikka (3pc/6pc)", half: 580, full: 1050, img: "images/qalmi.jpg" }, { name: "Green Boti (4pc/8pc)", half: 420, full: 790, img: "images/green-boti.jpg" },
        { name: "Reshmi Kabab (2pc/4pc)", half: 500, full: 950, img: "images/reshmi-kabab.jpg" }, { name: "Chicken Kabab (2pc/4pc)", half: 450, full: 830, img: "images/ch-kabab.jpg" },
        { name: "Fried Chicken", half: 800, full: 1550, img: "images/fried-ch.jpg" }, { name: "Grill Fish", half: 900, full: 1690, img: "images/grill-fish.jpg" }
    ];
    appendHalfFullItems("bbq-grid", bbqHalfFull);

    const bbqCustom = [
        { name: "Chicken Tikka Piece", val1: "Leg", price1: 450, val2: "Chest", price2: 500, img: "images/tikka-pc.jpg" },
        { name: "Malai Tikka Piece", val1: "Leg", price1: 550, val2: "Chest", price2: 500, img: "images/malai-tikka-pc.jpg" }
        , { name: "Tikka Boti", val1: "4pc", price1: 360, val2: "8pc", price2: 680, img: "images/tikka-boti.jpg" },
        { name: "Malai Boti", val1: "4pc", price1: 420, val2: "8pc", price2: 790, img: "images/malai-boti.jpg" },
        , { name: "Qalmi Tikka", val1: "3pc", price1: 580, val2: "8pc", price2: 1050, img: "images/qalmi-tikka.jpg" }
        , { name: "Green Boti", val1: "4pc", price1: 420, val2: "8pc", price2: 790, img: "images/green-boti.jpg" }
        , { name: "Reshmi Khabab", val1: "2pc", price1: 500, val2: "4pc", price2: 950, img: "images/reshmi-khabab.jpg" }
        , { name: "Chicken Khabab", val1: "2pc", price1: 450, val2: "4p", price2: 830, img: "images/ch-khahab.jpg" }

    ];
    appendCustomDropdownItems("bbq-grid", bbqCustom);
    const bbqStandard = [
        { name: "Chapli Kabab", price: 490, img: "images/chapli.jpg" },
        { name: "Gola Kabab (1 Plate)", price: 700, img: "images/gola-kabab.jpg" },
        { name: "Cheese Naan", price: 500, img: "images/cheese-naan.jpg" }, { name: "Chicken Cheese Naan", price: 700, img: "images/ch-cheese-naan.jpg" },
        { name: "Qeema Naan", price: 400, img: "images/qeema-naan.jpg" }, { name: "Tandoori Naan Paratha", price: 150, img: "images/naan-paratha.jpg" },
        { name: "Garlic Naan", price: 100, img: "images/garlic-naan.jpg" }, { name: "Kalvanji Naan", price: 100, img: "images/kalvanji-naan.jpg" },
        { name: "Roghni Naan", price: 80, img: "images/roghni-naan.jpg" }, { name: "Khamiri Roti", price: 70, img: "images/khamiri-roti.jpg" },
        { name: "Sada Roti / Head", price: 70, img: "images/sada-roti.jpg" }, { name: "Sada Naan", price: 70, img: "images/sada-naan.jpg" },
        // Platter 1 and 2 details added from menu scans
        { name: "Bar-B-Q Platter 1 (Chicken Biryani Full, 2 Seekh Kabab, Fried Rice Full, 1 Tikka Leg, 1 Ltr Drink, 1 Raita, 5 Rotti)", price: 1980, img: "images/platter1.jpg" },
        { name: "Bar-B-Q Platter 2 (Chicken Karhahi Half, Gola Kabab Plate, Malai Boti Plate, Kahmeeri Roti 10, 2 Raita, 1.5 Ltr Drink)", price: 4100, img: "images/platter2.jpg" }
    ];
    const bbqGrid = document.getElementById("bbq-grid");
    if (bbqGrid) {
        bbqStandard.forEach(item => {
            let imgUrl = getItemImage(item.img);
            bbqGrid.innerHTML += `
                <div class="dish-card">
                    <div class="card-img-container" style="background-image: url('${imgUrl}');"></div>
                    <div class="card-body">
                        <h4>${item.name}</h4>
                        <p class="card-price">Rs. ${item.price}</p>
                        <button class="add-btn" onclick="addItemToCart('${item.name}', this)">Add 🛒</button>
                    </div>
                </div>`;
        });
    }

    // 8. Chinese, Rice & Salad Bar (Raita Mint & Zeera, Soups added)
    const chineseStandard = [
        { name: "Russian Salad", price: 490, img: "images/russian-salad.jpg" }, { name: "Kachumar Salad", price: 200, img: "images/kachumar.jpg" },
        { name: "Fresh Salad", price: 120, img: "images/fresh-salad.jpg" }, { name: "Chicken Chow mein", price: 850, img: "images/ch-chowmein.jpg" },
        { name: "Vegetable Chow mein", price: 800, img: "images/veg-chowmein.jpg" }, { name: "Chicken Kabab Rice", price: 500, img: "images/kabab-rice.jpg" },
        { name: "Chicken Manchurian", price: 750, img: "images/manchurian.jpg" }, { name: "Chicken Shashlik", price: 750, img: "images/shashlik.jpg" },
        { name: "Chicken Chilli Dry", price: 850, img: "images/chilli-dry.jpg" }, { name: "Chicken Dhaka", price: 850, img: "images/dhaka-ch.jpg" },
        { name: "Chicken With Almond", price: 850, img: "images/ch-almond.jpg" }, { name: "Chicken Manchurian with Rice", price: 1000, img: "images/manchurian-rice.jpg" },
        { name: "Shashlik with Rice", price: 1000, img: "images/shashlik-rice.jpg" },
        { name: "Raita Mint", price: 100, img: "images/raita-mint.jpg" }, { name: "Raita Zeera", price: 100, img: "images/raita-zeera.jpg" }
    ];
    appendStandardItems("chinese-grid", chineseStandard);

    const chineseHalfFull = [
        { name: "Chicken Biryani", half: 450, full: 800, img: "images/biryani.jpg" }, { name: "Egg Fried Rice", half: 450, full: 900, img: "images/egg-rice.jpg" },
        { name: "Chicken Fried Rice", half: 450, full: 850, img: "images/ch-rice.jpg" }, { name: "Masala Rice", half: 400, full: 800, img: "images/masala-rice.jpg" },
        { name: "Jungli Pulao", half: 500, full: 1000, img: "images/jungli-pulao.jpg" }, { name: "Sp. Fried Rice", half: 500, full: 900, img: "images/sp-rice.jpg" },
        // Soups
        { name: "Special Soup", half: 650, full: 1050, img: "images/sp-soup.jpg" }, { name: "Hot & Sour Soup", half: 550, full: 950, img: "images/hot-sour-soup.jpg" },
        { name: "Chicken Corn Soup", half: 550, full: 950, img: "images/ch-corn-soup.jpg" }, { name: "Vegetable Soup", half: 500, full: 900, img: "images/veg-soup.jpg" },
        { name: "Fish Cracker", half: 300, full: 600, img: "images/fish-cracker.jpg" }
    ];
    const chineseGrid = document.getElementById("chinese-grid");
    if (chineseGrid) {
        chineseHalfFull.forEach(item => {
            let imgUrl = getItemImage(item.img);
            chineseGrid.innerHTML += `
                <div class="dish-card">
                    <div class="card-img-container" style="background-image: url('${imgUrl}');"></div>
                    <div class="card-body">
                        <h4>${item.name}</h4>
                        <select class="size-select" onchange="updateCardPrice(this)">
                            <option value="Half" data-price="${item.half}">Half - Rs. ${item.half}</option>
                            <option value="Full" data-price="${item.full}">Full - Rs. ${item.full}</option>
                        </select>
                        <p class="card-price">Rs. ${item.half}</p>
                        <button class="add-btn" onclick="addItemToCart('${item.name}', this)">Add 🛒</button>
                    </div>
                </div>`;
        });
    }

    // 9. Drinks, Shakes & Ice Creams (Ice creams added)
    const drinksStandard = [
        { name: "Mint Margrita", price: 220, img: "images/mint-margrita.jpg" }, { name: "Blue Berry Margrita", price: 280, img: "images/blueberry.jpg" },
        { name: "Orange Margrita", price: 220, img: "images/orange-margrita.jpg" }, { name: "Cold Coffee", price: 450, img: "images/cold-coffee.jpg" },
        { name: "CR Special Shake", price: 590, img: "images/cr-shake.jpg" },
        { name: "Oreo Shake", price: 500, img: "images/oreo-shake.jpg" },
        { name: "Kit Kat Shake", price: 530, img: "images/kitkat-shake.jpg" }, { name: "Pena Colada", price: 450, img: "images/pena-colada.jpg" },
        { name: "Pink Lady", price: 450, img: "images/pink-lady.jpg" }, { name: "Fresh Lime", price: 150, img: "images/fresh-lime.jpg" },
        { name: "Special Chai", price: 140, img: "images/sp-chai.jpg" }, { name: "Regular Chai", price: 120, img: "images/reg-chai.jpg" },
        { name: "Qehwa / Green Tea", price: 100, img: "images/qehwa.jpg" }, { name: "Mineral Water (Large)", price: 120, img: "images/mineral-l.jpg" },
        { name: "Mineral Water (Small)", price: 70, img: "images/mineral-s.jpg" }, { name: "Cold Drink (1 Litre)", price: 170, img: "images/cold-drink-1l.jpg" },
        { name: "Cold Drink (1.5 Litre)", price: 220, img: "images/cold-drink-1-5l.jpg" }, { name: "Tin Pack Soda", price: 120, img: "images/tin-pack.jpg" },
        // Ice cream segment added from menu
        { name: "CR Special Ice Cream", price: 600, img: "images/special-ice-cream.jpg" },
        { name: "Crunch & Fruit Ice Cream", price: 500, img: "images/crunch-fruit.jpg" },
        { name: "Plain Ice Cream (2 Scoop - Mango/Strawberry/Kulfa/Chocolate/Vanilla)", price: 340, img: "images/plain-ice-cream.jpg" }
    ];
    appendStandardItems("drinks-grid", drinksStandard);

    const drinksHalfFull = [
        { name: "Mango Shake", half: 350, full: 600, img: "images/mango-shake.jpg" }
    ];
    const drinksGrid = document.getElementById("drinks-grid");
    if (drinksGrid) {
        drinksHalfFull.forEach(item => {
            let imgUrl = getItemImage(item.img);
            drinksGrid.innerHTML += `
                <div class="dish-card">
                    <div class="card-img-container" style="background-image: url('${imgUrl}');"></div>
                    <div class="card-body">
                        <h4>${item.name}</h4>
                        <select class="size-select" onchange="updateCardPrice(this)">
                            <option value="Half" data-price="${item.half}">Half - Rs. ${item.half}</option>
                            <option value="Full" data-price="${item.full}">Full - Rs. ${item.full}</option>
                        </select>
                        <p class="card-price">Rs. ${item.half}</p>
                        <button class="add-btn" onclick="addItemToCart('${item.name}', this)">Add 🛒</button>
                    </div>
                </div>`;
        });
    }

    // 10. Special Deals
    const specialDeals = [
        { title: "Deal #1", details: "1 Zinger Burger + 1 Reg. Fries + 1 Reg. Drink", price: 630, img: "images/deal1.jpg" },
        { title: "Deal #2", details: "1 Tower Burger + 1 Reg. Drink", price: 600, img: "images/deal2.jpg" },
        { title: "Deal #3", details: "2 Zinger Burger + 1 Half Ltr Drink", price: 770, img: "images/deal3.jpg" },
        { title: "Deal #4", details: "Chicken Karhahi (250g) + Rotti + Reg. Drink", price: 840, img: "images/deal4.jpg" },
        { title: "Deal #5", details: "3 Zinger Shawarma + 1 Ltr Drink", price: 1130, img: "images/deal5.jpg" },
        { title: "Deal #6", details: "1 Small Pizza Fajita Tikka + 3 pc Nuggets + 3 pc Hot Wings + 1 Half Ltr Drink", price: 1250, img: "images/deal6.jpg" },
        { title: "Deal #7", details: "Mutton Karhahi (250g) + Rotti + Reg. Drink", price: 1490, img: "images/deal7.jpg" },
        { title: "Deal #8", details: "5 pc Chicken Broast + 1 Ltr Drink", price: 1280, img: "images/deal8.jpg" },
        { title: "Deal #9", details: "1 Small Pizza Fajita Tikka + 2 Pc chicken Broast + 2 Pc Dinner Roll + 1 Ltr Drink", price: 1480, img: "images/deal9.jpg" },
        { title: "Deal #10", details: "2 Small Pizza (1 Reg, 1 Sp.) + 1 Ltr Drink", price: 1700, img: "images/deal10.jpg" },
        { title: "Deal #11", details: "2 Medium Pizza (1 Reg, 1 Sp.) + 1 1.5 Ltr Drink", price: 2930, img: "images/deal11.jpg" },
        { title: "Deal #12", details: "2 Large Pizza (1 Reg, 1 Sp.) + 1 1.5 Ltr Drink", price: 3900, img: "images/deal12.jpg" },
        { title: "Deal #13", details: "5 Zinger Burger + 1.5 Ltr Drink", price: 1850, img: "images/deal13.jpg" },
        { title: "Deal #14", details: "8 Zinger Burger + 1 1.5 Ltr Drink", price: 2840, img: "images/deal14.jpg" },
        { title: "Deal #15", details: "1 Sp. Lazania Pizza (L) + 3 Zinger Burger + 1 1.5 Ltr Drink", price: 3380, img: "images/deal15.jpg" }
    ];
    appendDeals("deals-grid", specialDeals);

    renderCartUI();
});