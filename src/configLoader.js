import * as fs from 'fs'

const config_text = fs.readFileSync('./config.json', 'utf8')
export const config = JSON.parse(config_text)