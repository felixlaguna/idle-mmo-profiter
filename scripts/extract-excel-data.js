import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read the Excel file
const workbook = XLSX.readFile(path.join(__dirname, '../Idlemmo.xlsx'))

console.log('Available sheets:', workbook.SheetNames)

// Let's examine each sheet
workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n=== Sheet: ${sheetName} ===`)
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  // Print first 10 rows to understand structure
  console.log('First 10 rows:')
  data.slice(0, 10).forEach((row, idx) => {
    console.log(`Row ${idx}:`, row)
  })

  // Get column headers (first row)
  console.log('\nColumn headers:', data[0])
  console.log(`Total rows: ${data.length}`)
})
