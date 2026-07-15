export const CUISINES = [
  '🍱 Korean & Japanese',
  '🍜 Thai & SE Asian',
  '🥢 Chinese & Taiwanese',
  '🍔 American',
  '🍕 Pizza & Italian',
  '🥙 Mediterranean & Middle Eastern',
  '🍦 Dessert',
  '🍸 Bars',
  '🌮 Mexican & Latin',
  '🥐 Bakery',
  '🧋 Boba & Tea',
  '☕ Coffee',
  '🍛 Indian & Himalayan',
  '🍽️ Other',
]

export const DEFAULT_CITY = 'New York'

export const LSK_DATA = 'pv_local_data'
export const LSK_CFG = 'pv_gh_cfg'
export const LSK_THEME = 'pv_theme'

// Fixed hue per cuisine so a cuisine keeps its color everywhere
// (badges, chips) no matter what is filtered. Unknown cuisines get
// a hashed hue from cuisineHue() in utils.js.
export const CUISINE_HUES = {
  '🍱 Korean & Japanese': 348,
  '🍜 Thai & SE Asian': 22,
  '🥢 Chinese & Taiwanese': 2,
  '🍔 American': 214,
  '🍕 Pizza & Italian': 122,
  '🥙 Mediterranean & Middle Eastern': 168,
  '🍦 Dessert': 322,
  '🍸 Bars': 262,
  '🌮 Mexican & Latin': 55,
  '🥐 Bakery': 32,
  '🧋 Boba & Tea': 286,
  '☕ Coffee': 15,
  '🍛 Indian & Himalayan': 42,
  '🍽️ Other': 200,
}
