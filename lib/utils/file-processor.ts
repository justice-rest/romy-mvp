import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const MAX_ROWS = 1000
const MAX_CHARS = 100000

export async function processFile(
  url: string,
  mediaType: string
): Promise<string | null> {
  if (
    mediaType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mediaType === 'application/vnd.ms-excel'
  ) {
    return processExcelFile(url)
  } else if (mediaType === 'text/csv') {
    return processCSVFile(url)
  }
  return null
}

async function processExcelFile(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    let output = ''
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false
      })

      const limitedData = (jsonData as any[][]).slice(0, MAX_ROWS)

      output += `\n## Sheet: ${sheetName}\n\n`
      output += formatTableData(limitedData)

      if (output.length > MAX_CHARS) {
        output = output.slice(0, MAX_CHARS) + '\n... [truncated]'
        break
      }
    }

    return output
  } catch (error) {
    console.error('Error processing Excel file:', error)
    throw new Error('Failed to process Excel file')
  }
}

async function processCSVFile(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const text = await response.text()

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        complete: (results: any) => {
          const limitedData = results.data.slice(0, MAX_ROWS)
          let output = formatTableData(limitedData)

          if (output.length > MAX_CHARS) {
            output = output.slice(0, MAX_CHARS) + '\n... [truncated]'
          }

          resolve(output)
        },
        error: (error: any) => {
          console.error('Error parsing CSV:', error)
          reject(new Error('Failed to parse CSV file'))
        }
      })
    })
  } catch (error) {
    console.error('Error processing CSV file:', error)
    throw new Error('Failed to process CSV file')
  }
}

function formatTableData(data: any[][]): string {
  if (data.length === 0) return ''

  const headers = data[0]
  const rows = data.slice(1)

  let output = '| ' + headers.join(' | ') + ' |\n'
  output += '| ' + headers.map(() => '---').join(' | ') + ' |\n'

  for (const row of rows) {
    output += '| ' + row.join(' | ') + ' |\n'
  }

  return output
}
