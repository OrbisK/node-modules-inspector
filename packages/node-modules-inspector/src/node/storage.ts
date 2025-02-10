import process from 'node:process'
import { join } from 'pathe'
import { createStorage } from 'unstorage'
import driverFs from 'unstorage/drivers/fs'

export const storage = createStorage({
  driver: driverFs({
    base: join(process.cwd(), 'node_modules/.cache/node-modules-inspector'),
  }),
})
