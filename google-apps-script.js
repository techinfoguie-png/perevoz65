// ============================================
// Google Apps Script для сбора заявок
// ============================================
// 
// Инструкция:
// 1. Откройте Google Sheet
// 2. Перейдите в Расширения → Apps Script
// 3. Удалите весь существующий код
// 4. Вставьте этот код
// 5. Сохраните (Ctrl+S)
// 6. Разверните как Веб-приложение
// 7. Скопируйте URL и вставьте в main.js
//
// Заголовки таблицы (первая строка):
// Дата | Имя | Телефон | Материал | Количество | Адрес | Комментарий | Источник
//
// ============================================

function doPost(e) {
  try {
    // Получаем данные из POST запроса
    var data = JSON.parse(e.postData.contents);

    // Открываем активную таблицу
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Добавляем строку с данными
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

    // Отправляем уведомление на email (опционально)
    // sendNotification(data);

    // Возвращаем успешный ответ
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'message': 'Заявка успешно сохранена'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Возвращаем ошибку
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// GET запрос для проверки работоспособности
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    'result': 'success',
    'message': 'API работает корректно',
    'timestamp': new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Опционально: отправка уведомления на email
function sendNotification(data) {
  var subject = 'Новая заявка с сайта Грузовоз';
  var body = 'Имя: ' + data.name + '\n' +
             'Телефон: ' + data.phone + '\n' +
             'Материал: ' + data.material + '\n' +
             'Количество: ' + data.quantity + '\n' +
             'Адрес: ' + data.address + '\n' +
             'Комментарий: ' + (data.comment || 'нет') + '\n' +
             'Дата: ' + data.timestamp;

  // Замените на ваш email
  // MailApp.sendEmail('your-email@example.com', subject, body);
}
