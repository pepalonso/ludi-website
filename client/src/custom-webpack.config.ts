// @ts-expect-error - dotenv-webpack lacks type definitions
import Dotenv from 'dotenv-webpack'

module.exports = {
  plugins: [new Dotenv()],
}
