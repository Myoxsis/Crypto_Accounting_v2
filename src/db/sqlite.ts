import { Sequelize } from 'sequelize'

let sequelize: Sequelize | null = null

export async function ensureDbReady(): Promise<Sequelize> {
  if (sequelize) return sequelize
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'crypto-accounting.db',
    logging: false,
  })
  await sequelize.authenticate()
  return sequelize
}

// Sequelize persists data automatically. This function remains for API
// compatibility with the previous sql.js implementation.
export async function saveDb(_db?: Sequelize) {
  // no-op
}

