/**
 * Add hashedId and vendorValue fields to defaults.json
 *
 * This is a one-time script to update the data structure.
 * Run with: node scripts/add-market-fields.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const defaultsPath = path.join(__dirname, '../src/data/defaults.json')

// Read the current defaults.json
const data = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'))

// Add hashedId and vendorValue to materials
data.materials = data.materials.map(item => ({
  ...item,
  hashedId: item.hashedId || '',
  vendorValue: item.vendorValue || 0
}))

// Add hashedId and vendorValue to potions
data.potions = data.potions.map(item => ({
  ...item,
  hashedId: item.hashedId || '',
  vendorValue: item.vendorValue || 0
}))

// Add hashedId to resources (they already have vendorValue)
data.resources = data.resources.map(item => ({
  ...item,
  hashedId: item.hashedId || ''
}))

// Add hashedId and vendorValue to recipes
data.recipes = data.recipes.map(item => ({
  ...item,
  hashedId: item.hashedId || '',
  vendorValue: item.vendorValue || 0
}))

// Write back to defaults.json with pretty formatting
fs.writeFileSync(defaultsPath, JSON.stringify(data, null, 2) + '\n', 'utf8')

console.log('✓ Updated defaults.json')
console.log(`  Materials: ${data.materials.length} items`)
console.log(`  Potions: ${data.potions.length} items`)
console.log(`  Resources: ${data.resources.length} items`)
console.log(`  Recipes: ${data.recipes.length} items`)
console.log('\nAll items now have hashedId and vendorValue fields.')
