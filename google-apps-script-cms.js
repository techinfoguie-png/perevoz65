// ============================================
// Google Apps Script — CMS + Заявки
// ============================================
// 
// ЭТОТ СКРИПТ РАБОТАЕТ С ДВУМЯ ЛИСТАМИ:
// 1. Лист "CMS" — настройки сайта
// 2. Лист "Заявки" — заявки клиентов
//
// ============================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'order';

    if (action === 'order') {
      return saveOrder(data);
    } else if (action === 'get_cms') {
      return getCMSData();
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action || 'cms';

    if (action === 'cms') {
      return getCMSData();
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        'result': 'success',
        'message': 'API работает. Используйте ?action=cms для получения данных'
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// Сохранение заявки
// ============================================
function saveOrder(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Заявки');

  // Если лист не существует — создаём
  if (!sheet) {
    sheet = ss.insertSheet('Заявки');
    sheet.appendRow(['Дата', 'Имя', 'Телефон', 'Материал', 'Количество', 'Адрес', 'Комментарий', 'Источник']);
    // Форматируем заголовок
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#1a5f2a').setFontColor('white');
  }

  sheet.appendRow([
    data.timestamp || new Date().toLocaleString('ru-RU'),
    data.name || '',
    data.phone || '',
    data.material || '',
    data.quantity || '',
    data.address || '',
    data.comment || '',
    data.source || 'Website'
  ]);

  // Отправляем уведомление (опционально)
  // sendEmailNotification(data);

  return ContentService.createTextOutput(JSON.stringify({
    'result': 'success',
    'message': 'Заявка сохранена'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// Получение CMS данных
// ============================================
function getCMSData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CMS');

  // Если лист не существует — создаём с дефолтными значениями
  if (!sheet) {
    createDefaultCMS(ss);
    sheet = ss.getSheetByName('CMS');
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = {};

  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var value = data[i][1];
    var type = data[i][2] || 'text';

    if (key) {
      result[key] = {
        'value': value,
        'type': type
      };
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    'result': 'success',
    'data': result
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// Создание дефолтной CMS таблицы
// ============================================
function createDefaultCMS(ss) {
  var sheet = ss.insertSheet('CMS');

  var defaultData = [
    ['Ключ', 'Значение', 'Тип'],
    ['site_title', 'Грузовоз — Доставка сыпучих материалов', 'text'],
    ['meta_description', 'Доставка песка, щебня, грунта самосвалами 6 м³ по Москве и области', 'text'],
    ['phone', '+7 (999) 123-45-67', 'text'],
    ['email', 'info@gruzovoz.ru', 'text'],
    ['address', 'Москва, ул. Строителей, 15', 'text'],
    ['work_hours', 'Работаем 24/7', 'text'],
    ['color_primary', '#1a5f2a', 'color'],
    ['color_primary_dark', '#124a1f', 'color'],
    ['color_primary_light', '#2d8a42', 'color'],
    ['color_accent', '#f4a261', 'color'],
    ['hero_title', 'Доставка сыпучих материалов самосвалами 6 м³', 'text'],
    ['hero_subtitle', 'Перевозим песок, щебень, грунт и другие сыпучие материалы по Москве и области. 4 самосвала в собственном автопарке.', 'text'],
    ['cta_title', 'Готовы сделать заказ?', 'text'],
    ['cta_text', 'Позвоните прямо сейчас — рассчитаем стоимость и подадим машину в течение 2 часов', 'text'],
    ['price_pesok', '4500', 'number'],
    ['price_sheben', '5200', 'number'],
    ['price_grunt', '3800', 'number'],
    ['price_pesok_seyaniy', '4800', 'number'],
    ['price_sheben_izvestnyak', '4600', 'number'],
    ['price_torf', '5500', 'number'],
    ['price_beton', '6500', 'number'],
    ['delivery_price', '1000', 'number'],
    ['delivery_step', '10', 'number'],
    ['delivery_radius', '150', 'number'],
    ['map_coords', '55.7558, 37.6173', 'text'],
    ['whatsapp_number', '79991234567', 'text']
  ];

  sheet.getRange(1, 1, defaultData.length, 3).setValues(defaultData);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#1a5f2a').setFontColor('white');
  sheet.autoResizeColumns(1, 3);
}

// ============================================
// Email уведомление (опционально)
// ============================================
function sendEmailNotification(data) {
  try {
    var subject = 'Новая заявка с сайта Грузовоз';
    var body = 'Имя: ' + data.name + '\n' +
               'Телефон: ' + data.phone + '\n' +
               'Материал: ' + data.material + '\n' +
               'Количество: ' + data.quantity + '\n' +
               'Адрес: ' + data.address + '\n' +
               'Комментарий: ' + (data.comment || 'нет') + '\n' +
               'Дата: ' + data.timestamp;

    // Замените на ваш email
    // MailApp.sendEmail('your-email@gmail.com', subject, body);
  } catch (e) {
    console.log('Email error:', e);
  }
}
