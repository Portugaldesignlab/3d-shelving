/**
 * Minimal Exporter
 * A very simple, reliable exporter for the shelving unit
 */

// Function to create a simple text representation of the shelving unit
export function createDesignSpec(unit: {
  width: number
  height: number
  depth: number
  thickness: number
  shelves: Array<{ position: number; divisions: number }>
  columns: Array<{ position: number; divisions: number }>
  material: string
}): string {
  const { width, height, depth, thickness, shelves, columns, material } = unit

  // Create a simple text specification
  return `Shelving Unit Design Specifications
=============================

DIMENSIONS
Width: ${width.toFixed(2)} units
Height: ${height.toFixed(2)} units
Depth: ${depth.toFixed(2)} units
Material thickness: ${thickness.toFixed(2)} units
Material: ${material}

SHELVES (${shelves.length})
${shelves
  .map(
    (shelf, i) =>
      `Shelf ${i + 1}: Position ${(shelf.position * 100).toFixed(0)}% from bottom, ${shelf.divisions} divisions`,
  )
  .join("\n")}

COLUMNS (${columns.length})
${columns
  .map(
    (column, i) =>
      `Column ${i + 1}: Position ${(column.position * 100).toFixed(0)}% from left, ${column.divisions} divisions`,
  )
  .join("\n")}

Generated: ${new Date().toLocaleString()}
`
}

// Simple and reliable download function
export function downloadAsFile(content: string, filename: string): void {
  // Create a blob with the content
  const blob = new Blob([content], { type: "text/plain" })

  // Create a URL for the blob
  const url = URL.createObjectURL(blob)

  // Create a link element
  const link = document.createElement("a")
  link.href = url
  link.download = filename

  // Append the link to the body
  document.body.appendChild(link)

  // Trigger the download
  link.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

// Function to add a visible download button to the page
export function addDownloadButton(content: string, filename: string): HTMLElement {
  // Create a blob with the content
  const blob = new Blob([content], { type: "text/plain" })

  // Create a URL for the blob
  const url = URL.createObjectURL(blob)

  // Create a button element
  const button = document.createElement("button")
  button.textContent = `Download ${filename}`
  button.style.position = "fixed"
  button.style.bottom = "20px"
  button.style.left = "50%"
  button.style.transform = "translateX(-50%)"
  button.style.backgroundColor = "#3B82F6"
  button.style.color = "white"
  button.style.padding = "12px 24px"
  button.style.borderRadius = "6px"
  button.style.border = "none"
  button.style.fontWeight = "bold"
  button.style.cursor = "pointer"
  button.style.zIndex = "9999"
  button.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)"

  // Add hover effect
  button.onmouseover = () => {
    button.style.backgroundColor = "#2563EB"
  }
  button.onmouseout = () => {
    button.style.backgroundColor = "#3B82F6"
  }

  // Add click event
  button.onclick = () => {
    // Create a link element
    const link = document.createElement("a")
    link.href = url
    link.download = filename

    // Trigger the download
    link.click()

    // Remove the button after a delay
    setTimeout(() => {
      if (button.parentNode) {
        button.parentNode.removeChild(button)
      }
      URL.revokeObjectURL(url)
    }, 1000)
  }

  // Append to the document
  document.body.appendChild(button)

  return button
}
