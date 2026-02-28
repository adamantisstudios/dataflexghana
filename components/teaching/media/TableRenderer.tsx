"use client"

interface TableRendererProps {
  content: string
}

export function TableRenderer({ content }: TableRendererProps) {
  // Parse markdown table format
  const parseMarkdownTable = (text: string) => {
    const lines = text.trim().split("\n")
    if (lines.length < 2) return null

    const headerLine = lines[0]
    const separatorLine = lines[1]

    // Check if it's a valid markdown table
    if (!separatorLine.includes("|") || !separatorLine.includes("-")) {
      return null
    }

    const headers = headerLine
      .split("|")
      .map((h) => h.trim())
      .filter(Boolean)
    const rows = lines.slice(2).map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean),
    )

    return { headers, rows }
  }

  const table = parseMarkdownTable(content)

  if (!table) {
    return <p className="text-gray-700 text-sm whitespace-pre-wrap">{content}</p>
  }

  return (
    <div className="overflow-x-auto my-3 rounded-lg border border-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-blue-500 to-blue-600">
            {table.headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-blue-400 last:border-r-0"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`${rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
            >
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
