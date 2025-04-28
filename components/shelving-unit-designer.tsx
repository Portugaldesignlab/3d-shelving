"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus, MoveHorizontal, MoveVertical, Maximize2, Download } from "lucide-react"
import { cn } from "@/lib/utils"

// Types for our shelving unit
type Divider = {
  id: string
  position: number // 0-1 percentage of the container
  type: "horizontal" | "vertical"
}

type ShelvingUnitState = {
  width: number
  height: number
  horizontalDividers: Divider[]
  verticalDividers: Divider[]
}

// Predefined layouts
const LAYOUTS = {
  basic: {
    horizontalDividers: [{ id: "h1", position: 0.5, type: "horizontal" as const }],
    verticalDividers: [{ id: "v1", position: 0.5, type: "vertical" as const }],
  },
  bookshelf: {
    horizontalDividers: [
      { id: "h1", position: 0.25, type: "horizontal" as const },
      { id: "h2", position: 0.5, type: "horizontal" as const },
      { id: "h3", position: 0.75, type: "horizontal" as const },
    ],
    verticalDividers: [],
  },
  display: {
    horizontalDividers: [{ id: "h1", position: 0.6, type: "horizontal" as const }],
    verticalDividers: [
      { id: "v1", position: 0.33, type: "vertical" as const },
      { id: "v2", position: 0.66, type: "vertical" as const },
    ],
  },
  grid: {
    horizontalDividers: [
      { id: "h1", position: 0.33, type: "horizontal" as const },
      { id: "h2", position: 0.66, type: "horizontal" as const },
    ],
    verticalDividers: [
      { id: "v1", position: 0.33, type: "vertical" as const },
      { id: "v2", position: 0.66, type: "vertical" as const },
    ],
  },
}

export default function ShelvingUnitDesigner() {
  // State for the shelving unit
  const [unit, setUnit] = useState<ShelvingUnitState>({
    width: 600,
    height: 400,
    horizontalDividers: LAYOUTS.basic.horizontalDividers,
    verticalDividers: LAYOUTS.basic.verticalDividers,
  })

  // Refs for drag constraints
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Active element being dragged
  const [activeDivider, setActiveDivider] = useState<string | null>(null)

  // Handle resizing the entire unit
  const handleResize = (direction: "width" | "height", change: number) => {
    setUnit((prev) => ({
      ...prev,
      [direction]: Math.max(200, Math.min(800, prev[direction] + change)),
    }))
  }

  // Handle divider drag
  const handleDividerDrag = (id: string, type: "horizontal" | "vertical", newPosition: number) => {
    // Constrain position between 0.1 and 0.9 to prevent dividers at the edges
    const constrainedPosition = Math.max(0.1, Math.min(0.9, newPosition))

    setUnit((prev) => {
      if (type === "horizontal") {
        return {
          ...prev,
          horizontalDividers: prev.horizontalDividers.map((div) =>
            div.id === id ? { ...div, position: constrainedPosition } : div,
          ),
        }
      } else {
        return {
          ...prev,
          verticalDividers: prev.verticalDividers.map((div) =>
            div.id === id ? { ...div, position: constrainedPosition } : div,
          ),
        }
      }
    })
  }

  // Add a new divider
  const addDivider = (type: "horizontal" | "vertical") => {
    const newId = `${type[0]}${Date.now()}`
    const newDivider: Divider = {
      id: newId,
      position: 0.5, // Start in the middle
      type,
    }

    setUnit((prev) => {
      if (type === "horizontal") {
        return {
          ...prev,
          horizontalDividers: [...prev.horizontalDividers, newDivider],
        }
      } else {
        return {
          ...prev,
          verticalDividers: [...prev.verticalDividers, newDivider],
        }
      }
    })
  }

  // Remove a divider
  const removeDivider = (type: "horizontal" | "vertical") => {
    setUnit((prev) => {
      if (type === "horizontal" && prev.horizontalDividers.length > 0) {
        const newDividers = [...prev.horizontalDividers]
        newDividers.pop()
        return {
          ...prev,
          horizontalDividers: newDividers,
        }
      } else if (type === "vertical" && prev.verticalDividers.length > 0) {
        const newDividers = [...prev.verticalDividers]
        newDividers.pop()
        return {
          ...prev,
          verticalDividers: newDividers,
        }
      }
      return prev
    })
  }

  // Apply a predefined layout
  const applyLayout = (layout: keyof typeof LAYOUTS) => {
    setUnit((prev) => ({
      ...prev,
      horizontalDividers: LAYOUTS[layout].horizontalDividers,
      verticalDividers: LAYOUTS[layout].verticalDividers,
    }))
  }

  // Reset to default size
  const resetSize = () => {
    setUnit((prev) => ({
      ...prev,
      width: 600,
      height: 400,
    }))
  }

  // Calculate the number of cells in the grid
  const horizontalSections = unit.verticalDividers.length + 1
  const verticalSections = unit.horizontalDividers.length + 1
  const totalCells = horizontalSections * verticalSections

  // Download SVG
  const downloadSVG = () => {
    if (!svgRef.current) return

    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const blob = new Blob([svgData], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "shelving-unit.svg"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl">
      <Tabs defaultValue="designer" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="designer">Designer</TabsTrigger>
          <TabsTrigger value="layouts">Preset Layouts</TabsTrigger>
        </TabsList>
        <TabsContent value="designer" className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => handleResize("width", -20)} title="Decrease width">
                <MoveHorizontal className="h-4 w-4" />
                <Minus className="h-3 w-3 absolute" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleResize("width", 20)} title="Increase width">
                <MoveHorizontal className="h-4 w-4" />
                <Plus className="h-3 w-3 absolute" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => handleResize("height", -20)} title="Decrease height">
                <MoveVertical className="h-4 w-4" />
                <Minus className="h-3 w-3 absolute" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleResize("height", 20)} title="Increase height">
                <MoveVertical className="h-4 w-4" />
                <Plus className="h-3 w-3 absolute" />
              </Button>
            </div>

            <Button variant="outline" size="icon" onClick={resetSize} title="Reset size">
              <Maximize2 className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-gray-200 mx-1" />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addDivider("horizontal")}
                className="flex items-center gap-1"
                title="Add shelf"
              >
                <MoveHorizontal className="h-4 w-4" />
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeDivider("horizontal")}
                className="flex items-center gap-1"
                title="Remove shelf"
                disabled={unit.horizontalDividers.length === 0}
              >
                <MoveHorizontal className="h-4 w-4" />
                <Minus className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addDivider("vertical")}
                className="flex items-center gap-1"
                title="Add divider"
              >
                <MoveVertical className="h-4 w-4" />
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeDivider("vertical")}
                className="flex items-center gap-1"
                title="Remove divider"
                disabled={unit.verticalDividers.length === 0}
              >
                <MoveVertical className="h-4 w-4" />
                <Minus className="h-3 w-3" />
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1" />

            <Button variant="outline" size="sm" onClick={downloadSVG} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export SVG
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 mt-2">
            <p>
              {totalCells} compartments ({horizontalSections}×{verticalSections})
            </p>
          </div>
        </TabsContent>
        <TabsContent value="layouts" className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => applyLayout("basic")}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-24 h-24 border-2 border-gray-400 relative mb-2">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-400"></div>
                <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-400"></div>
              </div>
              <span className="text-sm font-medium">Basic (2×2)</span>
            </button>

            <button
              onClick={() => applyLayout("bookshelf")}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-24 h-24 border-2 border-gray-400 relative mb-2">
                <div className="absolute left-0 top-1/4 w-full h-0.5 bg-gray-400"></div>
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-400"></div>
                <div className="absolute left-0 top-3/4 w-full h-0.5 bg-gray-400"></div>
              </div>
              <span className="text-sm font-medium">Bookshelf</span>
            </button>

            <button
              onClick={() => applyLayout("display")}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-24 h-24 border-2 border-gray-400 relative mb-2">
                <div className="absolute left-0 top-[60%] w-full h-0.5 bg-gray-400"></div>
                <div className="absolute left-1/3 top-0 w-0.5 h-full bg-gray-400"></div>
                <div className="absolute left-2/3 top-0 w-0.5 h-full bg-gray-400"></div>
              </div>
              <span className="text-sm font-medium">Display</span>
            </button>

            <button
              onClick={() => applyLayout("grid")}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-24 h-24 border-2 border-gray-400 relative mb-2">
                <div className="absolute left-0 top-1/3 w-full h-0.5 bg-gray-400"></div>
                <div className="absolute left-0 top-2/3 w-full h-0.5 bg-gray-400"></div>
                <div className="absolute left-1/3 top-0 w-0.5 h-full bg-gray-400"></div>
                <div className="absolute left-2/3 top-0 w-0.5 h-full bg-gray-400"></div>
              </div>
              <span className="text-sm font-medium">Grid (3×3)</span>
            </button>
          </div>
        </TabsContent>
      </Tabs>

      <div
        ref={containerRef}
        className="relative bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
        style={{
          width: unit.width,
          height: unit.height,
          transition: "width 0.3s, height 0.3s",
        }}
      >
        <svg
          ref={svgRef}
          width={unit.width}
          height={unit.height}
          viewBox={`0 0 ${unit.width} ${unit.height}`}
          className="w-full h-full"
        >
          {/* Outer frame */}
          <rect x="0" y="0" width={unit.width} height={unit.height} fill="none" stroke="#8B5A2B" strokeWidth="10" />

          {/* Back panel */}
          <rect x="5" y="5" width={unit.width - 10} height={unit.height - 10} fill="#D7BEA8" />

          {/* Horizontal dividers */}
          {unit.horizontalDividers.map((divider) => {
            const yPosition = divider.position * unit.height
            return (
              <g key={divider.id}>
                <motion.rect
                  x="0"
                  y={yPosition - 5}
                  width={unit.width}
                  height="10"
                  fill="#8B5A2B"
                  drag="y"
                  dragConstraints={containerRef}
                  dragElastic={0}
                  dragMomentum={false}
                  onDragStart={() => setActiveDivider(divider.id)}
                  onDrag={(_, info) => {
                    if (containerRef.current) {
                      const newPosition = info.point.y / containerRef.current.clientHeight
                      handleDividerDrag(divider.id, "horizontal", newPosition)
                    }
                  }}
                  onDragEnd={() => setActiveDivider(null)}
                  className={cn("cursor-row-resize", activeDivider === divider.id && "z-10")}
                />
                {/* Drag handle indicator */}
                <circle cx={unit.width / 2} cy={yPosition} r="6" fill="#6B4423" className="pointer-events-none" />
              </g>
            )
          })}

          {/* Vertical dividers */}
          {unit.verticalDividers.map((divider) => {
            const xPosition = divider.position * unit.width
            return (
              <g key={divider.id}>
                <motion.rect
                  x={xPosition - 5}
                  y="0"
                  width="10"
                  height={unit.height}
                  fill="#8B5A2B"
                  drag="x"
                  dragConstraints={containerRef}
                  dragElastic={0}
                  dragMomentum={false}
                  onDragStart={() => setActiveDivider(divider.id)}
                  onDrag={(_, info) => {
                    if (containerRef.current) {
                      const newPosition = info.point.x / containerRef.current.clientWidth
                      handleDividerDrag(divider.id, "vertical", newPosition)
                    }
                  }}
                  onDragEnd={() => setActiveDivider(null)}
                  className={cn("cursor-col-resize", activeDivider === divider.id && "z-10")}
                />
                {/* Drag handle indicator */}
                <circle cx={xPosition} cy={unit.height / 2} r="6" fill="#6B4423" className="pointer-events-none" />
              </g>
            )
          })}

          {/* Shadow effect for depth */}
          <rect
            x="10"
            y="10"
            width={unit.width - 20}
            height={unit.height - 20}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="2"
            rx="2"
            ry="2"
          />
        </svg>

        {/* Resize handles */}
        <div className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-white/50 rounded-tl-md flex items-center justify-center">
          <Maximize2 className="h-4 w-4 text-gray-500" />
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 max-w-lg text-center">
        <p>
          <strong>Tip:</strong> Drag the dividers to reposition them. Use the controls above to add or remove shelves
          and dividers. Try the preset layouts for quick designs.
        </p>
      </div>
    </div>
  )
}
