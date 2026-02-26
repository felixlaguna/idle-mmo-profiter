import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Expected vendor values from the Excel Profit sheet
const expectedVendorValues = {
  Coal: 1.0,
  Stingray: 26.0,
  'Cooked Stingray': 65.0,
  'Great White Shark': 41.0,
  'Cooked Great White Shark': 92.0,
  'Mystic Ore': 20.0,
  'Mystic Bar': 59.0,
}

// Read the generated defaults.json
const defaultsPath = path.join(__dirname, '../src/data/defaults.json')
const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'))

console.log('Validating vendor values in resources array...\n')

let hasErrors = false

// Check each resource for vendor values
for (const resource of defaults.resources) {
  const expectedVendor = expectedVendorValues[resource.name]

  if (expectedVendor === undefined) {
    console.log(`⚠️  ${resource.name}: No expected vendor value defined (skipping)`)
    continue
  }

  if (resource.vendorValue === undefined) {
    console.log(`❌ ${resource.name}: Missing vendorValue (expected ${expectedVendor})`)
    hasErrors = true
  } else if (Math.abs(resource.vendorValue - expectedVendor) > 0.01) {
    console.log(
      `❌ ${resource.name}: Incorrect vendorValue (got ${resource.vendorValue}, expected ${expectedVendor})`,
    )
    hasErrors = true
  } else {
    console.log(`✅ ${resource.name}: vendorValue=${resource.vendorValue} (correct)`)
  }
}

console.log('\n' + '='.repeat(60))
if (hasErrors) {
  console.log('❌ VALIDATION FAILED: Vendor values are incorrect!')
  process.exit(1)
} else {
  console.log('✅ VALIDATION PASSED: All vendor values are correct!')
  process.exit(0)
}
