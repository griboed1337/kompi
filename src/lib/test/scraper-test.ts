import { DnsScraper } from '@/lib/scrapers/dns-scraper';
import { PriceAggregationService } from '@/lib/services/price-aggregation';
import { ComponentCategory } from '@/types/component';

async function testDnsScraper() {
  console.log('🧪 Тестирование DNS Shop скрейпера...');
  
  const scraper = new DnsScraper();
  
  try {
    // Тестируем скрейпинг процессоров
    const result = await scraper.scrapeComponents({
      category: 'cpu',
      maxPages: 1,
      maxResults: 5
    });

    console.log('\n📊 Результаты скрейпинга DNS Shop:');
    console.log(`- Источник: ${result.source}`);
    console.log(`- Найдено компонентов: ${result.components.length}`);
    console.log(`- Ошибок: ${result.errors?.length || 0}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Ошибки:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (result.components.length > 0) {
      console.log('\n✅ Примеры найденных компонентов:');
      result.components.slice(0, 3).forEach((component, index) => {
        console.log(`\n  ${index + 1}. ${component.name}`);
        console.log(`     Бренд: ${component.brand}`);
        console.log(`     Категория: ${component.category}`);
        if (component.prices.length > 0) {
          console.log(`     Цена: ${component.prices[0].value} ${component.prices[0].currency}`);
          console.log(`     Наличие: ${component.prices[0].availability}`);
        }
      });
    }

    return result.components.length > 0;
    
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании DNS скрейпера:', error);
    return false;
  }
}

async function testPriceAggregation() {
  console.log('\n🔄 Тестирование сервиса агрегации цен...');
  
  const service = new PriceAggregationService();
  
  try {
    const results = await service.aggregatePrices({
      categories: ['cpu'],
      maxResults: 5
    });

    console.log('\n📈 Результаты агрегации цен:');
    console.log(`- Обработано категорий: ${results.length}`);
    
    results.forEach((result, index) => {
      console.log(`\n  Категория ${index + 1}: ${result.category}`);
      console.log(`  - Найдено: ${result.totalFound} компонентов`);
      console.log(`  - Показано: ${result.results.length} результатов`);
      console.log(`  - Источники: ${result.sources.join(', ')}`);
      
      if (result.results.length > 0) {
        console.log('  - Лучшие предложения:');
        result.results.slice(0, 2).forEach((item, idx) => {
          console.log(`    ${idx + 1}. ${item.component.name}`);
          console.log(`       Лучшая цена: ${item.lowestPrice.value} ${item.lowestPrice.currency}`);
          console.log(`       Средняя цена: ${item.averagePrice} ${item.lowestPrice.currency}`);
          console.log(`       Ритейлеры: ${item.availableRetailers.join(', ')}`);
        });
      }
    });

    return results.length > 0 && results[0].results.length > 0;
    
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании агрегации цен:', error);
    return false;
  }
}

async function testAPIs() {
  console.log('\n🌐 Тестирование API endpoints...');
  
  try {
    // Тестируем простое API
    console.log('\nТестирование /api/scrape...');
    const scrapeResponse = await fetch('http://localhost:3000/api/scrape?category=cpu&maxResults=3');
    
    if (scrapeResponse.ok) {
      const scrapeData = await scrapeResponse.json();
      console.log('✅ /api/scrape работает');
      console.log(`   Найдено компонентов: ${scrapeData.meta?.totalComponents || 0}`);
    } else {
      console.log('❌ /api/scrape не работает:', scrapeResponse.status);
    }

    // Тестируем API агрегации
    console.log('\nТестирование /api/prices...');
    const pricesResponse = await fetch('http://localhost:3000/api/prices?categories=["cpu"]&maxResults=3');
    
    if (pricesResponse.ok) {
      const pricesData = await pricesResponse.json();
      console.log('✅ /api/prices работает');
      console.log(`   Обработано категорий: ${pricesData.meta?.categoriesProcessed || 0}`);
    } else {
      console.log('❌ /api/prices не работает:', pricesResponse.status);
    }

    return true;
    
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании API:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Запуск тестирования системы веб-скрейпинга RigMaster\n');
  console.log('=' .repeat(60));
  
  const testResults = {
    dnsScraper: false,
    priceAggregation: false,
    apis: false
  };

  // Тест 1: DNS Scraper
  testResults.dnsScraper = await testDnsScraper();
  
  // Тест 2: Price Aggregation
  testResults.priceAggregation = await testPriceAggregation();
  
  // Тест 3: API Endpoints (только если сервер запущен)
  testResults.apis = await testAPIs();

  // Итоговый отчет
  console.log('\n' + '=' .repeat(60));
  console.log('📋 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ');
  console.log('=' .repeat(60));
  
  Object.entries(testResults).forEach(([testName, passed]) => {
    const status = passed ? '✅ ПРОЙДЕН' : '❌ НЕ ПРОЙДЕН';
    const description = {
      dnsScraper: 'DNS Shop скрейпер',
      priceAggregation: 'Сервис агрегации цен', 
      apis: 'API endpoints'
    }[testName] || testName;
    
    console.log(`${status} - ${description}`);
  });

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log(`\n🎯 Результат: ${passedTests}/${totalTests} тестов пройдено`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Все тесты успешно пройдены! Система готова к использованию.');
  } else {
    console.log('⚠️  Некоторые тесты не пройдены. Проверьте конфигурацию и подключение к интернету.');
  }
}

// Экспортируем функции для использования
export {
  testDnsScraper,
  testPriceAggregation,
  testAPIs,
  runAllTests
};

// Если файл запускается напрямую
if (require.main === module) {
  runAllTests().catch(console.error);
}