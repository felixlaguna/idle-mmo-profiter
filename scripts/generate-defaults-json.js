import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../Idlemmo.xlsx'))

// Helper to safely get a value from a cell
const getValue = (row, col) => {
  const value = row[col]
  return value === '' || value === undefined ? null : value
}

// Extract Market sheet data
const marketSheet = workbook.Sheets['Market']
const marketData = XLSX.utils.sheet_to_json(marketSheet, { header: 1, defval: '' })

// Materials (columns B-C, starting from row 2)
const materials = []
for (let i = 1; i < marketData.length; i++) {
  const name = getValue(marketData[i], 1) // Column B
  const price = getValue(marketData[i], 2) // Column C
  if (name && price !== null) {
    materials.push({
      id: `mat-${i}`,
      name: name.toString().trim(),
      price: typeof price === 'number' ? price : parseFloat(price),
    })
  } else {
    break // Stop when we hit empty rows
  }
}

// Potions (columns F-G, starting from row 2)
const potions = []
for (let i = 1; i < marketData.length; i++) {
  const name = getValue(marketData[i], 5) // Column F
  const price = getValue(marketData[i], 6) // Column G
  if (name && price !== null) {
    potions.push({
      id: `pot-${i}`,
      name: name.toString().trim(),
      price: typeof price === 'number' ? price : parseFloat(price),
    })
  } else {
    break
  }
}

// Resources (columns J-K, starting from row 2)
const resources = []
for (let i = 1; i < marketData.length; i++) {
  const name = getValue(marketData[i], 9) // Column J
  const marketPrice = getValue(marketData[i], 10) // Column K
  if (name && marketPrice !== null) {
    resources.push({
      id: `res-${i}`,
      name: name.toString().trim(),
      marketPrice: typeof marketPrice === 'number' ? marketPrice : parseFloat(marketPrice),
    })
  } else {
    break
  }
}

// Recipes (columns N-Q, starting from row 2)
const recipes = []
for (let i = 1; i < marketData.length; i++) {
  const name = getValue(marketData[i], 13) // Column N
  const price = getValue(marketData[i], 14) // Column O
  const value = getValue(marketData[i], 15) // Column P (may be empty)
  const chance = getValue(marketData[i], 16) // Column Q

  if (name && price !== null && chance !== null) {
    recipes.push({
      id: `rec-${i}`,
      name: name.toString().trim(),
      price: typeof price === 'number' ? price : parseFloat(price),
      value: value !== null ? (typeof value === 'number' ? value : parseFloat(value)) : undefined,
      chance: typeof chance === 'number' ? chance : parseFloat(chance),
    })
  } else {
    break
  }
}

// Extract Dungeon sheet data
const dungeonSheet = workbook.Sheets['Dungeon']
const dungeonData = XLSX.utils.sheet_to_json(dungeonSheet, { header: 1, defval: '' })

const dungeons = []
for (let i = 1; i < dungeonData.length && i < 19; i++) {
  // 18 dungeons (rows 2-19)
  const dungeonName = getValue(dungeonData[i], 0)
  const runCost = getValue(dungeonData[i], 2)
  const timeSeconds = getValue(dungeonData[i], 3)
  const numDrops = getValue(dungeonData[i], 6)

  if (!dungeonName) break

  const drops = []
  // Extract drops (pairs of dropName and dropPrice starting from column 7)
  for (let j = 0; j < numDrops; j++) {
    const dropNameCol = 7 + j * 2
    const dropPriceCol = 8 + j * 2
    const dropName = getValue(dungeonData[i], dropNameCol)
    const dropPrice = getValue(dungeonData[i], dropPriceCol)

    if (dropName && dropPrice !== null) {
      drops.push({
        recipeName: dropName.toString().trim(),
        expectedValue: typeof dropPrice === 'number' ? dropPrice : parseFloat(dropPrice),
      })
    }
  }

  dungeons.push({
    name: dungeonName.toString().trim(),
    runCost: typeof runCost === 'number' ? runCost : parseFloat(runCost),
    timeSeconds: typeof timeSeconds === 'number' ? timeSeconds : parseFloat(timeSeconds),
    numDrops: typeof numDrops === 'number' ? numDrops : parseInt(numDrops),
    drops,
  })
}

// Extract Potions sheet data
const potionsSheet = workbook.Sheets['Potions']
const potionsData = XLSX.utils.sheet_to_json(potionsSheet, { header: 1, defval: '' })

// Helper function to find material name by unit cost
const findMaterialByUnitCost = (unitCost) => {
  // Round to 2 decimal places to handle floating point precision issues
  const roundedCost = Math.round(unitCost * 100) / 100
  const material = materials.find((m) => {
    const roundedPrice = Math.round(m.price * 100) / 100
    return roundedPrice === roundedCost
  })
  return material ? material.name : `Unknown Material (${unitCost})`
}

const potionCrafts = []
for (let i = 1; i < potionsData.length; i++) {
  const name = getValue(potionsData[i], 0)
  const time = getValue(potionsData[i], 1)
  const mat1Qty = getValue(potionsData[i], 2)
  const mat1Cost = getValue(potionsData[i], 3)
  const mat2Qty = getValue(potionsData[i], 4)
  const mat2Cost = getValue(potionsData[i], 5)
  const vialCost = getValue(potionsData[i], 6)
  const currentPrice = getValue(potionsData[i], 9)

  if (!name || !time) break

  const craftMaterials = []

  if (mat1Qty && mat1Cost !== null) {
    const qty = typeof mat1Qty === 'number' ? mat1Qty : parseFloat(mat1Qty)
    const cost = typeof mat1Cost === 'number' ? mat1Cost : parseFloat(mat1Cost)
    const unitCost = cost / qty
    craftMaterials.push({
      name: findMaterialByUnitCost(unitCost),
      quantity: qty,
      unitCost: unitCost,
    })
  }

  if (mat2Qty && mat2Cost !== null) {
    const qty = typeof mat2Qty === 'number' ? mat2Qty : parseFloat(mat2Qty)
    const cost = typeof mat2Cost === 'number' ? mat2Cost : parseFloat(mat2Cost)
    const unitCost = cost / qty
    craftMaterials.push({
      name: findMaterialByUnitCost(unitCost),
      quantity: qty,
      unitCost: unitCost,
    })
  }

  potionCrafts.push({
    name: name.toString().trim(),
    timeSeconds: typeof time === 'number' ? time : parseFloat(time),
    materials: craftMaterials,
    vialCost: typeof vialCost === 'number' ? vialCost : parseFloat(vialCost),
    currentPrice: typeof currentPrice === 'number' ? currentPrice : parseFloat(currentPrice),
  })
}

// Extract Profit sheet data
const profitSheet = workbook.Sheets['Profit']
const profitData = XLSX.utils.sheet_to_json(profitSheet, { header: 1, defval: '' })

const resourceGathering = []
for (let i = 1; i < profitData.length; i++) {
  const name = getValue(profitData[i], 0)
  const time = getValue(profitData[i], 1)
  const cost = getValue(profitData[i], 2)
  const vendorValue = getValue(profitData[i], 3)
  const marketValue = getValue(profitData[i], 6)

  if (!name || !time) break

  resourceGathering.push({
    name: name.toString().trim(),
    timeSeconds: typeof time === 'number' ? time : parseFloat(time),
    cost: typeof cost === 'number' ? cost : parseFloat(cost),
    vendorValue: typeof vendorValue === 'number' ? vendorValue : parseFloat(vendorValue),
    marketPrice: typeof marketValue === 'number' ? marketValue : parseFloat(marketValue),
  })
}

// Create the final defaults object
const defaults = {
  materials,
  potions,
  resources,
  recipes,
  dungeons,
  potionCrafts,
  resourceGathering,
  magicFindDefaults: {
    streak: 10,
    dungeon: 13,
    item: 3,
    bonus: 10,
  },
  marketTaxRate: 0.12,
}

// Write to JSON file
const outputPath = path.join(__dirname, '../src/data/defaults.json')
fs.writeFileSync(outputPath, JSON.stringify(defaults, null, 2))

console.log('✅ defaults.json generated successfully!')
console.log(`📊 Data extracted:`)
console.log(`   - ${materials.length} materials`)
console.log(`   - ${potions.length} potions`)
console.log(`   - ${resources.length} resources`)
console.log(`   - ${recipes.length} recipes`)
console.log(`   - ${dungeons.length} dungeons`)
console.log(`   - ${potionCrafts.length} potion crafts`)
console.log(`   - ${resourceGathering.length} resource gathering activities`)
