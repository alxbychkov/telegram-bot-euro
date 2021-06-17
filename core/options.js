module.exports = {
    startGameOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Гоу \u26bd\ufe0f', callback_data: 'go'},{text: 'Сольюсь.. \ud83c\udf44', callback_data: 'out'}]
            ]
        })
    },
    botCommands : [
        {command: '/start', description: 'Начало'},
        {command: '/game', description: 'Играть'},
        {command: '/stats', description: 'Статистика'}
    ],
    botOptions: {polling: true}
}