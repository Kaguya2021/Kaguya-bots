import { Markup } from 'telegraf';
import { config } from './config.js';

export const keyboards = {
    // Главное меню (Reply Keyboard)
    mainMenu: Markup.keyboard([
        ['🤖 Создать бота'],
        ['👨‍💼 Написать менеджеру', 'ℹ️ Узнать о боте']
    ]).resize(),

    // Меню категорий (Inline Keyboard), генерируется автоматически из config.js
    categoriesMenu: () => {
        const buttons = config.categories.map(cat => 
            Markup.button.callback(cat.title, `cat_${cat.id}`)
        );
        
        // Разделяем кнопки по 2 в ряд
        const rows = [];
        for (let i = 0; i < buttons.length; i += 2) {
            rows.push(buttons.slice(i, i + 2));
        }
        
        // Добавляем кнопку Назад в самый конец
        rows.push([Markup.button.callback('⬅️ Назад в меню', 'back_to_main')]);
        
        return Markup.inlineKeyboard(rows);
    },

    // Кнопка для связи с менеджером
    managerMenu: (username) => Markup.inlineKeyboard([
        [Markup.button.url('💬 Открыть профиль', `https://t.me/${username}`)]
    ]),

    // Кнопка назад для раздела "О боте"
    backToMainInline: Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Назад', 'back_to_main')]
    ])
};
