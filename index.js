const telegramApi = require('node-telegram-bot-api')
const { botOptions, botCommands, startGameOptions } = require('./core/options')
const { token, todayGames } = require('./core/data')
const sequelize = require('./core/db')
const FriendModel = require('./core/models/friends')
const ChatModel = require('./core/models/chat')

const bot = new telegramApi(token, botOptions)
bot.setMyCommands(botCommands)

let chats = {}
let chatsGames = {}
const init = async () => {
    try {
        sequelize.authenticate()
        sequelize.sync()
    } catch (e) {
        console.log('Подключение к бд сломалось.', e)
    }

    await ChatModel.findAll().then(res => {
        if (res) res.map(async (i) => {
            const chatId = i.get("chatId")
            const result = await FriendModel.findOne({ chatId, where: { chatId } })
            result.result ? chats[chatId] = JSON.parse(result.get("result")) : chats[chatId] = {}
        })
    })



    bot.on('message', async msg => {
        const chatId = msg.chat.id
        const text = msg.text
        const name = msg.from.first_name
        const lastname = msg.from.last_name
        try {
            if (text === '/start') {
                await FriendModel.findOne({ chatId, where: { chatId } }).then(user => {
                    if (!user) {
                        FriendModel.create({ chatId, name, lastname })
                        ChatModel.create({ chatId })
                    }
                })
                await bot.sendMessage(chatId, `Спасибо что зашел, ${name}! Мы тут решили немного поиграть. \ud83d\udca3`)
                await bot.sendMessage(chatId, `Чтобы посмотреть команды, нажми "/" в строке ввода.`)
                await bot.sendMessage(chatId, `Или введи сам /game - начать`)
                await bot.sendMessage(chatId, `Или введи сам /stats - статистика`)
            }
            if (text === '/game') {
                await bot.sendMessage(chatId, `Хорошо, давай поиграем. Ты готов начать?`, startGameOptions)
            }
            if (text === '/stats') {
                const user = await FriendModel.findOne({ chatId, where: { chatId } })
                const userRes = JSON.parse(user.result)
                const message = showResults(userRes)
                await bot.sendMessage(chatId, message)
                const table = await showFinalTable()
                await bot.sendMessage(chatId, table)
            }
            if (text[0] === '%' && chatsGames[chatId]) {
                const user = await FriendModel.findOne({ chatId, where: { chatId } })

                chats[chatId][chatsGames[chatId]] = text.split('%')[1]

                user.result = JSON.stringify(chats[chatId])
                await user.save()
                await bot.sendMessage(chatId, `Ставка принята!`)
            }
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

            if (chats[chatId][id] !== '' && chats[chatId][id] !== undefined) return bot.sendMessage(chatId, `Ты уже поставил на этот матч ${chats[chatId][id]}. Отдыхай =)`)

            if (chats[chatId]) {
                chatsGames[chatId] = id
                chats[chatId][id] = ''
            }

            await bot.sendMessage(chatId, `Ты выбрал матч ${game}. Напиши как он по твоему закончиться? (Напиши счет начиная с %. пример: %1-1)`)
        }
    })
}

init()

async function showMatches(chatId) {
    const now = new Date()
    let games = 3

    if (todayGames.filter(el => el.date === now.toLocaleDateString()))
        games = todayGames.filter(el => el.date === now.toLocaleDateString()).length
    const match = (games === 1) ? 'матч' : 'матча'
    const gameOptions = { reply_markup: '' }

    if (games === 0) {
        return bot.sendMessage(chatId, `Сегодня матчей нет! Приходи завтра.`)
    }
    if (games > 0) {
        let dayGames = { inline_keyboard: [] }
        for (let i = 0; i < games; i++) {
            dayGames.inline_keyboard.push([{ text: todayGames.filter(el => el.date === now.toLocaleDateString())[i].game, callback_data: todayGames.filter(el => el.date === now.toLocaleDateString())[i].id }])
        }
        gameOptions.reply_markup = JSON.stringify(dayGames)
        await bot.sendMessage(chatId, `Сегодня ${now.toLocaleDateString()}. И в программне ${games} ${match}. На кого будешь ставить?`, gameOptions)
    }
}

function showResults(result) {
    let msg = 'Твои ставки:\n\n'
    let score = 0
    if (typeof result === 'object') {
        Object.keys(result).forEach(key => {
            const game = todayGames.filter(g => g.id == key)
            msg += `${game[0].game}: ${result[key]}\n`
            if (result[key] === game[0].result) score++
        })
        msg += `\nТвои баллы: ${score}`
        return msg
    }
    return false
}

async function showFinalTable() {
    let msg = 'Таблица:\n\n'
    const users = await FriendModel.findAll().then(res => result = JSON.parse(JSON.stringify(res)))
    let obj = []

    users.forEach(user => {
        const name = `${user.name} ${user.lastname}`
        const userRes = user.result ? JSON.parse(user.result) : {}
        let score = 0

        if (typeof userRes === 'object') {
            Object.keys(userRes).forEach(key => {
                const game = todayGames.filter(g => g.id == key)
                if (userRes[key] === game[0].result) score++
            })
            obj.push({id: score, name})
        }
    })

    obj.sort((a,b) => b.id - a.id).forEach(el => msg += `${el.name} - ${el.id}\n`)
    return msg
}
