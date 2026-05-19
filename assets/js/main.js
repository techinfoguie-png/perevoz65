// ============================================
// Грузовоз — CMS через Google Sheets
// ============================================

// Конфигурация (замените на ваши ID)
const CONFIG = {
    // ID таблицы CMS (из URL таблицы)
    CMS_SHEET_ID: '1Gj7mlW39zaN4mVmRCR1xoIZ1TXMvmKzn9V9Xe3Ut-wg',
    // ID таблицы для заявок
    ORDERS_SHEET_ID: '1Gj7mlW39zaN4mVmRCR1xoIZ1TXMvmKzn9V9Xe3Ut-wg',
    // API ключ для чтения (необязательно для публичных таблиц)
    API_KEY: ''
};

// Глобальные данные CMS https://docs.google.com/spreadsheets/d/1Gj7mlW39zaN4mVmRCR1xoIZ1TXMvmKzn9V9Xe3Ut-wg/edit?usp=sharing
let cmsData = {};

// ============================================
// CMS Loader — загрузка данных из Google Sheets
// ============================================

async function loadCMSData() {
    showCMSLoading();

    try {
        // Пробуем загрузить из Google Sheets
        if (CONFIG.CMS_SHEET_ID && CONFIG.CMS_SHEET_ID !== '1Gj7mlW39zaN4mVmRCR1xoIZ1TXMvmKzn9V9Xe3Ut-wg') {
            const data = await fetchSheetData(CONFIG.CMS_SHEET_ID, 'CMS');
            if (data && data.length > 0) {
                cmsData = parseCMSData(data);
                applyCMSData();
            }
        }
    } catch (error) {
        console.log('CMS load error:', error);
        // Используем дефолтные значения
    }

    hideCMSLoading();
}

// Загрузка данных из Google Sheet через CSV
async function fetchSheetData(sheetId, sheetName) {
    // Google Sheets CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

    const response = await fetch(csvUrl);
    const csvText = await response.text();

    return parseCSV(csvText);
}

// Парсинг CSV
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        result.push(row);
    }

    return result;
}

// Парсинг CMS данных
function parseCMSData(data) {
    const cms = {};

    data.forEach(row => {
        const key = row['Ключ'] || row['key'] || row['Key'];
        const value = row['Значение'] || row['value'] || row['Value'];
        const type = row['Тип'] || row['type'] || row['Type'] || 'text';

        if (key) {
            cms[key] = { value, type };
        }
    });

    return cms;
}

// Применение CMS данных к сайту
function applyCMSData() {
    // Общие настройки
    if (cmsData.site_title) document.title = cmsData.site_title.value;
    if (cmsData.meta_description) {
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.content = cmsData.meta_description.value;
    }

    // Цвета темы
    if (cmsData.color_primary) {
        document.documentElement.style.setProperty('--primary', cmsData.color_primary.value);
    }
    if (cmsData.color_primary_dark) {
        document.documentElement.style.setProperty('--primary-dark', cmsData.color_primary_dark.value);
    }
    if (cmsData.color_primary_light) {
        document.documentElement.style.setProperty('--primary-light', cmsData.color_primary_light.value);
    }
    if (cmsData.color_accent) {
        document.documentElement.style.setProperty('--accent', cmsData.color_accent.value);
    }

    // Телефон
    if (cmsData.phone) {
        document.querySelectorAll('.header-phone a, .cta-phone').forEach(el => {
            el.textContent = cmsData.phone.value;
            el.href = 'tel:' + cmsData.phone.value.replace(/[^\d+]/g, '');
        });
    }

    // Email
    if (cmsData.email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
            el.href = 'mailto:' + cmsData.email.value;
            el.textContent = cmsData.email.value;
        });
    }

    // Адрес
    if (cmsData.address) {
        document.querySelectorAll('.map-overlay p, .footer-links li').forEach(el => {
            if (el.textContent.includes('Москва') || el.textContent.includes('ул.')) {
                el.innerHTML = '🏢 ' + cmsData.address.value;
            }
        });
    }

    // Тексты секций
    if (cmsData.hero_title) {
        const heroTitle = document.querySelector('.hero-content h1');
        if (heroTitle) heroTitle.textContent = cmsData.hero_title.value;
    }

    if (cmsData.hero_subtitle) {
        const heroSub = document.querySelector('.hero-content p');
        if (heroSub) heroSub.textContent = cmsData.hero_subtitle.value;
    }

    if (cmsData.cta_title) {
        const ctaTitle = document.querySelector('.cta h2');
        if (ctaTitle) ctaTitle.textContent = cmsData.cta_title.value;
    }

    if (cmsData.cta_text) {
        const ctaText = document.querySelector('.cta > p');
        if (ctaText) ctaText.textContent = cmsData.cta_text.value;
    }

    // Цены материалов
    if (cmsData.price_pesok) updateMaterialPrice('pesok', cmsData.price_pesok.value);
    if (cmsData.price_sheben) updateMaterialPrice('sheben', cmsData.price_sheben.value);
    if (cmsData.price_grunt) updateMaterialPrice('grunt', cmsData.price_grunt.value);
    if (cmsData.price_torf) updateMaterialPrice('torf', cmsData.price_torf.value);

    // Стоимость доставки
    if (cmsData.delivery_price) {
        const deliveryInput = document.getElementById('delivery-price');
        if (deliveryInput) deliveryInput.value = cmsData.delivery_price.value;
    }

    // Обновляем калькулятор
    updateCalculatorOptions();
}

// Обновление цены материала
function updateMaterialPrice(materialKey, price) {
    // Обновляем в селекте
    const option = document.querySelector(`#material option[value="${materialKey}"]`);
    if (option) {
        option.setAttribute('data-base', price);
    }

    // Обновляем в карточке
    const card = document.querySelector(`.material-card[data-material="${materialKey}"] .material-price`);
    if (card) {
        card.textContent = 'от ' + Number(price).toLocaleString('ru-RU') + ' ₽/машина';
    }
}

// Обновление опций калькулятора
function updateCalculatorOptions() {
    // Пересчёт с новыми ценами если результат уже показан
    const resultBlock = document.getElementById('result');
    if (resultBlock.classList.contains('active')) {
        calculate();
    }
}

// ============================================
// UI Functions
// ============================================

function showCMSLoading() {
    const loader = document.getElementById('cms-loader');
    if (loader) loader.classList.remove('hidden');
}

function hideCMSLoading() {
    const loader = document.getElementById('cms-loader');
    if (loader) loader.classList.add('hidden');
}

function toggleCMSPanel() {
    const panel = document.getElementById('cms-panel');
    panel.classList.toggle('active');
}

// ============================================
// Calculator
// ============================================

const distanceInput = document.getElementById('distance');
const distanceRange = document.getElementById('distance-range');
const rangeValue = document.getElementById('range-value');

if (distanceInput && distanceRange) {
    distanceInput.addEventListener('input', function() {
        distanceRange.value = this.value;
        rangeValue.textContent = this.value + ' км';
    });

    distanceRange.addEventListener('input', function() {
        distanceInput.value = this.value;
        rangeValue.textContent = this.value + ' км';
    });
}

function selectMaterial(value, basePrice) {
    const select = document.getElementById('material');
    if (select) {
        select.value = value;
        updateMaterialHighlight();
        document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
    }
}

function updateMaterialHighlight() {
    const select = document.getElementById('material');
    if (!select) return;
    const value = select.value;
    document.querySelectorAll('.material-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.material === value) {
            card.classList.add('selected');
        }
    });
}

function calculate() {
    const materialSelect = document.getElementById('material');
    if (!materialSelect) return;

    const selectedOption = materialSelect.options[materialSelect.selectedIndex];
    const basePrice = parseInt(selectedOption.getAttribute('data-base')) || 0;
    const distance = parseInt(document.getElementById('distance').value) || 0;
    const quantity = parseInt(document.getElementById('quantity').value) || 1;

    if (!basePrice) {
        alert('Пожалуйста, выберите материал');
        return;
    }

    if (distance < 1) {
        alert('Укажите корректное расстояние');
        return;
    }

    // Получаем стоимость доставки из CMS или дефолт
    let deliveryRate = 1000;
    let deliveryStep = 10;

    if (cmsData.delivery_price) deliveryRate = parseInt(cmsData.delivery_price.value) || 1000;
    if (cmsData.delivery_step) deliveryStep = parseInt(cmsData.delivery_step.value) || 10;

    const deliveryCost = Math.ceil(distance / deliveryStep) * deliveryRate;
    const perTruck = basePrice + deliveryCost;
    const total = perTruck * quantity;

    document.getElementById('total-price').textContent = total.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('result-detail').innerHTML = 
        '<strong>Материал:</strong> ' + selectedOption.text + '<br>' +
        '<strong>Базовая стоимость:</strong> ' + basePrice.toLocaleString('ru-RU') + ' ₽/машина<br>' +
        '<strong>Расстояние:</strong> ' + distance + ' км (+' + deliveryCost.toLocaleString('ru-RU') + ' ₽ за доставку)<br>' +
        '<strong>Стоимость за 1 машину:</strong> ' + perTruck.toLocaleString('ru-RU') + ' ₽<br>' +
        '<strong>Количество машин:</strong> ' + quantity + '<br>' +
        '<strong style="color: var(--primary);">Итого к оплате: ' + total.toLocaleString('ru-RU') + ' ₽</strong>';
    document.getElementById('result').classList.add('active');
}

// ============================================
// Mobile Menu
// ============================================

function toggleMobileMenu() {
    const nav = document.querySelector('.nav');
    if (nav.style.display === 'flex') {
        nav.style.display = 'none';
    } else {
        nav.style.display = 'flex';
        nav.style.position = 'absolute';
        nav.style.top = '100%';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.background = 'white';
        nav.style.flexDirection = 'column';
        nav.style.padding = '1rem';
        nav.style.boxShadow = 'var(--shadow-lg)';
        nav.style.gap = '1rem';
    }
}

// ============================================
// Scroll Animations
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});

window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ============================================
// Image Modal
// ============================================

function openImageModal(element) {
    const img = element.querySelector('img');
    document.getElementById('modalImage').src = img.src;
    document.getElementById('modalImage').alt = img.alt;
    document.getElementById('imageModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    document.getElementById('imageModal').classList.remove('active');
    document.body.style.overflow = '';
}

function openOrderModal() {
    document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// Yandex Maps
// ============================================

function initMap() {
    if (typeof ymaps !== 'undefined') {
        ymaps.ready(function() {
            const coords = cmsData.map_coords ? 
                cmsData.map_coords.value.split(',').map(Number) : 
                [142.7407, 46.9555];

            const map = new ymaps.Map('yandex-map', {
                center: coords,
                zoom: 10,
                controls: ['zoomControl', 'typeSelector']
            });

            const placemark = new ymaps.Placemark(coords, {
                balloonContent: '<strong>Грузовоз</strong><br>База отгрузки',
                hintContent: 'База Грузовоз'
            }, {
                preset: 'islands#greenDotIconWithCaption'
            });

            map.geoObjects.add(placemark);

            const radius = cmsData.delivery_radius ? 
                parseInt(cmsData.delivery_radius.value) * 1000 : 150000;

            const circle = new ymaps.Circle([coords, radius], {
                balloonContent: 'Зона доставки'
            }, {
                fillColor: '#1a5f2a20',
                strokeColor: '#1a5f2a',
                strokeWidth: 2
            });

            map.geoObjects.add(circle);
        });
    }
}

window.addEventListener('load', initMap);

// ============================================
// Google Sheets Integration (Orders)
// ============================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBVV9bynvlru6bhj4zTamgc9GXQWE1s4NAeVEuScKWwaeRX1Wt5LNsZXweELWMBB7z/exec';

function submitOrder(event) {
    event.preventDefault();

    const btn = document.getElementById('submitBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading"></span> Отправка...';
    btn.disabled = true;

    const data = {
        name: document.getElementById('order-name').value,
        phone: document.getElementById('order-phone').value,
        material: document.getElementById('order-material').value,
        quantity: document.getElementById('order-quantity').value,
        address: document.getElementById('order-address').value,
        comment: document.getElementById('order-comment').value,
        timestamp: new Date().toLocaleString('ru-RU'),
        source: 'Website'
    };

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(() => {
        showSuccess();
    })
    .catch((error) => {
        console.log('Error:', error);
        showSuccess();
    })
    .finally(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

function showSuccess() {
    document.getElementById('orderFormContainer').style.display = 'none';
    document.getElementById('formSuccess').classList.add('active');
}

function resetForm() {
    document.getElementById('orderForm').reset();
    document.getElementById('orderFormContainer').style.display = 'block';
    document.getElementById('formSuccess').classList.remove('active');
}

// ============================================
// Phone Mask
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('order-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value[0] === '7' || value[0] === '8') {
                    value = value.substring(1);
                }
                let formatted = '+7';
                if (value.length > 0) formatted += ' (' + value.substring(0, 3);
                if (value.length >= 3) formatted += ') ' + value.substring(3, 6);
                if (value.length >= 6) formatted += '-' + value.substring(6, 8);
                if (value.length >= 8) formatted += '-' + value.substring(8, 10);
                e.target.value = formatted;
            }
        });
    }

    // Загружаем CMS данные при старте
    loadCMSData();
});

// ============================================
// Smooth Scroll
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
