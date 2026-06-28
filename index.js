import { Telegraf, Scenes, session, Markup } from 'telegraf';
import 'dotenv/config';
import http from 'http'; // Встроенный модуль для создания веб-сервера

// ==========================================
// 1. КОНФИГУРАЦИЯ (config)
// ==========================================
const config = {
    token: process.env.BOT_TOKEN,
    managerUsername: process.env.MANAGER_USERNAME || 'kaguya2_0',
    photoUrl: process.env.ORDER_PHOTO_URL || 'https://picsum.photos/600/400',
    adminId: process.env.ADMIN_ID,
    // Render автоматически предоставляет RENDER_EXTERNAL_URL, но если его нет, берем из APP_URL
    appUrl: process.env.RENDER_EXTERNAL_URL || process.env.APP_URL 
};

const categories = [
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
];

if (!config.token) {
    console.error('Ошибка: Токен бота (BOT_TOKEN) не задан в .env файле!');
    process.exit(1);
}

// ==========================================
// 2. СООБЩЕНИЯ (messages)
// ==========================================
const messages = {
    start: (name) => `👋 <b>Добро пожаловать, ${name}!</b>\n\nМы создаём Telegram-ботов под любые задачи.\n\nВыберите нужный пункт меню.`,
    selectCategory: '🤖 <b>Выберите категорию бота, который вас интересует:</b>',
    manager: (username) => `👨‍💼 <b>Наш менеджер</b>\n\nTelegram:\n@${username}`,
    about: `🤖 <b>Что умеет этот сервис?</b>\n\n• Создание Telegram-ботов любой сложности.\n• Красивый современный дизайн.\n• Автоматизация бизнеса.\n• Интернет-магазины.\n• Боты для ресторанов.\n• Игровые боты.\n• Система оплаты.\n• Админ-панель.\n• Поддержка после запуска.\n• Индивидуальная разработка.`,
    askDescription: (categoryTitle) => `✍️ <b>Опишите максимально подробно, какого "${categoryTitle}" вы хотите создать.</b>\n\n<i>Если вы нажали кнопку случайно, нажмите «❌ Отмена» ниже.</i>`,
    orderSuccess: (description) => `✅ <b>Спасибо!</b>\n\nВаш заказ успешно принят.\n\n💰 <b>Стоимость разработки:</b> 50 Kgs\n\n<b>Ваше описание:</b>\n<i>${description}</i>`,
    paymentInfo: `💳 <b>Для запуска разработки необходимо оплатить заказ (50 Kgs).</b>\n\nПосле оплаты отправьте чек менеджеру.\nПосле подтверждения оплаты работа начнётся.`
};

// ==========================================
// 3. КЛАВИАТУРЫ (keyboards)
// ==========================================
const keyboards = {
    mainMenu: Markup.keyboard([
        ['🤖 Создать бота'],
        ['👨‍💼 Написать менеджеру', 'ℹ️ Узнать о боте']
    ]).resize(),

    categoriesMenu: () => {
        const buttons = categories.map(cat => Markup.button.callback(cat.title, `cat_${cat.id}`));
        const rows = [];
        for (let i = 0; i < buttons.length; i += 2) {
            rows.push(buttons.slice(i, i + 2));
        }
        rows.push([Markup.button.callback('⬅️ Назад в меню', 'back_to_main')]);
        return Markup.inlineKeyboard(rows);
    },

    managerMenu: (username) => Markup.inlineKeyboard([
        [Markup.button.url('💬 Открыть профиль', `https://t.me/${username}`)]
    ]),

    backToMainInline: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Назад', 'back_to_main')]
    ]),

    cancelInline: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Отмена', 'cancel_order')]
    ])
};

// ==========================================
// 4. СЦЕНА ЗАКАЗА (scene)
// ==========================================
const orderWizard = new Scenes.WizardScene(
    'ORDER_SCENE_ID',
    async (ctx) => {
        await ctx.answerCbQuery().catch(() => {});
        const selectedCategory = ctx.scene.session.chosenCategory || 'Бот';
        await ctx.replyWithHTML(messages.askDescription(selectedCategory), keyboards.cancelInline);
        return ctx.wizard.next();
    },
    async (ctx) => {
        if (ctx.callbackQuery && ctx.callbackQuery.data === 'cancel_order') {
            await ctx.answerCbQuery('Заказ отменен').catch(() => {});
            await ctx.deleteMessage().catch(() => {});
            await ctx.replyWithHTML('❌ Оформление заказа отменено.', keyboards.mainMenu);
            return ctx.scene.leave();
        }

        if (!ctx.message || !ctx.message.text) {
            await ctx.reply('Пожалуйста, отправьте текстовое описание вашего бота или нажмите кнопку «❌ Отмена».', keyboards.cancelInline);
            return;
        }

        const userDescription = ctx.message.text;
        
        try {
            await ctx.replyWithHTML(messages.orderSuccess(userDescription));
            await ctx.replyWithPhoto(config.photoUrl, { 
                caption: messages.paymentInfo, 
                parse_mode: 'HTML',
                ...keyboards.mainMenu
            });

            if (config.adminId) {
                const username = ctx.from.username ? `@${ctx.from.username}` : 'скрыт';
                const selectedCategory = ctx.scene.session.chosenCategory || 'Не указана';
                
                const notification = `🚨 <b>НОВЫЙ ЗАКАЗ!</b>\n\n` +
                                     `👤 <b>Клиент:</b> ${ctx.from.first_name}\n` +
                                     `🆔 <b>ID клиента:</b> <code>${ctx.from.id}</code>\n` +
                                     `🔗 <b>Юзернейм:</b> ${username}\n` +
                                     `🗂 <b>Категория:</b> ${selectedCategory}\n` +
                                     `💰 <b>Сумма к оплате:</b> 50 Kgs\n\n` +
                                     `📝 <b>Описание задачи:</b>\n${userDescription}`;
                
                await ctx.telegram.sendMessage(config.adminId, notification, { parse_mode: 'HTML' });
            }

        } catch (error) {
            console.error('Ошибка при обработке заказа:', error);
            await ctx.replyWithHTML(messages.paymentInfo, keyboards.mainMenu);
        }
        return ctx.scene.leave();
    }
);

// ==========================================
// 5. ИНИЦИАЛИЗАЦИЯ И ЛОГИКА БОТА
// ==========================================
const bot = new Telegraf(config.token);

bot.use(session());
const stage = new Scenes.Stage([orderWizard]);
bot.use(stage.middleware());

bot.action('cancel_order', async (ctx) => {
    await ctx.answerCbQuery('Заказ отменен').catch(() => {});
    await ctx.scene.leave();
    await ctx.deleteMessage().catch(() => {});
    const name = ctx.from.first_name || 'Гость';
    await ctx.replyWithHTML(messages.start(name), keyboards.mainMenu);
});

bot.start(async (ctx) => {
    const name = ctx.from.first_name || 'Гость';
    await ctx.replyWithHTML(messages.start(name), keyboards.mainMenu);
});

bot.hears('🤖 Создать бота', async (ctx) => {
    await ctx.replyWithHTML(messages.selectCategory, keyboards.categoriesMenu());
});

bot.hears('👨‍💼 Написать менеджеру', async (ctx) => {
    await ctx.replyWithHTML(messages.manager(config.managerUsername), keyboards.managerMenu(config.managerUsername));
});

bot.hears('ℹ️ Узнать о боте', async (ctx) => {
    await ctx.replyWithHTML(messages.about, keyboards.backToMainInline);
});

bot.action('back_to_main', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    await ctx.deleteMessage().catch(() => {});
    const name = ctx.from.first_name || 'Гость';
    await ctx.replyWithHTML(messages.start(name), keyboards.mainMenu);
});

bot.action(/^cat_(.+)$/, async (ctx) => {
    const categoryId = ctx.match[1];
    const currentCategory = categories.find(c => c.id === categoryId);
    const title = currentCategory ? currentCategory.title : 'Категория';
    
    ctx.scene.session.chosenCategory = title;
    await ctx.answerCbQuery(`Выбрано: ${title}`).catch(() => {});
    await ctx.scene.enter('ORDER_SCENE_ID');
});

bot.catch((err, ctx) => {
    console.error(`Ошибка у пользователя ${ctx.from?.id}:`, err);
    ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.').catch(() => {});
});

// ==========================================
// 6. ВЕБ-СЕРВЕР И ПИНГОВАЛКА ДЛЯ RENDER
// ==========================================

// Создаем HTTP-сервер, чтобы Render успешно проходил проверку (Health Check)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is perfectly running!');
});

// Render сам выдает порт через переменную среды PORT, иначе запускаемся на 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 HTTP-сервер запущен на порту ${PORT} для Render Health Check`);
});

// Запускаем пинговалку каждые 10 минут
if (config.appUrl) {
    console.log(`📡 Пинговалка успешно запущена для URL: ${config.appUrl}`);
    setInterval(async () => {
        try {
            const response = await fetch(config.appUrl);
            console.log(`💓 Авто-пинг выполнен успешно. Статус: ${response.status}`);
        } catch (error) {
            console.error('❌ Ошибка авто-пингования:', error.message);
        }
    }, 10 * 60 * 1000); // 10 минут в миллисекундах
} else {
    console.log('⚠️ Внимание: APP_URL не задан в .env. Бот может уснуть на Render.');
}

// Запуск бота
bot.launch().then(() => {
    console.log('🚀 Бот полностью готов и запущен!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

