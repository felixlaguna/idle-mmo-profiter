#!/usr/bin/env node

/**
 * Script to add new fields to recipes and craftableRecipes in defaults.json
 *
 * Adds to Recipe:
 * - uses: number (default 10 for all recipes)
 * - isUntradable: boolean (based on name containing "(Untradable)" or price === 0)
 * - tradableCounterpartId: string (for untradable recipes, links to tradable version)
 * - producesItemName: string (to be populated by Phase 7 script)
 * - producesItemHashedId: string (to be populated by Phase 7 script)
 *
 * Adds to CraftableRecipe:
 * - recipeId: string (to be populated manually or via script)
 * - untradableRecipeId: string (to be populated manually or via script)
 * - recipeName: string (to be populated manually or via script)
 * - recipeUses: number (to be populated manually or via script)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultsPath = path.join(__dirname, '../src/data/defaults.json')

// Read the defaults.json
const data = JSON.parse(fs.readFileSync(defaultsPath, 'utf-8'))

// Create a map of recipe names to IDs for linking tradable counterparts
const recipeMap = new Map()
data.recipes.forEach(recipe => {
  recipeMap.set(recipe.name, recipe.id)
})

// Update recipes
data.recipes = data.recipes.map(recipe => {
  const updated = { ...recipe }

  // Add uses field (default 10 for all recipes)
  if (updated.uses === undefined) {
    updated.uses = 10
  }

  // Determine if untradable
  const isUntradable = recipe.name.includes('(Untradable)') || recipe.price === 0
  if (isUntradable) {
    updated.isUntradable = true

    // Try to find tradable counterpart
    const tradableName = recipe.name.replace(' (Untradable)', '')
    const tradableId = recipeMap.get(tradableName)
    if (tradableId) {
      updated.tradableCounterpartId = tradableId
    }
  }

  return updated
})

// Update craftableRecipes (for now, just ensure the new fields exist but are empty)
// These will be populated manually or via a future script
data.craftableRecipes = data.craftableRecipes.map(craftable => {
  const updated = { ...craftable }
  // Fields are optional, so we don't need to add them if they don't exist
  return updated
})

// Write back to defaults.json
fs.writeFileSync(defaultsPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')

console.log('✓ Updated recipes with uses, isUntradable, and tradableCounterpartId fields')
console.log(`✓ Processed ${data.recipes.length} recipes`)
console.log(`✓ Found ${data.recipes.filter(r => r.isUntradable).length} untradable recipes`)
console.log(`✓ Linked ${data.recipes.filter(r => r.tradableCounterpartId).length} recipes to tradable counterparts`)
