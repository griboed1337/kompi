import { scrapeCitilink, scrapeCitilinkCategory, createScraper } from './scraper';

// Тестовые функции
async function testScraper() {
  console.log('🚀 Начинаем тестирование скрейпера с headless браузером...\n');

  try {
    // Тест 1: Скрейпинг с использованием браузера
    console.log('📋 Тест 1: Поиск видеокарт на Citilink через браузер');
    const browserResult = await scrapeCitilink('RTX 4060', {
      debug: true,
      useBrowser: true, // Включаем браузер
      delay: 5000,
      timeout: 60000,
      browserOptions: {
        headless: false, // Видимый браузер для отладки
        args: ['--window-size=1366,768', '--disable-web-security', '--disable-features=VizDisplayCompositor']
      }
    });

    console.log(`Результат браузера: ${browserResult.success ? '✅ Успешно' : '❌ Ошибка'}`);
    console.log(`Найдено продуктов: ${browserResult.totalFound}`);

    if (browserResult.products.length > 0) {
      console.log('\n📦 Первые 3 найденных продукта через браузер:');
      browserResult.products.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   💰 Цена: ${product.price}`);
        console.log(`   🔗 Ссылка: ${product.link}`);
        console.log(`   🏪 Магазин: ${product.store}`);
        if (product.image) console.log(`   🖼️ Изображение: ${product.image}`);
        console.log('');
      });
    }

    if (browserResult.error) {
      console.log(`❌ Ошибка браузера: ${browserResult.error}`);
    }

    // Тест 2: Сравнение с HTTP методом
    console.log('\n📋 Тест 2: Сравнение - тот же запрос через HTTP');
    const httpResult = await scrapeCitilink('RTX 4060', {
      debug: true,
      useBrowser: false, // HTTP метод
      delay: 2000,
      rotateUserAgent: true,
      timeout: 20000
    });

    console.log(`Результат HTTP: ${httpResult.success ? '✅ Успешно' : '❌ Ошибка'}`);
    console.log(`Найдено продуктов через HTTP: ${httpResult.totalFound}`);

    if (httpResult.error) {
      console.log(`❌ Ошибка HTTP: ${httpResult.error}`);
    }

    // Тест 3: Браузер с прокси (пример конфигурации)
    console.log('\n📋 Тест 3: Пример браузера с прокси');
    console.log('⚠️  Для использования прокси добавьте реальный прокси-сервер:');
    console.log(`
    const browserWithProxyResult = await scrapeCitilink('RTX 4060', {
      debug: true,
      useBrowser: true,
      proxy: {
        host: 'proxy.example.com',
        port: 8080,
        protocol: 'http',
        auth: {
          username: 'your-username',
          password: 'your-password'
        }
      },
      delay: 5000,
      timeout: 60000,
      browserOptions: {
        headless: true,
        args: ['--proxy-server=http://proxy.example.com:8080']
      }
    });
    `);

    // Тест 4: Проверка гибридного подхода
    console.log('\n📋 Тест 4: Гибридный скрейпер');
    const hybridScraper = createScraper({
      debug: true,
      useBrowser: true,
      delay: 2000,
      rotateUserAgent: true,
      timeout: 40000,
      browserOptions: {
        headless: true
      }
    });
    console.log('✅ Гибридный скрейпер создан успешно');

    // Тест 5: Сравнение результатов
    console.log('\n📋 Тест 5: Сравнение результатов');
    console.log(`Браузер: ${browserResult.totalFound} продуктов`);
    console.log(`HTTP: ${httpResult.totalFound} продуктов`);

    if (browserResult.totalFound > httpResult.totalFound) {
      console.log('🎉 Браузер показал лучшие результаты!');
    } else if (browserResult.totalFound === httpResult.totalFound) {
      console.log('⚖️  Результаты одинаковые');
    } else {
      console.log('📉 HTTP метод показал лучшие результаты');
    }

    console.log('\n🎉 Тестирование завершено!');
    console.log('\n💡 Советы по использованию скрейпера для Citilink:');
    console.log('• Браузер лучше обходит защиты, но медленнее');
    console.log('• Используйте прокси для анонимности');
    console.log('• Увеличивайте таймауты для браузера (30-60 сек)');
    console.log('• Настройте viewport для реалистичного поведения');
    console.log('• Добавьте прокрутку страницы для загрузки контента');

  } catch (error) {
    console.error('💥 Критическая ошибка при тестировании:', error);
  }
}

// Асинхронный IIFE для запуска теста
(async () => {
  await testScraper();
})();

// Экспорт для использования в других файлах
export { testScraper };