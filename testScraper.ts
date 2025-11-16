(async () => {
  try {
    console.log("Запуск скрейпера через API...");

    // Используем API для скрейпинга
    const response = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'RTX 4060', store: 'Citilink' }),
    });

    const result = await response.json();
    console.log("Результаты скрейпинга:");
    console.log(result);
  } catch (error) {
    console.error("Ошибка при скрапинге:", error);
  }
})();