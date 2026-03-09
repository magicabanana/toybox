const INITIAL_WEALTH = 15000000000000;
let currentWealth = INITIAL_WEALTH;

const items = [
    { name: "빅맥 (Big Mac)", price: 6000, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
    { name: "넷플릭스 1달 (Netflix)", price: 15000, img: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400" },
    { name: "굽네치킨 (Chicken)", price: 20000, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400" },
    { name: "갤럭시 S24 울트라", price: 1700000, img: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400" },
    { name: "롤렉스 시계 (Rolex)", price: 15000000, img: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400" },
    { name: "테슬라 모델 3 (Tesla)", price: 60000000, img: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400" },
    { name: "페라리 (Ferrari)", price: 400000000, img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400" },
    { name: "서울 아파트 (Seoul Apt)", price: 2500000000, img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400" },
    { name: "전용기 타고 미국 왕복", price: 50000000000, img: "private_jet.png", cooldown: 20 },
    { name: "롯데월드타워 1개층", price: 100000000000, img: "lotte_tower.png" },
    { name: "T1 구단 인수", price: 200000000000, img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400" },
    { name: "초호화 요트 (Yacht)", price: 500000000000, img: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400" },
    { name: "모나리자 (Mona Lisa)", price: 1000000000000, img: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=400" },
    { name: "항공모함 (Aircraft Carrier)", price: 15000000000000, img: "aircraft_carrier.png" }
];

const itemInventory = {};
items.forEach(item => { itemInventory[item.name] = 0; });

// 쿨타임 상태: { itemName: cooldownEndTime(ms) }
const itemCooldowns = {};

let unlockedIndex = 0; // Only the first item is unlocked initially

const balanceEl = document.getElementById('balance');
const gridEl = document.getElementById('item-grid');
const receiptContainer = document.getElementById('receipt-container');
const receiptList = document.getElementById('receipt-list');
const receiptTotalValue = document.getElementById('receipt-total-value');
const victoryModal = document.getElementById('victory-modal');

function formatKRW(amount) {
    if (amount < 0) return '₩0 (공짜!)';
    return '₩' + amount.toLocaleString('ko-KR');
}

function updateUI() {
    balanceEl.textContent = formatKRW(currentWealth);

    // Update each item card
    items.forEach((item, index) => {
        const card = document.getElementById(`card-${index}`);
        const buyBtn = document.getElementById(`buy-${item.name}`);

        const count = itemInventory[item.name];

        // Unlock logic: index is unlocked if it's 0 or the previous item has been bought
        if (index <= unlockedIndex) {
            card.classList.remove('locked');
        } else {
            card.classList.add('locked');
        }

        // 쿨타임 확인
        const now = Date.now();
        const cooldownEnd = itemCooldowns[item.name] || 0;
        const onCooldown = item.cooldown && now < cooldownEnd;
        buyBtn.disabled = currentWealth < item.price || onCooldown;

        // 쿨타임 표시 업데이트
        if (item.cooldown) {
            const cooldownEl = document.getElementById(`cooldown-${index}`);
            if (cooldownEl) {
                if (onCooldown) {
                    const remaining = Math.ceil((cooldownEnd - now) / 1000);
                    cooldownEl.textContent = `⏳ ${remaining}초 후 구매 가능`;
                    cooldownEl.style.display = 'block';
                } else {
                    cooldownEl.style.display = 'none';
                }
            }
        }
    });

    updateReceipt();
    checkWinCondition();
}

function updateReceipt() {
    receiptList.innerHTML = '';
    let totalSpent = 0;
    let hasItems = false;

    for (const [name, count] of Object.entries(itemInventory)) {
        if (count > 0) {
            hasItems = true;
            const item = items.find(i => i.name === name);
            const cost = item.price * count;
            totalSpent += cost;

            const li = document.createElement('li');
            li.className = 'receipt-item';
            li.innerHTML = `<span>${name} x${count}</span> <span>${formatKRW(cost)}</span>`;
            receiptList.appendChild(li);
        }
    }

    receiptTotalValue.textContent = formatKRW(totalSpent);
    receiptContainer.style.display = hasItems ? 'block' : 'none';
}

function checkWinCondition() {
    if (currentWealth <= 0) {
        victoryModal.style.display = 'flex';
    }
}

function init() {
    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.id = `card-${index}`;
        card.innerHTML = `
            <img src="${item.img}" alt="${item.name}" class="item-img">
            <h3 class="item-name">${item.name}</h3>
            <p class="item-price">${formatKRW(item.price)}</p>
            <div class="controls">
                <button class="btn btn-buy" id="buy-${item.name}" onclick="buy('${item.name}', ${index})">구매</button>
            </div>
            ${item.cooldown ? `<p id="cooldown-${index}" style="display:none; color:#e74c3c; font-size:0.85em; margin-top:6px;"></p>` : ''}
        `;
        gridEl.appendChild(card);
    });

    updateUI();
}

function showDamage(amount) {
    const damageEl = document.createElement('div');
    damageEl.className = 'damage-text';
    damageEl.textContent = '-' + formatKRW(amount);

    // Get balance bar position
    const balanceRect = balanceEl.getBoundingClientRect();

    // Spawn around the center of the balance bar with random X offset
    const xOffset = (Math.random() - 0.5) * 200; // -100 to 100
    const startX = balanceRect.left + balanceRect.width / 2 + xOffset;
    // Spawn near the bottom edge of the balance bar
    const startY = balanceRect.bottom - 10;

    damageEl.style.left = `${startX}px`;
    damageEl.style.top = `${startY}px`;

    document.body.appendChild(damageEl);

    // Remove element after animation finishes
    setTimeout(() => {
        damageEl.remove();
    }, 1000);
}

window.buy = function (itemName, index) {
    const item = items.find(i => i.name === itemName);
    const now = Date.now();
    const cooldownEnd = itemCooldowns[itemName] || 0;
    const onCooldown = item.cooldown && now < cooldownEnd;

    if (currentWealth >= item.price && !onCooldown) {
        currentWealth -= item.price;
        itemInventory[itemName]++;

        showDamage(item.price);

        // 쿨타임 설정
        if (item.cooldown) {
            itemCooldowns[itemName] = Date.now() + item.cooldown * 1000;
            // 매 초마다 UI 갱신 (쿨타임 카운트다운)
            const ticker = setInterval(() => {
                if (Date.now() >= itemCooldowns[itemName]) {
                    clearInterval(ticker);
                }
                updateUI();
            }, 1000);
        }

        // If we bought this item for the first time, check if we should unlock the next one
        if (index === unlockedIndex && unlockedIndex < items.length - 1) {
            unlockedIndex++;
        }

        updateUI();
    }
};



init();
