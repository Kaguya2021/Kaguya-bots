import { Scenes } from 'telegraf';
import { messages } from '../messages.js';
import { keyboards } from '../keyboards.js';
import { config } from '../config.js';

// Создаем Wizard-сцену для пошагового сбора данных
export const orderWizard = new Scenes.WizardScene(
    'ORDER_SCENE_ID',
    // Шаг 1: Просим ввести описание
    async (ctx) => {
        await ctx.answerCbQuery().catch(() => {});
        await ctx.replyWithHTML(messages.askDescription);
        return ctx.wizard.next(); // Переходим к следующему шагу
    },
    // Шаг 2: Получаем описание и завершаем сцену
    async (ctx) => {
        // Проверяем, что пользователь отправил именно текст
        if (!ctx.message || !ctx.message.text) {
            await ctx.reply('Пожалуйста, отправьте текстовое описание вашего бота.');
            return; // Не вызываем next(), ждем корректный ввод
        }

        const userDescription = ctx.message.text;

        try {
            // 1. Благодарим и показываем описание
            await ctx.replyWithHTML(messages.orderSuccess(userDescription));

            // 2. Отправляем фото с информацией об оплате
            await ctx.replyWithPhoto(
                config.photoUrl, 
                { 
                    caption: messages.paymentInfo, 
                    parse_mode: 'HTML',
                    ...keyboards.mainMenu // Возвращаем главное меню
                }
            );
        } catch (error) {
            console.error('Ошибка при отправке фото/сообщения в сцене:', error);
            await ctx.replyWithHTML(messages.paymentInfo, keyboards.mainMenu);
        }

        return ctx.scene.leave(); // Выходим из сцены
    }
);
