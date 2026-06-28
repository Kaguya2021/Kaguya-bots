import 'dotenv/config';

export const config = {
    token: process.env.BOT_TOKEN,
    managerUsername: process.env.MANAGER_USERNAME || 'kaguya2_0',
    photoUrl: process.env.ORDER_PHOTO_URL || 'https://picsum.photos/600/400',
    
    // Массив категорий для удобного добавления/удаления без изменения логики
    categories: [
        { id: 'restaurant', title: '🍔 Бот для ресторана' },
        { id: 'shop', title: '🛒 Интернет-магазин' },
        { id: 'education', title: '📚 Образовательный бот' },
        { id: 'support', title: '💬 Бот поддержки' },
        { id: 'game', title: '🎮 Игровой бот' },
        { id: 'channel', title: '📢 Бот для канала' },
        { id: 'payment', title: '💳 Бот для оплаты' },
        { id: 'booking', title: '📅 Бот для записи' },
        { id: 'automation', title: '🤖 Автоматизация бизнеса' },
        { id: 'other', title: '📦 Прочее' }
    ]
};
