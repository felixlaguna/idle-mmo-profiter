// Core data entities

export interface Material {
  id: string
  name: string
  price: number
}

export interface Potion {
  id: string
  name: string
  price: number
}

export interface Resource {
  id: string
  name: string
  marketPrice: number
}

export interface Recipe {
  id: string
  name: string
  price: number
  chance: number
  value?: number
}

export interface DungeonDrop {
  recipeName: string
  expectedValue: number
}

export interface Dungeon {
  name: string
  runCost: number
  timeSeconds: number
  numDrops: number
  drops: DungeonDrop[]
}

export interface PotionMaterial {
  name: string
  quantity: number
  unitCost: number
}

export interface PotionCraft {
  name: string
  timeSeconds: number
  materials: PotionMaterial[]
  vialCost: number
  currentPrice: number
}

export interface ResourceGather {
  name: string
  timeSeconds: number
  cost: number
  vendorValue: number
  marketPrice: number
}

// Settings and configuration

export interface MagicFindSettings {
  streak: number
  dungeon: number
  item: number
  bonus: number
}

export interface AppSettings {
  apiKey: string | null
  marketTaxRate: number
  magicFind: MagicFindSettings
}

// Results and calculations

export type ActivityType = 'dungeon' | 'potion' | 'resource'

export interface ProfitResult {
  activityName: string
  type: ActivityType
  profitPerHour: number
  profitPerAction: number
  timePerAction: number
  cost: number
}

// Default data structure (matches defaults.json)

export interface DefaultData {
  materials: Material[]
  potions: Potion[]
  resources: Resource[]
  recipes: Recipe[]
  dungeons: Dungeon[]
  potionCrafts: PotionCraft[]
  resourceGathering: ResourceGather[]
  magicFindDefaults: MagicFindSettings
  marketTaxRate: number
}
