const token = '1846537727:AAHNwxSLUUXmOghPaOuaVEwotlOXiUbke8g'
const telegramApi = require('node-telegram-bot-api')
const {todayGames} = require('./core/data')
const bot = new telegramApi(token, {polling: true})

const startGameOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Гоу \u26bd\ufe0f', callback_data: 'go'},{text: 'Сольюсь.. \ud83c\udf44', callback_data: 'out'}]
        ]
    })
}

bot.setMyCommands([
    {command: '/start', description: 'Начало'},
    {command: '/game', description: 'Играть'},
    {command: '/stats', description: 'Статистика'}
])

bot.on('message', async msg => {
    const chatId = msg.chat.id
    const text = msg.text
    const name = msg.from.first_name
    if (text === '/start') {
        await bot.sendMessage(chatId, `Спасибо что зашел, ${name}! Мы тут решили немного поиграть. \ud83d\udca3`)
    }
    if (text === '/game') {
        await bot.sendMessage(chatId, `Хорошо, давай поиграем. Ты готов начать?`, startGameOptions)
    }
    console.log(msg.text) 
})

bot.on('callback_query', async msg => {
    const data = msg.data
    const chatId = msg.message.chat.id
    if (data === 'out') {
        return bot.sendMessage(chatId, `Ну ок. Без пивка значит. \ud83d\ude15`)
    }
    if (data === 'go') {
        await bot.sendMessage(chatId, `Отлично. Погнали! \ud83c\udfc3\ud83c\udffb`)
        showMatches(chatId)   
    }
    if (typeof +data === 'number') {
        await bot.sendMessage(chatId, `Ты выбрал матч ${todayGames.find(el => el.id === +data).game}. Напиши как он по твоему закончиться?`)
    }
})


async function showMatches(chatId) {
    const now = new Date()
    const games = 2
    const match = (games === 1) ? 'матч' : 'матча'
    const gameOptions = {reply_markup: ''}

    if (games === 0) {
        return bot.sendMessage(chatId, `Сегодня матчей нет! Приходи завтра.`)
    }
    if (games > 0) {
        let dayGames = {inline_keyboard: []}
        for(let i=0; i<games; i++) {
            dayGames.inline_keyboard.push([{text: todayGames[i].game, callback_data: todayGames[i].id}])
        }
        gameOptions.reply_markup = JSON.stringify(dayGames)

        await bot.sendMessage(chatId, `Сегодня ${now.toLocaleDateString()}. И в программне ${games} ${match}. На кого будешь ставить?`, gameOptions)

    }
}
