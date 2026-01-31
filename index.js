// ============================================
// КОНСТАНТИ ТА НАЛАШТУВАННЯ
// ============================================

const CONFIG = {
    TICKET_DURATION: 60 * 60, // 60 хвилин у секундах
    TICKET_PRICE: 12.00,
    STORAGE_KEY: 'transport_tickets',
    SESSION_KEY: 'new_ticket_data',
    STORAGE_ENABLED_KEY: 'storage_enabled',
    STATISTICS_KEY: 'transport_statistics',
    CACHE_KEY: 'transport_cache',
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 години в мілісекундах
    FULLSCREEN_KEY: 'fullscreen_enabled',
    DBLCLICK_FULLSCREEN_KEY: 'dblclick_fullscreen_enabled',
    ALWAYS_FULLSCREEN_KEY: 'always_fullscreen_enabled',
    OFFLINE_MODE_KEY: 'offline_mode_enabled',
    QR_SCAN_SCALE: 0.5, // 50% від оригінального розміру для швидшого сканування
    FULLSCREEN_RESTORE_DELAY: 100, // мс для відновлення fullscreen
    FULLSCREEN_AUTO_RESTORE_DELAY: 500, // мс для авто-відновлення fullscreen
    NOTIFICATION_DURATION: 3000, // мс для показу повідомлення
    NOTIFICATION_ANIMATION_DURATION: 300, // мс для анімації повідомлення
    NOTIFICATION_COLORS: {
        success: '#5dc12d',
        warning: '#ffa726',
        error: '#ff4444',
        info: '#3a3a3a'
    }
};

// ============================================
// ДОПОМІЖНІ ФУНКЦІЇ - ДАТА ТА ЧАС
// ============================================

/**
 * Отримати поточну дату та час у ISO форматі
 */
function getCurrentDateTime() {
    return new Date().toISOString();
}

/**
 * Форматувати дату у форматі DD.MM.YYYY
 */
function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Форматувати час у форматі HH:MM:SS
 */
function formatTime(isoString) {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Розрахувати скільки секунд пройшло від початкового часу
 */
function calculateElapsedTime(startTimeISO) {
    const startTime = new Date(startTimeISO);
    const currentTime = new Date();
    const elapsedMs = currentTime - startTime;
    return Math.floor(elapsedMs / 1000);
}

/**
 * Форматувати таймер у форматі MM:SS
 */
function formatTimer(seconds) {
    if (seconds < 0) seconds = 0;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(secs).padStart(2, '0');
    return `${minStr}:${secStr}`;
}

// ============================================
// ДОПОМІЖНІ ФУНКЦІЇ - ГЕНЕРАЦІЯ ДАНИХ
// ============================================

/**
 * Згенерувати унікальний серійний номер (9 цифр)
 */
function generateSerialNumber() {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
}

/**
 * Згенерувати масив серійних номерів залежно від кількості пасажирів
 */
function generateSerialNumbers(count) {
    const serials = [];
    for (let i = 0; i < count; i++) {
        serials.push(generateSerialNumber());
    }
    return serials;
}

/**
 * Форматувати серійні номери з переносом після кожних 2 номерів
 */
function formatSerialNumbers(serialsArray) {
    const parts = [];
    for (let i = 0; i < serialsArray.length; i += 2) {
        const pair = serialsArray.slice(i, i + 2);
        parts.push(pair.join(', '));
    }
    return parts.join(',<br>');
}

/**
 * Згенерувати рандомний баланс від 0.01 до 5000
 */
function generateRandomBalance() {
    const balance = Math.random() * 5000;
    return balance.toFixed(2);
}

/**
 * Згенерувати останні 4 цифри номера картки
 */
function generateCardLast4() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Згенерувати код IBAN (останні 4 цифри)
 */
function generateIbanLast4() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Згенерувати унікальний ID для квитка
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================
// РОБОТА З LOCALSTORAGE
// ============================================

/**
 * Завантажити всі квитки з LocalStorage
 */
function loadTickets() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        const tickets = data ? JSON.parse(data) : [];
        
        // Міграція старих квитків до нового формату
        const migratedTickets = tickets.map(ticket => {
            if (!ticket.serialNumbers && ticket.serialNumber) {
                // Старий формат - конвертуємо в новий
                return {
                    ...ticket,
                    serialNumbers: [ticket.serialNumber],
                    passengers: ticket.passengers || 1
                };
            }
            return ticket;
        });
        
        // Якщо були міграції - зберегти оновлені дані
        if (JSON.stringify(tickets) !== JSON.stringify(migratedTickets)) {
            saveTickets(migratedTickets);
            return migratedTickets;
        }
        
        return tickets;
    } catch (error) {
        console.error('Помилка завантаження квитків:', error);
        return [];
    }
}

/**
 * Зберегти всі квитки в LocalStorage
 */
function saveTickets(tickets) {
    try {
        // Перевірити чи увімкнене локальне збереження
        if (!isStorageEnabled()) {
            console.log('Локальне збереження вимкнено');
            return false;
        }
        
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(tickets));
        return true;
    } catch (error) {
        console.error('Помилка збереження квитків:', error);
        return false;
    }
}

/**
 * Додати новий квиток
 */
function addTicket(ticketData) {
    const tickets = loadTickets();
    const serialNumbers = generateSerialNumbers(ticketData.passengers);
    
    const newTicket = {
        id: generateUniqueId(),
        serialNumbers: serialNumbers, // Масив серійних номерів
        transportNumber: ticketData.transportNumber,
        passengers: ticketData.passengers,
        purchaseTime: getCurrentDateTime(),
        duration: CONFIG.TICKET_DURATION,
        isExpired: false
    };
    tickets.unshift(newTicket); // Додаємо на початок масиву
    saveTickets(tickets);
    
    // Також зберігаємо статистику окремо (для можливості залишити її після очищення)
    updateStatisticsStorage(newTicket);
    
    return newTicket;
}

/**
 * Оновити статус квитка (expired)
 */
function updateTicketStatus(ticketId, isExpired) {
    const tickets = loadTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.isExpired = isExpired;
        saveTickets(tickets);
    }
}

// ============================================
// ПЕРЕВІРКА СТАНУ КВИТКА
// ============================================

/**
 * Отримати залишковий час для квитка (в секундах)
 */
function getRemainingTime(ticket) {
    const elapsed = calculateElapsedTime(ticket.purchaseTime);
    const remaining = ticket.duration - elapsed;
    return remaining > 0 ? remaining : 0;
}

/**
 * Перевірити чи прострочений квиток
 */
function isTicketExpired(ticket) {
    return getRemainingTime(ticket) <= 0;
}

// ============================================
// ГЕНЕРАЦІЯ HTML КАРТКИ КВИТКА
// ============================================

/**
 * Створити HTML картку квитка
 */
function createTicketCard(ticket) {
    const isExpired = isTicketExpired(ticket);
    const expiredClass = isExpired ? 'expired' : '';
    const remainingTime = getRemainingTime(ticket);
    
    // Форматуємо серійні номери з перевіркою на старі квитки
    let serialNumbersFormatted;
    if (ticket.serialNumbers && Array.isArray(ticket.serialNumbers)) {
        // Новий формат - масив серійних номерів
        serialNumbersFormatted = formatSerialNumbers(ticket.serialNumbers);
    } else if (ticket.serialNumber) {
        // Старий формат - один серійний номер
        serialNumbersFormatted = ticket.serialNumber;
    } else {
        // Якщо немає серійних номерів взагалі
        serialNumbersFormatted = generateSerialNumber();
    }
    
    // Таймер тільки для активних квитків
    const timerHTML = !isExpired ? `
        <div class="timer" data-ticket-id="${ticket.id}" data-remaining="${remainingTime}">
            ${formatTimer(remainingTime)}
        </div>
    ` : '';

    return `
        <div class="card ${expiredClass}" data-ticket-id="${ticket.id}">
            <div class="card-header">
                <div class="logo-box">
                    <img src="https://i.ibb.co/9m9Gx8wS/Picsart-26-01-29-01-00-20-922.jpg" alt="Logo">
                </div>
                <div class="card-info">
                    <div class="city-name">Вінниця</div>
                    <div class="company-name">КП Вінницька транспортна<br>компанія</div>
                    <div class="serial-block">
                        <span class="serial-label">Серія</span>
                        <span class="serial-value">${serialNumbersFormatted}</span>
                    </div>
                </div>
                <div class="info-icon" onclick="openModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="11" stroke="#3b9dfc" stroke-width="2"/>
                        <path d="M12 11V17" stroke="#3b9dfc" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="12" cy="7" r="1.5" fill="#3b9dfc"/>
                    </svg>
                </div>
            </div>

            <div class="main-visual">
                <img src="https://i.ibb.co/9mn9jMK6/Picsart-26-01-29-00-59-56-789.jpg" alt="Ticket Visual">
            </div>

            <div class="transport-number">№${ticket.transportNumber}</div>
            <div class="transport-type">Вагон</div>

            <div class="data-grid">
                <div class="data-item">
                    <div class="data-label">Дата</div>
                    <div class="data-value">${formatDate(ticket.purchaseTime)}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Час</div>
                    <div class="data-value">${formatTime(ticket.purchaseTime)}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Пасажири</div>
                    <div class="data-value">${ticket.passengers}</div>
                </div>
            </div>

            <div class="status-text">Квиток разового використання</div>
            
            ${timerHTML}
        </div>
    `;
}

// ============================================
// РОБОТА З ТАЙМЕРАМИ
// ============================================

let timerIntervals = [];

/**
 * Запустити таймер для квитка
 */
function startTimer(ticketId, timerElement, initialSeconds) {
    let remainingSeconds = initialSeconds;

    const interval = setInterval(() => {
        remainingSeconds--;

        if (remainingSeconds <= 0) {
            // Час вийшов
            clearInterval(interval);
            timerElement.textContent = '00:00';
            
            // Додати клас expired до картки
            const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
            if (card) {
                card.classList.add('expired');
            }
            
            // Оновити статус у LocalStorage
            updateTicketStatus(ticketId, true);
            
            // Видалити таймер
            timerElement.remove();
        } else {
            timerElement.textContent = formatTimer(remainingSeconds);
        }
    }, 1000);

    timerIntervals.push(interval);
}

/**
 * Зупинити всі таймери
 */
function stopAllTimers() {
    timerIntervals.forEach(interval => clearInterval(interval));
    timerIntervals = [];
}

/**
 * Ініціалізувати всі таймери на сторінці
 */
function initializeTimers() {
    try {
        stopAllTimers();
        
        const timerElements = document.querySelectorAll('.timer[data-ticket-id]');
        timerElements.forEach(timerEl => {
            const ticketId = timerEl.dataset.ticketId;
            const remaining = parseInt(timerEl.dataset.remaining);
            
            if (remaining > 0) {
                startTimer(ticketId, timerEl, remaining);
            }
        });
    } catch (error) {
        console.error('Помилка ініціалізації таймерів:', error);
    }
}

// ============================================
// ВІДОБРАЖЕННЯ КВИТКІВ НА СТОРІНЦІ
// ============================================

/**
 * Відобразити квитки на головній сторінці (index.html)
 */
function displayTicketsOnIndexPage() {
    try {
        const tickets = loadTickets();
        
        // Знайти контейнер перед футером
        const footerBtn = document.querySelector('.footer-btn-container');
        if (!footerBtn) return;
        
        // Видалити всі існуючі картки (крім статичних прострочених)
        const existingCards = document.querySelectorAll('.card[data-ticket-id]');
        existingCards.forEach(card => card.remove());
        
        // Відобразити всі квитки
        tickets.forEach(ticket => {
            const cardHTML = createTicketCard(ticket);
            footerBtn.insertAdjacentHTML('beforebegin', cardHTML);
        });
        
        // Ініціалізувати таймери
        initializeTimers();
    } catch (error) {
        console.error('Помилка відображення квитків:', error);
    }
}

// ============================================
// QR СТОРІНКА (qr.html)
// ============================================

// QR Camera state
let qrCameraState = {
    currentFacingMode: 'environment',
    currentDeviceId: null,
    scanningActive: false
};

/**
 * Start the camera for QR scanning
 */
async function startQRCamera() {
    const videoElement = document.getElementById('camera-stream');
    const fallbackElement = document.getElementById('camera-fallback');
    
    if (!videoElement || !fallbackElement) return;
    
    // Перевірка підтримки камери
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported');
        showQRCameraFallback();
        return;
    }
    
    try {
        // Спочатку запитуємо дозвіл (якщо API доступний)
        // Note: Permissions API для 'camera' не підтримується у всіх браузерах
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const permissions = await navigator.permissions.query({ name: 'camera' });
                
                if (permissions.state === 'denied') {
                    alert('Для сканування QR-коду потрібен доступ до камери. Будь ласка, надайте дозвіл в налаштуваннях.');
                    showQRCameraFallback();
                    return;
                }
            } catch (permErr) {
                // Деякі браузери не підтримують query для camera
                console.log('Permission query not supported:', permErr);
            }
        }
        
        const savedDeviceId = localStorage.getItem('selected_camera_id');
        
        // Оптимізовані налаштування для швидкого сканування
        const constraints = {
            video: {
                facingMode: qrCameraState.currentFacingMode,
                width: { ideal: 1920 },      // Зменшено з 4096
                height: { ideal: 1080 },     // Зменшено з 2160
                aspectRatio: { ideal: 16/9 },
                frameRate: { ideal: 30 }     // Стабільний framerate для сканування
            }
        };
        
        if (savedDeviceId && !qrCameraState.currentDeviceId) {
            constraints.video.deviceId = { exact: savedDeviceId };
            delete constraints.video.facingMode;
        } else if (qrCameraState.currentDeviceId) {
            constraints.video.deviceId = { exact: qrCameraState.currentDeviceId };
            delete constraints.video.facingMode;
        }
        
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            console.log("Висока якість не підтримується, пробуємо базові налаштування", error.name);
            // Fallback на базові налаштування
            const basicConstraints = {
                video: { facingMode: qrCameraState.currentFacingMode }
            };
            if (savedDeviceId && !qrCameraState.currentDeviceId) {
                basicConstraints.video.deviceId = { exact: savedDeviceId };
                delete basicConstraints.video.facingMode;
            } else if (qrCameraState.currentDeviceId) {
                basicConstraints.video.deviceId = { exact: qrCameraState.currentDeviceId };
                delete basicConstraints.video.facingMode;
            }
            stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        }
        
        videoElement.srcObject = stream;
        fallbackElement.classList.remove('active');
        
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            qrCameraState.currentDeviceId = videoTrack.getSettings().deviceId;
        }
        
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            qrCameraState.scanningActive = true;
            scanQRCode();
        };
    } catch (error) {
        console.error("Помилка камери:", error);
        
        // If the saved device ID is invalid, clear it and retry with facingMode
        if ((error.name === 'OverconstrainedError' || error.name === 'NotFoundError') && localStorage.getItem('selected_camera_id')) {
            console.log("Збережений deviceId недійсний, повторна спроба з facingMode");
            localStorage.removeItem('selected_camera_id');
            qrCameraState.currentDeviceId = null;
            startQRCamera();
            return;
        }
        
        showQRCameraFallback();
    }
}

/**
 * Scan QR code from video stream using jsQR
 */
function scanQRCode() {
    if (!qrCameraState.scanningActive) return;
    
    const videoElement = document.getElementById('camera-stream');
    if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scanQRCode);
        return;
    }
    
    // Використовуємо меншу роздільність для швидшого сканування
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const scale = CONFIG.QR_SCAN_SCALE;
    canvas.width = videoElement.videoWidth * scale;
    canvas.height = videoElement.videoHeight * scale;
    
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    if (typeof jsQR !== 'undefined') {
        // Підвищена чутливість — спробувати обидва варіанти (нормальний та інвертований)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth"
        });
        
        if (code) {
            console.log("QR-код розпізнано:", code.data);
            qrCameraState.scanningActive = false;
            stopQRCamera();
            sessionStorage.setItem('qr_scanned', 'true');
            window.location.href = 'payment.html';
            return;
        }
    } else {
        console.error("jsQR бібліотека не завантажена");
        stopQRCamera();
        return;
    }
    
    requestAnimationFrame(scanQRCode);
}

/**
 * Show camera fallback
 */
function showQRCameraFallback() {
    const videoElement = document.getElementById('camera-stream');
    const fallbackElement = document.getElementById('camera-fallback');
    if (videoElement && fallbackElement) {
        videoElement.style.display = 'none';
        fallbackElement.classList.add('active');
    }
}

/**
 * Stop the camera
 */
function stopQRCamera() {
    qrCameraState.scanningActive = false;
    
    // Stop video element if present
    const videoElement = document.getElementById('camera-stream');
    if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
}

/**
 * Switch camera (front/back)
 */
function switchQRCamera() {
    qrCameraState.currentFacingMode = (qrCameraState.currentFacingMode === 'environment') ? 'user' : 'environment';
    qrCameraState.currentDeviceId = null;
    localStorage.removeItem('selected_camera_id');
    stopQRCamera();
    startQRCamera();
}

/**
 * Go to payment from QR page
 */
function goToPayment() {
    // Зупинити камеру
    stopQRCamera();
    
    // Зберегти мітку про сканування
    sessionStorage.setItem('qr_scanned', 'true');
    
    // Перейти на сторінку оплати
    goToPage('payment');
}

/**
 * Ініціалізація QR сторінки
 */
function initQRPage() {
    // Start camera
    startQRCamera();
    
    // Setup close button (хрестик) - повернення на архів
    const closeBtn = document.querySelector('.top-bar .icon-btn');
    if (closeBtn) {
        closeBtn.onclick = null;
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            stopQRCamera();
            window.location.href = 'index.html'; // Архів
        });
    }
    
    // Setup switch camera button
    const switchBtn = document.querySelector('.circle-btn[onclick*="switchCamera"]');
    if (switchBtn) {
        switchBtn.removeAttribute('onclick');
        switchBtn.addEventListener('click', switchQRCamera);
    }
    
    // Setup payment button (кнопка ліхтарика)
    const paymentBtn = document.querySelector('.circle-btn[onclick*="goToPayment"]');
    if (paymentBtn) {
        paymentBtn.removeAttribute('onclick');
        paymentBtn.addEventListener('click', goToPayment);
    }
    
    // При кліку на overlay також переходити на оплату
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (!e.target.closest('.icon-btn') && !e.target.closest('.circle-btn')) {
                goToPayment();
            }
        });
    }
}

// ============================================
// СТОРІНКА ОПЛАТИ (payment.html)
// ============================================

/**
 * Ініціалізація сторінки оплати
 */
function initPaymentPage() {
    try {
        const buyBtn = document.querySelector('.buy-btn');
        const transportInput = document.querySelector('.transport-input');
        const qtyInput = document.getElementById('qty-input');
        const minusBtn = document.getElementById('btn-minus');
        const plusBtn = document.getElementById('btn-plus');
        const totalPriceEl = document.getElementById('total-price');
        const pricePerTicket = 12.00;
        
        if (!buyBtn || !transportInput || !qtyInput) return;
        
        // Генерація рандомних даних картки
        generateRandomCardData();
        
        // Логіка лічильника пасажирів
        if (plusBtn && minusBtn && totalPriceEl) {
            const updateTotal = (qty) => {
                const total = (qty * pricePerTicket).toFixed(2);
                totalPriceEl.textContent = `${total} UAH`;
            };
            
            // Видалити старі обробники клонуванням елементів
            const newPlusBtn = plusBtn.cloneNode(true);
            const newMinusBtn = minusBtn.cloneNode(true);
            plusBtn.parentNode.replaceChild(newPlusBtn, plusBtn);
            minusBtn.parentNode.replaceChild(newMinusBtn, minusBtn);
            
            newPlusBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                let val = parseInt(qtyInput.value);
                val++;
                qtyInput.value = val;
                updateTotal(val);
            });

            newMinusBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                let val = parseInt(qtyInput.value);
                if (val > 1) {
                    val--;
                    qtyInput.value = val;
                    updateTotal(val);
                }
            });
        }
        
        // Обробник кнопки "Купити"
        buyBtn.addEventListener('click', function() {
            const transportNumber = transportInput.value.trim();
            const passengers = parseInt(qtyInput.value);
            
            // Валідація
            if (!transportNumber) {
                alert('Будь ласка, введіть номер транспорту');
                transportInput.focus();
                return;
            }
            
            if (!passengers || passengers < 1) {
                alert('Кількість пасажирів має бути не менше 1');
                return;
            }
            
            // Створити та зберегти квиток
            const newTicket = addTicket({
                transportNumber: transportNumber,
                passengers: passengers
            });
            
            // Зберегти в session для відображення на головній сторінці
            sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(newTicket));
            
            // Очистити мітку сканування
            sessionStorage.removeItem('qr_scanned');
            
            // Перейти на головну сторінку
            goToPage('index');
        });
        
        // Валідація вводу - тільки цифри
        transportInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    } catch (error) {
        console.error('Помилка ініціалізації payment page:', error);
    }
}

/**
 * Генерація рандомних даних картки на сторінці оплати
 */
function generateRandomCardData() {
    // Використовуємо кеш для даних картки (генеруємо раз на добу)
    const cardData = getCachedOrGenerate('payment_card_data', () => {
        return {
            balance: generateRandomBalance(),
            cardLast4: generateCardLast4(),
            ibanLast4: generateIbanLast4()
        };
    });
    
    // Оновлюємо баланс
    const balanceEl = document.querySelector('.card-balance');
    if (balanceEl) {
        balanceEl.textContent = `${cardData.balance} UAH`;
    }
    
    // Оновлюємо номер картки
    const cardNumberEl = document.querySelector('.card-number');
    if (cardNumberEl) {
        cardNumberEl.textContent = `•••• ${cardData.cardLast4} | UA53 •••• ${cardData.ibanLast4}`;
    }
}

// ============================================
// ГОЛОВНА СТОРІНКА (index.html) - АРХІВ
// ============================================

/**
 * Ініціалізація головної сторінки
 */
function initIndexPage() {
    try {
        // Перевірити чи є новий квиток з оплати
        const newTicketData = sessionStorage.getItem(CONFIG.SESSION_KEY);
        if (newTicketData) {
            sessionStorage.removeItem(CONFIG.SESSION_KEY);
            // Просто перезавантажити квитки - новий вже збережений
        }
        
        // Відобразити всі квитки
        displayTicketsOnIndexPage();
    } catch (error) {
        console.error('Помилка ініціалізації index page:', error);
    }
}

// ============================================
// СТОРІНКА НАЛАШТУВАНЬ (settings.html)
// ============================================

/**
 * Перевірити чи увімкнене локальне збереження
 */
function isStorageEnabled() {
    const enabled = localStorage.getItem(CONFIG.STORAGE_ENABLED_KEY);
    return enabled === null || enabled === 'true'; // За замовчуванням увімкнено
}

/**
 * Завантажити статистику з окремого сховища
 */
function loadStatistics() {
    try {
        const data = localStorage.getItem(CONFIG.STATISTICS_KEY);
        return data ? JSON.parse(data) : { tickets: [] };
    } catch (error) {
        console.error('Помилка завантаження статистики:', error);
        return { tickets: [] };
    }
}

/**
 * Зберегти статистику в окреме сховище
 */
function saveStatistics(stats) {
    try {
        localStorage.setItem(CONFIG.STATISTICS_KEY, JSON.stringify(stats));
        return true;
    } catch (error) {
        console.error('Помилка збереження статистики:', error);
        return false;
    }
}

/**
 * Оновити статистику при додаванні нового квитка
 */
function updateStatisticsStorage(newTicket) {
    const stats = loadStatistics();
    
    // Зберігаємо тільки необхідні дані для статистики
    stats.tickets.push({
        purchaseTime: newTicket.purchaseTime,
        passengers: newTicket.passengers
    });
    
    saveStatistics(stats);
}

// ============================================
// КЕШУВАННЯ ДАНИХ
// ============================================

/**
 * Завантажити кеш
 */
function loadCache() {
    try {
        const data = localStorage.getItem(CONFIG.CACHE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Помилка завантаження кешу:', error);
        return {};
    }
}

/**
 * Зберегти дані в кеш
 */
function saveCache(cache) {
    try {
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cache));
        return true;
    } catch (error) {
        console.error('Помилка збереження кешу:', error);
        return false;
    }
}

/**
 * Отримати дані з кешу або згенерувати нові
 * @param {string} key - ключ кешу
 * @param {function} generator - функція для генерації даних
 * @returns {any} - дані з кешу або нові згенеровані
 */
function getCachedOrGenerate(key, generator) {
    const cache = loadCache();
    const now = Date.now();
    
    // Перевірити чи є дані в кеші і чи не застарілі
    if (cache[key] && cache[key].timestamp && 
        (now - cache[key].timestamp < CONFIG.CACHE_DURATION)) {
        return cache[key].data;
    }
    
    // Згенерувати нові дані
    const newData = generator();
    
    // Зберегти в кеш
    cache[key] = {
        data: newData,
        timestamp: now
    };
    saveCache(cache);
    
    return newData;
}

/**
 * Очистити кеш
 */
function clearCache() {
    localStorage.removeItem(CONFIG.CACHE_KEY);
}

/**
 * Очистити застарілі дані з кешу
 */
function cleanExpiredCache() {
    const cache = loadCache();
    const now = Date.now();
    let hasChanges = false;
    
    Object.keys(cache).forEach(key => {
        if (cache[key].timestamp && 
            (now - cache[key].timestamp >= CONFIG.CACHE_DURATION)) {
            delete cache[key];
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        saveCache(cache);
    }
}

/**
 * Попередньо завантажити зображення для кешування браузером
 */
function preloadImages() {
    const images = [
        'https://i.ibb.co/9m9Gx8wS/Picsart-26-01-29-01-00-20-922.jpg', // Logo
        'https://i.ibb.co/9mn9jMK6/Picsart-26-01-29-00-59-56-789.jpg', // Ticket Visual
        'https://i.ibb.co/ycpRSNp5/Picsart-26-01-29-17-42-01-646.jpg', // Archive icon
        'https://i.ibb.co/hTyK6Tx/Picsart-26-01-29-17-41-41-839.jpg', // Visa Card
        'https://i.ibb.co/0y9D9mD8/Picsart-26-01-29-18-17-06-761.jpg', // Visa logo
        'https://i.ibb.co/cSMjFD5Y/Picsart-26-01-29-15-08-37-387.jpg', // Transport icon
        'https://i.ibb.co/23Nbdh39/Picsart-26-01-29-15-09-08-727.jpg', // Train
        'https://i.ibb.co/5gkP5ZBv/Picsart-26-01-29-15-09-59-963.jpg', // Plane
        'https://i.ibb.co/v8p18zj/Picsart-26-01-29-15-18-22-163.jpg', // Bus
        'https://i.ibb.co/7JtyVry3/Picsart-26-01-29-15-19-07-001.jpg'  // City Transport
    ];
    
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

/**
 * Попередньо завантажити HTML сторінки для швидких переходів
 */
function preloadPages() {
    if (!isOfflineModeEnabled()) {
        return; // Не завантажуємо сторінки якщо офлайн режим вимкнений
    }
    
    const pages = [
        'index.html',
        'qr.html',
        'payment.html',
        'settings.html',
        'transport.html'
    ];
    
    pages.forEach(page => {
        // Використовуємо fetch для попереднього завантаження
        // Service Worker обробить кешування з правильною стратегією
        fetch(page, { 
            method: 'GET'
        }).catch(err => {
            console.log('Не вдалося попередньо завантажити сторінку:', page, err);
        });
    });
}

/**
 * Отримати статистику поїздок
 */
function getTicketStatistics() {
    if (!isStorageEnabled()) {
        return {
            today: 0,
            week: 0,
            month: 0,
            total: 0,
            totalSpent: 0
        };
    }

    // Завантажуємо статистику з окремого сховища
    const stats = loadStatistics();
    const tickets = stats.tickets || [];
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let totalSpent = 0;

    tickets.forEach(ticket => {
        const ticketDate = new Date(ticket.purchaseTime);
        const ticketCost = (ticket.passengers || 1) * CONFIG.TICKET_PRICE;
        
        totalSpent += ticketCost;

        if (ticketDate >= todayStart) {
            todayCount += ticket.passengers || 1;
        }
        if (ticketDate >= weekStart) {
            weekCount += ticket.passengers || 1;
        }
        if (ticketDate >= monthStart) {
            monthCount += ticket.passengers || 1;
        }
    });

    return {
        today: todayCount,
        week: weekCount,
        month: monthCount,
        total: tickets.reduce((sum, t) => sum + (t.passengers || 1), 0),
        totalSpent: totalSpent.toFixed(2)
    };
}

/**
 * Оновити відображення статистики
 */
function updateStatisticsDisplay() {
    const stats = getTicketStatistics();
    
    const todayEl = document.getElementById('stat-today');
    const weekEl = document.getElementById('stat-week');
    const monthEl = document.getElementById('stat-month');
    const totalEl = document.getElementById('stat-total');
    const spentEl = document.getElementById('total-spent');

    if (todayEl) todayEl.textContent = stats.today;
    if (weekEl) weekEl.textContent = stats.week;
    if (monthEl) monthEl.textContent = stats.month;
    if (totalEl) totalEl.textContent = stats.total;
    if (spentEl) spentEl.textContent = `${stats.totalSpent} UAH`;
}

/**
 * Перемкнути локальне збереження
 */
function toggleLocalStorage() {
    const toggle = document.getElementById('storage-toggle');
    const currentState = isStorageEnabled();
    const newState = !currentState;
    
    localStorage.setItem(CONFIG.STORAGE_ENABLED_KEY, newState.toString());
    
    if (toggle) {
        if (newState) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
    
    // Оновити статистику
    updateStatisticsDisplay();
    
    if (!newState) {
        alert('Локальне збереження вимкнено. Нові квитки не будуть зберігатися.');
    }
}

/**
 * Увімкнути/вимкнути повноекранний режим
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            // Зберігаємо, що fullscreen активний
            sessionStorage.setItem(CONFIG.FULLSCREEN_KEY, 'true');
        }).catch(err => {
            console.log('Помилка входу в fullscreen:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                // Видаляємо мітку fullscreen
                sessionStorage.removeItem(CONFIG.FULLSCREEN_KEY);
            });
        }
    }
}

/**
 * Перевірити чи увімкнений fullscreen по подвійному кліку
 */
function isDblClickFullscreenEnabled() {
    const enabled = localStorage.getItem(CONFIG.DBLCLICK_FULLSCREEN_KEY);
    return enabled === null || enabled === 'true'; // За замовчуванням увімкнено
}

/**
 * Перемкнути fullscreen по подвійному кліку
 */
function toggleDoubleClickFullscreen() {
    const currentState = isDblClickFullscreenEnabled();
    const newState = !currentState;
    
    localStorage.setItem(CONFIG.DBLCLICK_FULLSCREEN_KEY, newState.toString());
    
    const toggle = document.getElementById('dblclick-toggle');
    if (toggle) {
        if (newState) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
}

/**
 * Перевірити чи увімкнений режим "завжди в повному екрані"
 */
function isAlwaysFullscreenEnabled() {
    const enabled = localStorage.getItem(CONFIG.ALWAYS_FULLSCREEN_KEY);
    return enabled === 'true'; // За замовчуванням вимкнено для кращого UX
}

/**
 * Перемкнути режим "завжди в повному екрані"
 */
function toggleAlwaysFullscreen() {
    const currentState = isAlwaysFullscreenEnabled();
    const newState = !currentState;
    
    localStorage.setItem(CONFIG.ALWAYS_FULLSCREEN_KEY, newState.toString());
    
    const toggle = document.getElementById('always-fullscreen-toggle');
    if (toggle) {
        if (newState) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
    
    // Якщо увімкнено, то одразу активувати fullscreen
    if (newState && !document.fullscreenElement) {
        toggleFullscreen();
    }
}

/**
 * Перевірити чи увімкнений офлайн режим
 */
function isOfflineModeEnabled() {
    const enabled = localStorage.getItem(CONFIG.OFFLINE_MODE_KEY);
    // За замовчуванням увімкнено для підтримки PWA та автономної роботи
    return enabled === null || enabled === 'true';
}

/**
 * Перемкнути офлайн режим
 */
function toggleOfflineMode() {
    const currentState = isOfflineModeEnabled();
    const newState = !currentState;
    
    localStorage.setItem(CONFIG.OFFLINE_MODE_KEY, newState.toString());
    
    const toggle = document.getElementById('offline-toggle');
    if (toggle) {
        if (newState) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
}

/**
 * Відновити fullscreen при переході між сторінками
 */
function restoreFullscreenIfNeeded() {
    const alwaysFullscreen = isAlwaysFullscreenEnabled();
    const wasFullscreen = sessionStorage.getItem(CONFIG.FULLSCREEN_KEY);
    
    // Якщо увімкнено "завжди в повному екрані" АБО fullscreen був активний
    if ((alwaysFullscreen || wasFullscreen === 'true') && !document.fullscreenElement) {
        // Невелика затримка для завантаження сторінки
        setTimeout(() => {
            document.documentElement.requestFullscreen().then(() => {
                sessionStorage.setItem(CONFIG.FULLSCREEN_KEY, 'true');
            }).catch(err => {
                console.log('Помилка відновлення fullscreen:', err);
            });
        }, CONFIG.FULLSCREEN_RESTORE_DELAY);
    }
}

/**
 * Відстежувати вихід з fullscreen
 */
function monitorFullscreenChanges() {
    document.addEventListener('fullscreenchange', function() {
        if (!document.fullscreenElement) {
            // Користувач вийшов з fullscreen вручну
            // Але якщо увімкнено "завжди в повному екрані", повертаємо його
            if (isAlwaysFullscreenEnabled()) {
                setTimeout(() => {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.log('Не вдалося відновити fullscreen:', err);
                    });
                }, CONFIG.FULLSCREEN_AUTO_RESTORE_DELAY);
            } else {
                sessionStorage.removeItem(CONFIG.FULLSCREEN_KEY);
            }
        }
    });
}

/**
 * Ініціалізувати відстежування стану мережі
 */
function initNetworkMonitoring() {
    if (!isOfflineModeEnabled()) {
        return; // Якщо офлайн режим вимкнений, не потрібно відстежувати
    }
    
    // Перевірити стан при завантаженні
    updateOnlineStatus();
    
    // Відстежувати зміни стану мережі
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

/**
 * Оновити статус підключення
 */
function updateOnlineStatus() {
    if (navigator.onLine) {
        console.log('✅ Додаток в онлайн режимі');
        // Можна показати повідомлення що з'єднання відновлено
        if (sessionStorage.getItem('was_offline') === 'true') {
            showNotification('З\'єднання відновлено', 'success');
            sessionStorage.removeItem('was_offline');
        }
    } else {
        console.log('⚠️ Додаток в офлайн режимі');
        sessionStorage.setItem('was_offline', 'true');
        if (isOfflineModeEnabled()) {
            showNotification('Працюємо в офлайн режимі. Використовуються кешовані дані.', 'warning');
        } else {
            showNotification('Немає підключення до інтернету', 'error');
        }
    }
}

/**
 * Показати повідомлення користувачу
 */
function showNotification(message, type = 'info') {
    // Перевірка чи існує вже контейнер для повідомлень
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        // Створити контейнер якщо його немає
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            max-width: 90%;
            width: 350px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Отримати колір для типу повідомлення
    const bgColor = CONFIG.NOTIFICATION_COLORS[type] || CONFIG.NOTIFICATION_COLORS.info;
    const textColor = type === 'warning' ? '#000' : '#fff';
    
    // Створити повідомлення
    const notification = document.createElement('div');
    notification.style.cssText = `
        background-color: ${bgColor};
        color: ${textColor};
        padding: 14px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
        text-align: center;
    `;
    notification.textContent = message;
    
    // Додати CSS анімацію якщо її ще немає
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    notificationContainer.appendChild(notification);
    
    // Автоматично приховати через заданий час
    setTimeout(() => {
        notification.style.animation = `slideOut ${CONFIG.NOTIFICATION_ANIMATION_DURATION}ms ease-out`;
        setTimeout(() => {
            notification.remove();
        }, CONFIG.NOTIFICATION_ANIMATION_DURATION);
    }, CONFIG.NOTIFICATION_DURATION);
}

/**
 * Показати модальне вікно очищення історії
 */
function showClearHistoryModal() {
    const modal = document.getElementById('clearModal');
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Закрити модальне вікно очищення історії
 */
function closeClearModal() {
    const modal = document.getElementById('clearModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Підтвердити очищення історії
 * @param {boolean} clearAll - true: видалити все, false: залишити статистику
 */
function confirmClearHistory(clearAll) {
    if (clearAll) {
        // Видалити все (квитки + статистику + кеш)
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        localStorage.removeItem(CONFIG.STATISTICS_KEY);
        clearCache();
        closeClearModal();
        updateStatisticsDisplay();
        alert('Всю історію, статистику та кеш успішно очищено!');
    } else {
        // Видалити тільки квитки, залишити статистику та кеш
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        closeClearModal();
        updateStatisticsDisplay();
        alert('Квитки очищено! Статистика та кеш збережені.');
    }
}

/**
 * Очистити кеш з повідомленням
 */
function clearCacheAndNotify() {
    clearCache();
    updateCacheSizeDisplay();
    alert('Кеш успішно очищено! При наступному завантаженні дані будуть згенеровані заново.');
}

/**
 * Отримати список доступних камер
 */
async function getCameraList() {
    try {
        // Спочатку запитуємо дозвіл на камеру
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        
        return cameras;
    } catch (error) {
        console.error('Помилка отримання списку камер:', error);
        return [];
    }
}

/**
 * Відкрити селектор камери
 */
async function openCameraSelector() {
    const cameras = await getCameraList();
    const cameraList = document.getElementById('camera-list');
    const modal = document.getElementById('cameraModal');
    
    if (!cameraList || !modal) return;
    
    // Очистити список
    cameraList.innerHTML = '';
    
    if (cameras.length === 0) {
        cameraList.innerHTML = '<div class="modal-text">Камери не знайдено</div>';
    } else {
        const savedCameraId = localStorage.getItem('selected_camera_id');
        
        // Додати опцію "Автоматично"
        const autoItem = document.createElement('div');
        autoItem.className = 'camera-item' + (!savedCameraId ? ' selected' : '');
        autoItem.innerHTML = `
            <div class="camera-name">Автоматично</div>
            <svg class="camera-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        autoItem.onclick = () => selectCamera(null);
        cameraList.appendChild(autoItem);
        
        // Додати всі камери
        cameras.forEach((camera, index) => {
            const item = document.createElement('div');
            item.className = 'camera-item' + (camera.deviceId === savedCameraId ? ' selected' : '');
            
            const label = camera.label || `Камера ${index + 1}`;
            
            item.innerHTML = `
                <div class="camera-name">${label}</div>
                <svg class="camera-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            item.onclick = () => selectCamera(camera.deviceId);
            cameraList.appendChild(item);
        });
    }
    
    modal.classList.add('show');
}

/**
 * Закрити модальне вікно вибору камери
 */
function closeCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Вибрати камеру
 */
function selectCamera(deviceId) {
    if (deviceId) {
        localStorage.setItem('selected_camera_id', deviceId);
    } else {
        localStorage.removeItem('selected_camera_id');
    }
    
    // Оновити опис
    updateCameraDescription();
    
    closeCameraModal();
}

/**
 * Оновити опис вибраної камери
 */
async function updateCameraDescription() {
    const descEl = document.getElementById('camera-description');
    if (!descEl) return;
    
    const savedCameraId = localStorage.getItem('selected_camera_id');
    
    if (!savedCameraId) {
        descEl.textContent = 'Автоматично';
        return;
    }
    
    try {
        const cameras = await getCameraList();
        const camera = cameras.find(c => c.deviceId === savedCameraId);
        
        if (camera) {
            descEl.textContent = camera.label || 'Вибрана камера';
        } else {
            descEl.textContent = 'Автоматично';
        }
    } catch (error) {
        descEl.textContent = 'Автоматично';
    }
}

/**
 * Отримати розмір кешу в KB
 */
function getCacheSize() {
    try {
        const cache = localStorage.getItem(CONFIG.CACHE_KEY);
        if (!cache) return 0;
        
        // Розмір в байтах (кожен символ = 2 байти в UTF-16)
        const bytes = new Blob([cache]).size;
        const kb = (bytes / 1024).toFixed(2);
        
        return kb;
    } catch (error) {
        return 0;
    }
}

/**
 * Оновити відображення розміру кешу
 */
function updateCacheSizeDisplay() {
    const cacheSizeEl = document.getElementById('cache-size');
    if (cacheSizeEl) {
        const size = getCacheSize();
        cacheSizeEl.textContent = `${size} KB`;
    }
}

// ============================================
// СТОРІНКА ТРАНСПОРТ (transport.html)
// ============================================

/**
 * Перехід до додатку Privat24
 */
function goToPrivat24() {
    // Deep link до додатку Privat24
    const iosLink = 'privat24://';
    const androidLink = 'intent://privat24#Intent;scheme=privat24;package=ua.privatbank.ap24;end';
    const webLink = 'https://next.privat24.ua/';
    
    // Визначити платформу
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    let attemptedDeepLink = false;
    let fallbackTimer;
    
    // Функція для скасування fallback якщо додаток відкрився
    const cancelFallback = () => {
        if (fallbackTimer) {
            clearTimeout(fallbackTimer);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    
    // Обробник зміни видимості сторінки
    const handleVisibilityChange = () => {
        if (document.hidden) {
            // Сторінка стала невидимою - ймовірно додаток відкрився
            cancelFallback();
        }
    };
    
    // Спробувати відкрити додаток залежно від платформи
    if (isIOS) {
        window.location.href = iosLink;
        attemptedDeepLink = true;
    } else if (isAndroid) {
        window.location.href = androidLink;
        attemptedDeepLink = true;
    }
    
    if (attemptedDeepLink) {
        // Відстежувати зміну видимості сторінки
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Fallback після затримки якщо додаток не відкрився
        fallbackTimer = setTimeout(() => {
            cancelFallback();
            window.location.href = webLink;
        }, 1500);
    } else {
        // Невідома платформа - відкрити веб версію
        window.location.href = webLink;
    }
}

/**
 * Ініціалізація transport сторінки
 */
function initTransportPage() {
    const backBtn = document.querySelector('.top-bar .back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToPrivat24();
        });
    }
}

// ============================================
// СТОРІНКА НАЛАШТУВАНЬ (settings.html)
// ============================================

/**
 * Ініціалізація сторінки налаштувань
 */
function initSettingsPage() {
    try {
        // Синхронізувати статистику зі старих квитків (якщо є)
        syncStatisticsFromTickets();
        
        // Оновити статистику
        updateStatisticsDisplay();
        
        // Оновити розмір кешу
        updateCacheSizeDisplay();
        
        // Оновити опис камери
        updateCameraDescription();
        
        // Встановити стан перемикача локального збереження
        const toggle = document.getElementById('storage-toggle');
        if (toggle) {
            if (isStorageEnabled()) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
        
        // Встановити стан перемикача подвійного кліку
        const dblClickToggle = document.getElementById('dblclick-toggle');
        if (dblClickToggle) {
            if (isDblClickFullscreenEnabled()) {
                dblClickToggle.classList.add('active');
            } else {
                dblClickToggle.classList.remove('active');
            }
        }
        
        // Встановити стан перемикача "завжди в повному екрані"
        const alwaysFullscreenToggle = document.getElementById('always-fullscreen-toggle');
        if (alwaysFullscreenToggle) {
            if (isAlwaysFullscreenEnabled()) {
                alwaysFullscreenToggle.classList.add('active');
            } else {
                alwaysFullscreenToggle.classList.remove('active');
            }
        }
        
        // Встановити стан перемикача офлайн режиму
        const offlineToggle = document.getElementById('offline-toggle');
        if (offlineToggle) {
            if (isOfflineModeEnabled()) {
                offlineToggle.classList.add('active');
            } else {
                offlineToggle.classList.remove('active');
            }
        }
    } catch (error) {
        console.error('Помилка ініціалізації settings page:', error);
    }
}

/**
 * Синхронізувати статистику зі старих квитків
 */
function syncStatisticsFromTickets() {
    const stats = loadStatistics();
    
    // Якщо статистика порожня, але є квитки - синхронізувати
    if ((!stats.tickets || stats.tickets.length === 0)) {
        const tickets = loadTickets();
        if (tickets.length > 0) {
            stats.tickets = tickets.map(ticket => ({
                purchaseTime: ticket.purchaseTime,
                passengers: ticket.passengers || 1
            }));
            saveStatistics(stats);
        }
    }
}

/**
 * Ініціалізувати подвійний клік для fullscreen
 */
let lastTap = 0;
function initDoubleClickFullscreen() {
    document.addEventListener('click', function(e) {
        // Перевірити чи функція увімкнена
        if (!isDblClickFullscreenEnabled()) return;
        
        // Ігнорувати кліки на кнопках та інших інтерактивних елементах
        if (e.target.closest('button, a, input, .card, .setting-item, .danger-item, .toggle-switch')) {
            return;
        }
        
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
            // Подвійний клік
            toggleFullscreen();
            lastTap = 0;
        } else {
            lastTap = currentTime;
        }
    });
}

// ============================================
// SPA ROUTER (ВИПРАВЛЕНИЙ - ЗІ СТИЛЯМИ)
// ============================================

const SPA = {
    pageCache: {},
    
    init() {
        // Обробка кнопки "Назад" у браузері
        window.addEventListener('popstate', (event) => {
            const pageName = event.state ? event.state.page : 'transport';
            this.loadPage(pageName, false);
        });

        // Визначаємо поточну сторінку при старті
        let path = window.location.pathname;
        // Беремо ім'я файлу без .html
        let page = path.split('/').pop().replace('.html', '') || 'transport';
        
        // Запускаємо скрипти для поточної сторінки
        this.initPageScripts(page);
        
        // Відновлюємо фулскрін (якщо налаштовано)
        if (typeof restoreFullscreenIfNeeded === 'function') {
            restoreFullscreenIfNeeded();
        }
    },

    navigate(pageName) {
        this.loadPage(pageName, true);
    },

async loadPage(pageName, pushState = true) {
        try {
            let htmlContent;
            // Перевірка: якщо назва вже має .html, не додаємо його вдруге
            const fileName = pageName.endsWith('.html') ? pageName : pageName + '.html';
            // Чиста назва для кешу та історії (без .html)
            const cleanPageName = pageName.replace('.html', '');

            // 1. Отримуємо HTML (з кешу або завантажуємо)
            if (this.pageCache[cleanPageName]) {
                htmlContent = this.pageCache[cleanPageName];
            } else {
                const response = await fetch(fileName);
                if (!response.ok) throw new Error('Page not found');
                htmlContent = await response.text();
                this.pageCache[cleanPageName] = htmlContent;
            }

            // 2. Парсимо новий HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            // === ОСЬ ЦЕ ГОЛОВНА ПРАВКА ДЛЯ СТИЛІВ ===
            
            // Видаляємо старі стилі сторінок (теги <style> в head), щоб вони не конфліктували
            const oldStyles = document.head.querySelectorAll('style');
            oldStyles.forEach(s => s.remove());

            // Вставляємо нові стилі з завантаженої сторінки
            const newStyles = doc.head.querySelectorAll('style');
            newStyles.forEach(newStyle => {
                const styleElement = document.createElement('style');
                styleElement.textContent = newStyle.textContent;
                document.head.appendChild(styleElement);
            });
            // ==========================================

            // 3. Підміняємо вміст BODY
            // Спочатку видаляємо скрипти з нового HTML, щоб вони не виконувалися двічі
            const scripts = doc.body.querySelectorAll('script');
            scripts.forEach(s => s.remove());
            
            document.body.innerHTML = doc.body.innerHTML;
            document.title = doc.title;

            // 4. Оновлюємо URL в адресному рядку
            if (pushState) {
                window.history.pushState({ page: cleanPageName }, doc.title, fileName);
            }

            // 5. Запускаємо логіку (скрипти) для нової сторінки
            // Викликаємо initPageScripts, яка вже є у твоєму коді
            this.initPageScripts(cleanPageName);
            
            // Відновлюємо фулскрін (якщо така функція є у твоєму коді)
            if (typeof restoreFullscreenIfNeeded === 'function') {
                restoreFullscreenIfNeeded();
            }

        } catch (error) {
            console.error('SPA Error:', error);
            // Якщо щось пішло не так (наприклад, fetch не працює),
            // робимо звичайний перехід браузера
            window.location.href = pageName.endsWith('.html') ? pageName : pageName + '.html';
        }
    },

    initPageScripts(pageName) {
        const cleanName = pageName.replace('.html', '');
        
        // Викликаємо функції ініціалізації залежно від сторінки
        if (cleanName === 'index' || cleanName === '') {
            if (typeof initIndexPage === 'function') initIndexPage();
        }
        else if (cleanName === 'payment') {
            if (typeof initPaymentPage === 'function') initPaymentPage();
        }
        else if (cleanName === 'qr') {
            if (typeof initQRPage === 'function') initQRPage();
        }
        else if (cleanName === 'settings') {
            if (typeof initSettingsPage === 'function') initSettingsPage();
        }
        else if (cleanName === 'transport') {
            if (typeof initTransportPage === 'function') initTransportPage();
        }
        
        // Перезапускаємо слухач подвійного кліку (якщо функція існує)
        if (typeof initDoubleClickFullscreen === 'function') {
            initDoubleClickFullscreen(); 
        } else if (typeof initGlobalListeners === 'function') {
            initGlobalListeners();
        }
    }
};

// Функція для виклику з HTML (обов'язкова для роботи кнопок!)
window.goToPage = function(pageName) {
    SPA.navigate(pageName);
};

// ============================================
// АВТОМАТИЧНА ІНІЦІАЛІЗАЦІЯ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Очистити застарілий кеш при кожному завантаженні
    cleanExpiredCache();
    
    // Попередньо завантажити зображення
    preloadImages();
    
    // Попередньо завантажити HTML сторінки для офлайн режиму
    preloadPages();
    
    // Відновити fullscreen якщо був активний
    restoreFullscreenIfNeeded();
    
    // Відстежувати зміни fullscreen
    monitorFullscreenChanges();
    
    // Спробувати ініціалізувати SPA
    const isSPA = SPA.init();
    
    if (!isSPA) {
        // Стара логіка для окремих HTML файлів (зворотна сумісність)
        const currentPage = window.location.pathname.split('/').pop();
        
        // Визначити поточну сторінку та ініціалізувати відповідний функціонал
        if (currentPage === 'index.html' || currentPage === '') {
            initIndexPage();
        } else if (currentPage === 'payment.html') {
            initPaymentPage();
        } else if (currentPage === 'qr.html') {
            initQRPage();
        } else if (currentPage === 'settings.html') {
            initSettingsPage();
        } else if (currentPage === 'transport.html') {
            initTransportPage();
        }
    }

    // Ініціалізувати подвійний клік для fullscreen на всіх сторінках
    initDoubleClickFullscreen();
    
    // Відстежувати стан мережі
    initNetworkMonitoring();
    
    // Реєстрація Service Worker для офлайн режиму
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker зареєстровано:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Помилка реєстрації Service Worker:', error);
            });
    }
});

// ============================================
// ГЛОБАЛЬНІ ФУНКЦІЇ ДЛЯ HTML
// ============================================

// Функції для модального вікна (вже є в HTML, але виносимо сюди)
function openModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

function closeModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function copyData() {
    const dataToCopy = `КП ВІННИЦЬКА ТРАНСПОРТНА КОМПАНІЯ\nКод ЄДРПОУ: 03327925\nЗареєстровано: 28.10.1993\nАдреса: 21037, м. Вінниця, вул. Хмельницьке шосе, 29\nТелефон: +38-067-435-05-25`;
    navigator.clipboard.writeText(dataToCopy).then(() => {
        alert("Дані скопійовано!");
    }).catch(err => {
        console.error('Не вдалося скопіювати: ', err);
    });
}

// Закриття модального вікна при кліку поза ним
window.onclick = function(event) {
    const modal = document.getElementById('infoModal');
    if (event.target == modal) {
        closeModal();
    }
}
