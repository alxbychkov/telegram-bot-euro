const sequelize = require('../db')
const {DataTypes} = require('sequelize')

const Chat = sequelize.define('chat', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    chatId: {type: DataTypes.STRING, unique: true}
})

module.exports = Chat