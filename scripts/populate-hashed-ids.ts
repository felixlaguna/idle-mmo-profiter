/**
 * Populate hashed_item_id and vendorValue for all items in defaults.json
 *
 * This script:
 * 1. Reads defaults.json
 * 2. For each item, calls the IdleMMO API to search by name and get the hashed_item_id
 * 3. Calls the inspect endpoint to get vendorValue
 * 4. Writes results back to defaults.json
 * 5. Handles rate limits (20 req/min) with delays between requests
 * 6. Shows progress in console
 *
 * Run with: tsx scripts/populate-hashed-ids.ts
 *
 * IMPORTANT: You must have a valid API key set in localStorage before running this script.
 * The script will prompt you to enter the API key if not found.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// API Configuration
const API_BASE_URL = 'https://api.idle-mmo.com/api/v1'
const MAX_REQUESTS_PER_MINUTE = 20
const REQUEST_DELAY_MS = (60 * 1000) / MAX_REQUESTS_PER_MINUTE + 100 // Add 100ms buffer

// Types
interface Item {
  id: string
  name: string
  hashedId?: string
  vendorValue?: number
  price?: number
  marketPrice?: number
  chance?: number
  value?: number
}

interface DefaultData {
  materials: Item[]
  craftables: Item[]
  resources: Item[]
  recipes: Item[]
  [key: string]: unknown
}

interface SearchResult {
  hashed_id: string
  name: string
  description: string
  image_url: string
  type: string
  quality: string
  vendor_price: number
}

interface SearchResponse {
  items: SearchResult[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

interface InspectRecipe {
  recipe_id: number
  recipe_hashed_id: string
  name: string
  uses?: number
  max_uses?: number
  ingredients?: Array<{
    hashed_item_id: string
    name: string
    quantity: number
  }>
}

interface InspectResponse {
  item: {
    hashed_id: string
    name: string
    vendor_price: number
    is_tradeable: boolean
    max_tier: number
    recipes?: InspectRecipe[]
  }
  endpoint_updates_at: string
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Get API key from command line argument or prompt
async function getApiKey(): Promise<string> {
  const args = process.argv.slice(2)
  const apiKeyArg = args.find((arg) => arg.startsWith('--api-key='))

  if (apiKeyArg) {
    return apiKeyArg.split('=')[1]
  }

  // Prompt for API key
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question('Enter your IdleMMO API key: ', (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// Search for item by name
async function searchItem(name: string, apiKey: string): Promise<string | null> {
  const url = `${API_BASE_URL}/item/search?query=${encodeURIComponent(name)}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'User-Agent': 'IdleMMO-ProfitCalc-PopulateScript/1.0',
      },
    })

    if (!response.ok) {
      console.error(`  ✗ Search failed for "${name}": ${response.status} ${response.statusText}`)
      return null
    }

    const data: SearchResponse = await response.json()

    if (data.items.length === 0) {
      console.error(`  ✗ No results found for "${name}"`)
      return null
    }

    // Find exact match (case-insensitive)
    const exactMatch = data.items.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    )

    if (exactMatch) {
      return exactMatch.hashed_id
    }

    // If no exact match, use first result
    console.warn(`  ⚠ No exact match for "${name}", using first result: "${data.items[0].name}"`)
    return data.items[0].hashed_id
  } catch (error) {
    console.error(`  ✗ Error searching for "${name}":`, error)
    return null
  }
}

// Get item details including vendor value and recipe data
async function inspectItem(hashedId: string, apiKey: string): Promise<InspectResponse['item'] | null> {
  const url = `${API_BASE_URL}/item/${hashedId}/inspect`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'User-Agent': 'IdleMMO-ProfitCalc-PopulateScript/1.0',
      },
    })

    if (!response.ok) {
      console.error(`  ✗ Inspect failed for ${hashedId}: ${response.status} ${response.statusText}`)
      return null
    }

    const data: InspectResponse = await response.json()
    return data.item
  } catch (error) {
    console.error(`  ✗ Error inspecting ${hashedId}:`, error)
    return null
  }
}

// Process a single item
async function processItem(
  item: Item,
  apiKey: string,
  index: number,
  total: number
): Promise<Item> {
  console.log(`[${index}/${total}] Processing: ${item.name}`)

  // Skip if already has hashedId and vendorValue
  if (item.hashedId && item.hashedId !== '' && item.vendorValue !== undefined && item.vendorValue !== 0) {
    console.log(`  ✓ Already populated (hashedId: ${item.hashedId}, vendorValue: ${item.vendorValue})`)
    return item
  }

  // Search for hashed ID
  let hashedId = item.hashedId && item.hashedId !== '' ? item.hashedId : null

  if (!hashedId) {
    hashedId = await searchItem(item.name, apiKey)
    if (!hashedId) {
      console.error(`  ✗ Skipping ${item.name}: could not find hashed ID`)
      return item
    }
    await delay(REQUEST_DELAY_MS) // Rate limit delay after search
  }

  // Get item details (vendor value, recipes, uses, etc.)
  const itemDetails = await inspectItem(hashedId, apiKey)
  await delay(REQUEST_DELAY_MS) // Rate limit delay after inspect

  if (itemDetails === null) {
    console.error(`  ✗ Skipping ${item.name}: could not get item details`)
    return item
  }

  const vendorValue = itemDetails.vendor_price || 0
  const result: Item = {
    ...item,
    hashedId,
    vendorValue,
  }

  // For recipe items, extract uses from the inspect response
  // The inspect response may include recipe details with uses/max_uses
  if (itemDetails.recipes && itemDetails.recipes.length > 0) {
    const recipe = itemDetails.recipes[0]
    if (recipe.uses !== undefined && recipe.uses !== null) {
      ;(result as Record<string, unknown>).uses = recipe.uses
      console.log(`  ✓ Updated: hashedId=${hashedId}, vendorValue=${vendorValue}, uses=${recipe.uses}`)
    } else if (recipe.max_uses !== undefined && recipe.max_uses !== null) {
      ;(result as Record<string, unknown>).uses = recipe.max_uses
      console.log(`  ✓ Updated: hashedId=${hashedId}, vendorValue=${vendorValue}, uses=${recipe.max_uses}`)
    } else {
      console.log(`  ✓ Updated: hashedId=${hashedId}, vendorValue=${vendorValue} (no uses in response)`)
    }
  } else {
    console.log(`  ✓ Updated: hashedId=${hashedId}, vendorValue=${vendorValue}`)
  }

  return result
}

// Main function
async function main() {
  console.log('IdleMMO Hashed ID and Vendor Value Population Script')
  console.log('=====================================================\n')

  // Get API key
  const apiKey = await getApiKey()

  if (!apiKey) {
    console.error('Error: API key is required')
    process.exit(1)
  }

  // Read defaults.json
  const defaultsPath = path.join(__dirname, '../src/data/defaults.json')
  const data: DefaultData = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'))

  // Calculate total items
  const totalItems =
    data.materials.length +
    data.craftables.length +
    data.resources.length +
    data.recipes.length

  console.log(`Total items to process: ${totalItems}`)
  console.log(`Estimated time: ~${Math.ceil((totalItems * 2 * REQUEST_DELAY_MS) / 1000 / 60)} minutes\n`)

  const startTime = Date.now()
  let currentIndex = 0

  // Process materials
  console.log(`\n=== Processing Materials (${data.materials.length} items) ===\n`)
  const processedMaterials: Item[] = []
  for (const item of data.materials) {
    currentIndex++
    processedMaterials.push(await processItem(item, apiKey, currentIndex, totalItems))
  }
  data.materials = processedMaterials

  // Process craftables
  console.log(`\n=== Processing Craftables (${data.craftables.length} items) ===\n`)
  const processedCraftables: Item[] = []
  for (const item of data.craftables) {
    currentIndex++
    processedCraftables.push(await processItem(item, apiKey, currentIndex, totalItems))
  }
  data.craftables = processedCraftables

  // Process resources
  console.log(`\n=== Processing Resources (${data.resources.length} items) ===\n`)
  const processedResources: Item[] = []
  for (const item of data.resources) {
    currentIndex++
    processedResources.push(await processItem(item, apiKey, currentIndex, totalItems))
  }
  data.resources = processedResources

  // Process recipes
  console.log(`\n=== Processing Recipes (${data.recipes.length} items) ===\n`)
  const processedRecipes: Item[] = []
  for (const item of data.recipes) {
    currentIndex++
    processedRecipes.push(await processItem(item, apiKey, currentIndex, totalItems))
  }
  data.recipes = processedRecipes

  // Write back to defaults.json
  console.log('\n=== Saving results to defaults.json ===\n')
  fs.writeFileSync(defaultsPath, JSON.stringify(data, null, 2) + '\n', 'utf8')

  const endTime = Date.now()
  const durationMinutes = ((endTime - startTime) / 1000 / 60).toFixed(2)

  console.log('✓ Population complete!')
  console.log(`  Time taken: ${durationMinutes} minutes`)
  console.log(`  Materials: ${data.materials.length} items`)
  console.log(`  Craftables: ${data.craftables.length} items`)
  console.log(`  Resources: ${data.resources.length} items`)
  console.log(`  Recipes: ${data.recipes.length} items`)
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
