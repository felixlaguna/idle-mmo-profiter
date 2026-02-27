#!/usr/bin/env node

/**
 * Script to link recipes to the potions they produce
 *
 * This script populates the producesItemName field for recipes based on naming patterns.
 * For example:
 * - "Frenzy Potion Recipe" → produces "Frenzy"
 * - "Gourmet Essence Recipe" → produces "Gourmet"
 * - "Wraithbane Essence Recipe (Untradable)" → produces "Wraithbane"
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultsPath = path.join(__dirname, '../src/data/defaults.json')

// Read the defaults.json
const data = JSON.parse(fs.readFileSync(defaultsPath, 'utf-8'))

// Create a set of potion names for quick lookup
const potionNames = new Set(data.potionCrafts.map(p => p.name))

// Mapping patterns for recipe names to potion names
// Format: recipe name pattern -> potion name extraction
const recipePatterns = [
  // Direct pattern: "Potion Name Recipe" or "Potion Name Recipe (Untradable)"
  {
    pattern: /^(.+?) Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
  // "Potion Name Potion Recipe"
  {
    pattern: /^(.+?) Potion Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
  // "Potion Name Essence Recipe"
  {
    pattern: /^(.+?) Essence Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
  // "Potion Name Brew Recipe"
  {
    pattern: /^(.+?) Brew Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
  // "Potion Name Tear Recipe"
  {
    pattern: /^(.+?) Tear Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
  // "Potion Name Nectar Recipe"
  {
    pattern: /^(.+?) Nectar Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
  // "Potion Name Barrier Recipe"
  {
    pattern: /^(.+?) Barrier Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
  // "Potion Name Tonic Recipe"
  {
    pattern: /^(.+?) Tonic Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
  // "Potion Name Elixir Recipe"
  {
    pattern: /^(.+?) Elixir Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
  // "Potion Name Infusion Recipe"
  {
    pattern: /^(.+?) Infusion Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
  // "Potion Name Solution Recipe"
  {
    pattern: /^(.+?) Solution Recipe( \(Untradable\))?$/,
    extract: (match) => match[1]
  },
]

// Track statistics
let linkedCount = 0
let notLinkedCount = 0

// Update recipes
data.recipes = data.recipes.map(recipe => {
  const updated = { ...recipe }

  // Try each pattern
  for (const { pattern, extract } of recipePatterns) {
    const match = recipe.name.match(pattern)
    if (match) {
      const potionName = extract(match)

      // Check if this potion exists in potionCrafts
      if (potionNames.has(potionName)) {
        updated.producesItemName = potionName
        linkedCount++
        return updated
      }
    }
  }

  // No match found
  notLinkedCount++
  return updated
})

// Write back to defaults.json
fs.writeFileSync(defaultsPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')

console.log('✓ Linked recipes to potions')
console.log(`✓ Linked ${linkedCount} recipes to known potions`)
console.log(`✓ ${notLinkedCount} recipes not linked (potion not in potionCrafts or not a potion recipe)`)

// Show which recipes were linked
const linkedRecipes = data.recipes.filter(r => r.producesItemName)
if (linkedRecipes.length > 0) {
  console.log('\nLinked recipes:')
  linkedRecipes.forEach(r => {
    console.log(`  - ${r.name} → ${r.producesItemName}`)
  })
}
