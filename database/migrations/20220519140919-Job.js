'use strict'

module.exports = {
  up: async (QueryInterface, Sequelize) => {
    const { DataTypes } = Sequelize
    await QueryInterface.createTable('jobs', {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      jobName: { type: DataTypes.STRING, allowNull: false, field: 'job_name' },
      jobId: { type: DataTypes.INTEGER, allowNull: true, field: 'job_id' },
      jobData: { type: DataTypes.JSON, allowNull: false, field: 'job_data' },
      history: { type: DataTypes.JSON, allowNull: true, field: 'history' },
      status: { type: DataTypes.STRING, allowNull: false, field: 'status' },
      deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
      createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
      updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at' }
    })
    await QueryInterface.addIndex('jobs', { fields: ['created_at'] })
    await QueryInterface.addIndex('jobs', { fields: ['job_name', 'created_at'] })
    await QueryInterface.addIndex('jobs', { fields: ['job_name', 'job_id'] })
  },

  down: async (QueryInterface) => {
    await QueryInterface.dropTable('jobs')
  }
}
