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
// Which completed places this editor has already seen the reveal for, so the
// first rater gets the animation when they return — but the pairs already
// complete before the feature shipped never retro-fire. Suffixed per editor.
export const LSK_SEEN = 'pv_seen_reveals'
// The per-cuisine hue palette that used to tint badges and chips is gone with
// the Classical redesign: the system is mono-accent and draws with stroke, not
// fill, so a cuisine is identified by its emoji and name alone.
