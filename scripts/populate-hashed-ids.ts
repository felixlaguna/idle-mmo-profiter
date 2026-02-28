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
 * API key resolution order:
 * 1. .env file (IDLE_MMO_SECRET_KEY_CLI)
 * 2. CLI argument: --api-key=<key>
 * 3. Interactive prompt
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// API Configuration
const API_BASE_URL = 'https://api.idle-mmo.com/v1'
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
  producesItemName?: string
  producesItemHashedId?: string
  producesItemVendorValue?: number
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

// Load API key from .env file
function loadApiKeyFromEnv(): string | null {
  const envPath = path.join(__dirname, '../.env')
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const match = envContent.match(/^IDLE_MMO_SECRET_KEY_CLI=(.+)$/m)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

// Get API key from .env, command line argument, or prompt
async function getApiKey(): Promise<string> {
  // 1. Check .env file
  const envKey = loadApiKeyFromEnv()
  if (envKey) {
    console.log('Using API key from .env (IDLE_MMO_SECRET_KEY_CLI)')
    return envKey
  }

  // 2. Check CLI argument
  const args = process.argv.slice(2)
  const apiKeyArg = args.find((arg) => arg.startsWith('--api-key='))

  if (apiKeyArg) {
    return apiKeyArg.split('=')[1]
  }

  // 3. Prompt for API key
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

  // Check if we need to populate producesItemHashedId for recipes
  const needsProducesItemHashedId =
    item.producesItemName &&
    (!item.producesItemHashedId || item.producesItemHashedId === '')

  // Check if we need to populate producesItemVendorValue for recipes
  const needsProducesItemVendorValue =
    item.producesItemName &&
    item.producesItemHashedId &&
    item.producesItemHashedId !== '' &&
    (item.producesItemVendorValue === undefined || item.producesItemVendorValue === 0)

  // Skip if already has hashedId and vendorValue (and producesItemHashedId/producesItemVendorValue if applicable)
  if (
    item.hashedId &&
    item.hashedId !== '' &&
    item.vendorValue !== undefined &&
    item.vendorValue !== 0 &&
    !needsProducesItemHashedId &&
    !needsProducesItemVendorValue
  ) {
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

  // For recipe items with producesItemName, populate producesItemHashedId and producesItemVendorValue
  if (item.producesItemName && (needsProducesItemHashedId || needsProducesItemVendorValue)) {
    let producesHashedId = result.producesItemHashedId

    // If we don't have the producesItemHashedId yet, fetch it
    if (needsProducesItemHashedId) {
      console.log(`  → Looking up producesItemHashedId for: ${item.producesItemName}`)
      producesHashedId = await searchItem(item.producesItemName, apiKey)
      await delay(REQUEST_DELAY_MS) // Rate limit delay after search

      if (producesHashedId) {
        result.producesItemHashedId = producesHashedId
        console.log(`  ✓ Found producesItemHashedId: ${producesHashedId}`)
      } else {
        console.error(`  ✗ Could not find hashedId for producesItemName: ${item.producesItemName}`)
      }
    }

    // Get the vendor value for the produced item (if we have a hashedId)
    if (producesHashedId && (needsProducesItemHashedId || needsProducesItemVendorValue)) {
      console.log(`  → Looking up vendor value for produced item: ${item.producesItemName}`)
      const producesItemDetails = await inspectItem(producesHashedId, apiKey)
      await delay(REQUEST_DELAY_MS) // Rate limit delay after inspect

      if (producesItemDetails) {
        result.producesItemVendorValue = producesItemDetails.vendor_price || 0
        console.log(`  ✓ Found producesItemVendorValue: ${result.producesItemVendorValue}`)
      } else {
        console.error(`  ✗ Could not get vendor value for producesItemName: ${item.producesItemName}`)
      }
    }
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

  // Check for --limit flag
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity

  // Read defaults.json
  const defaultsPath = path.join(__dirname, '../src/data/defaults.json')
  const data: DefaultData = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'))

  // Calculate total items
  const totalItems =
    data.materials.length +
    data.craftables.length +
    data.resources.length +
    data.recipes.length

  const effectiveTotal = Math.min(totalItems, limit)
  console.log(`Total items to process: ${effectiveTotal}${limit < Infinity ? ` (limited from ${totalItems})` : ''}`)
  console.log(`Estimated time: ~${Math.ceil((effectiveTotal * 2 * REQUEST_DELAY_MS) / 1000 / 60)} minutes\n`)

  const startTime = Date.now()
  let currentIndex = 0

  // Process materials
  console.log(`\n=== Processing Materials (${data.materials.length} items) ===\n`)
  const processedMaterials: Item[] = []
  for (const item of data.materials) {
    if (currentIndex >= limit) break
    currentIndex++
    processedMaterials.push(await processItem(item, apiKey, currentIndex, effectiveTotal))
  }
  data.materials = [...processedMaterials, ...data.materials.slice(processedMaterials.length)]

  // Process craftables
  console.log(`\n=== Processing Craftables (${data.craftables.length} items) ===\n`)
  const processedCraftables: Item[] = []
  for (const item of data.craftables) {
    if (currentIndex >= limit) break
    currentIndex++
    processedCraftables.push(await processItem(item, apiKey, currentIndex, effectiveTotal))
  }
  data.craftables = [...processedCraftables, ...data.craftables.slice(processedCraftables.length)]

  // Process resources
  console.log(`\n=== Processing Resources (${data.resources.length} items) ===\n`)
  const processedResources: Item[] = []
  for (const item of data.resources) {
    if (currentIndex >= limit) break
    currentIndex++
    processedResources.push(await processItem(item, apiKey, currentIndex, effectiveTotal))
  }
  data.resources = [...processedResources, ...data.resources.slice(processedResources.length)]

  // Process recipes
  console.log(`\n=== Processing Recipes (${data.recipes.length} items) ===\n`)
  const processedRecipes: Item[] = []
  for (const item of data.recipes) {
    if (currentIndex >= limit) break
    currentIndex++
    processedRecipes.push(await processItem(item, apiKey, currentIndex, effectiveTotal))
  }
  data.recipes = [...processedRecipes, ...data.recipes.slice(processedRecipes.length)]

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
