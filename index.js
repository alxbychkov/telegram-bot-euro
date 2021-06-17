const telegramApi = require('node-telegram-bot-api')
const {botOptions, botCommands, startGameOptions} = require('./core/options')
const {token, todayGames} = require('./core/data')
const sequelize = require('./core/db')
const FriendModel = require('./core/models/friends')
const ChatModel = require('./core/models/chat')

const bot = new telegramApi(token, botOptions)
bot.setMyCommands(botCommands)

let chats = {}
let chatGames = {}

const init = async () => {
    try {
        sequelize.authenticate()
        sequelize.sync()
    } catch (e) {
        console.log('Пдключение к бд сломалось.', e)
    }

    await ChatModel.findAll().then(res => {
        if (res) res.map(i => chats[i.get("chatId")] = {})
    })

    bot.on('message', async msg => {
        const chatId = msg.chat.id
        const text = msg.text
        const name = msg.from.first_name
        const lastname = msg.from.last_name
        try {
            if (text === '/start') {
                await FriendModel.findOne({chatId,name,where: {}}).then(user => {
                    if (!user) {
                        FriendModel.create({chatId,name,lastname})
                        ChatModel.create({chatId})
                    }
                })
                await bot.sendMessage(chatId, `Спасибо что зашел, ${name}! Мы тут решили немного поиграть. \ud83d\udca3`)
            }
            if (text === '/game') {
                await bot.sendMessage(chatId, `Хорошо, давай поиграем. Ты готов начать?`, startGameOptions)
            }
            if (text === '/stats') {
                const user = await FriendModel.findOne({chatId,name, where: {}})
                const userRes = JSON.parse(user.result)
                console.log(userRes[0].id) 
                await bot.sendMessage(chatId, `Тут скоро будет статистика. Потерпи, ${user.name}.`)
            }
            if (text === '1-1' && chatsGames[chatId]) {
                const user = await FriendModel.findOne({chatId,name, where: {}})
                // chats[chatId] = JSON.stringify([{id:gameId,match:text}])
                chats[chatId][chatsGames[chatId]] = text
                // user.result = result
                // await user.save()
            }
            console.log(chats)
        } catch (e) {
            return bot.sendMessage(chatId, `Извини, что то пошло не так.. ${e}`)
        }
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
        if (typeof +data === 'number' && +data) {
            const game = todayGames.find(el => el.id === +data).game
            const id = todayGames.find(el => el.id === +data).id

            if (chats[chatId]) {
                chatsGames[chatId] = id
                chats[chatId][id] = ''
            }

            // if (chats[chatId]) 
            //     chats[chatId].push({
            //         id: todayGames.find(el => el.id === +data).id,
            //         match: ''
            //     })
            // else {
            //     chats[chatId] = [{
            //         id: todayGames.find(el => el.id === +data).id,
            //         match: ''
            //     }]
            // }

            await bot.sendMessage(chatId, `Ты выбрал матч ${game}. Напиши как он по твоему закончиться?`)
        }
    })
}

init()

async function showMatches(chatId) {
    const now = new Date()
    const games = 3
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
