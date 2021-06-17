const sequelize = require('./db')
const {DataTypes} = require('sequelize')

const Friend = sequelize.define('friend', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    chatId: {type: DataTypes.STRING, unique: true},
    name: {type: DataTypes.STRING, defaultValue: ''},
    lastname: {type: DataTypes.STRING, defaultValue: ''},
    result: {type: DataTypes.STRING, defaultValue: ''}
})

const Chat = sequelize.define('chat', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    chatId: {type: DataTypes.STRING, unique: true}
})

module.exports = Chat
module.exports = Friend
