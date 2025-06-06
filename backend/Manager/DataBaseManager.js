const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.connections = new Map();
        this.models = new Map();
    }

    // 获取或创建数据库连接
    async getConnection(connectionId) {
        if (this.connections.has(connectionId)) {
            return this.connections.get(connectionId);
        }

        // 确保数据库目录存在
        const dbDir = path.join(__dirname, '../databases');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // 创建新的数据库连接
        const sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: path.join(dbDir, `${connectionId}.db`),
            logging: false
        });

        // 定义模型
        const models = this.defineModels(sequelize);
        
        // 同步数据库
        await sequelize.sync();

        // 存储连接和模型
        this.connections.set(connectionId, sequelize);
        this.models.set(connectionId, models);

        return sequelize;
    }

    // 定义模型
    defineModels(sequelize) {
        const models = {
            VideoListInfo: sequelize.define('VideoListInfo', {
                title: {
                    type: DataTypes.STRING(100),
                    primaryKey: true
                },
                description: {
                    type: DataTypes.STRING(200)
                }
            }),
            AuthInfo: sequelize.define('AuthInfo', {
                open_id: {
                    type: DataTypes.STRING(100),
                    primaryKey: true
                },
                code: {
                    type: DataTypes.STRING(100)
                },
                accessToken: {
                    type: DataTypes.STRING(100)
                }
            }),
            ConversationInfo: sequelize.define('ConversationInfo', {
                conversation_id: {
                    type: DataTypes.STRING(200),
                    primaryKey: true
                },
                conversation: {
                    type: DataTypes.STRING(200)
                }
            }),

            AnalysisResult: sequelize.define('AnalysisResult', {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                conversation_id: {
                    type: DataTypes.STRING(200),
                    allowNull: false
                },
                nicknames: {
                    type: DataTypes.TEXT
                },
                contacts: {
                    type: DataTypes.TEXT
                },
                analyzed_at: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW
                }
            })
        };

        return models;
    }

    // 获取特定连接的模型
    async getModels(connectionId) {
        if (!this.models.has(connectionId)) {
            await this.getConnection(connectionId);
        }
        return this.models.get(connectionId);
    }

    // 关闭特定连接
    async closeConnection(connectionId) {
        if (this.connections.has(connectionId)) {
            await this.connections.get(connectionId).close();
            this.connections.delete(connectionId);
            this.models.delete(connectionId);
        }
    }

    // 关闭所有连接
    async closeAllConnections() {
        for (const [connectionId, sequelize] of this.connections) {
            await sequelize.close();
        }
        this.connections.clear();
        this.models.clear();
    }
}

// 创建单例实例
const dbManager = new DatabaseManager();
module.exports = dbManager;