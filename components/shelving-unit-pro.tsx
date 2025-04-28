"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, TransformControls, Environment, PerspectiveCamera, OrthographicCamera } from "@react-three/drei"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Menu,
  X,
  RotateCcw,
  Rows,
  Grid3X3,
  PanelLeft,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  View,
  CuboidIcon as Cube,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import dimension labels
import { DimensionLabels, OrthographicViews } from "./dimension-labels"

// Conversion factor from abstract units to millimeters
const UNIT_TO_MM = 1000

// Types for our shelving unit
type Shelf = {
  id: string
  position: number // 0-1 percentage of the container height
  divisions: number // Number of vertical divisions
}

type Column = {
  id: string
  position: number // 0-1 percentage of the container width
  divisions: number // Number of horizontal divisions
}

type ShelvingUnitState = {
  width: number
  height: number
  depth: number
  thickness: number
  shelves: Shelf[]
  columns: Column[]
  showWireframe: boolean
  showDimensions: boolean
  viewMode: "3d" | "orthographic"
  material: "wood" | "white" | "black" | "walnut" | "oak"
}

// Predefined layouts
const LAYOUTS = {
  basic: {
    shelves: [{ id: "s1", position: 0.5, divisions: 2 }],
    columns: [{ id: "c1", position: 0.5, divisions: 1 }],
  },
  bookshelf: {
    shelves: [
      { id: "s1", position: 0.25, divisions: 1 },
      { id: "s2", position: 0.5, divisions: 3 },
      { id: "s3", position: 0.75, divisions: 2 },
    ],
    columns: [],
  },
  display: {
    shelves: [
      { id: "s1", position: 0.33, divisions: 2 },
      { id: "s2", position: 0.66, divisions: 4 },
    ],
    columns: [
      { id: "c1", position: 0.33, divisions: 2 },
      { id: "c2", position: 0.66, divisions: 2 },
    ],
  },
  grid: {
    shelves: [
      { id: "s1", position: 0.33, divisions: 3 },
      { id: "s2", position: 0.66, divisions: 3 },
    ],
    columns: [
      { id: "c1", position: 0.33, divisions: 2 },
      { id: "c2", position: 0.66, divisions: 2 },
    ],
  },
}

// Material definitions
const MATERIALS = {
  wood: new THREE.MeshStandardMaterial({
    color: "#A67C52",
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
  }),
  white: new THREE.MeshStandardMaterial({
    color: "#F5F5F5",
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide,
  }),
  black: new THREE.MeshStandardMaterial({
    color: "#333333",
    roughness: 0.5,
    metalness: 0.2,
    side: THREE.DoubleSide,
  }),
  walnut: new THREE.MeshStandardMaterial({
    color: "#5D4037",
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide,
  }),
  oak: new THREE.MeshStandardMaterial({
    color: "#D7CCA1",
    roughness: 0.8,
    metalness: 0.05,
    side: THREE.DoubleSide,
  }),
}

// Component for a single shelf with divisions
function ShelfWithDivisions({
  width,
  height,
  depth,
  position,
  divisions,
  material,
  showWireframe,
  thickness,
  onDrag,
  onDragEnd,
}: {
  width: number
  height: number
  depth: number
  position: [number, number, number]
  divisions: number
  material: keyof typeof MATERIALS
  showWireframe: boolean
  thickness: number
  onDrag: (y: number) => void
  onDragEnd: () => void
}) {
  const shelfRef = useRef<THREE.Mesh>(null)
  const transformRef = useRef<any>(null)
  const divisionThickness = thickness

  // Create division meshes
  const divisionMeshes = []
  if (divisions > 1) {
    const divisionWidth = width / divisions
    for (let i = 1; i < divisions; i++) {
      const divisionX = -width / 2 + i * divisionWidth
      divisionMeshes.push(
        <mesh key={`div-${i}`} position={[divisionX, 0, 0]} material={MATERIALS[material]} castShadow receiveShadow>
          <boxGeometry args={[divisionThickness, divisionThickness, depth]} />
          {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
        </mesh>,
      )
    }
  }

  // Handle transform control events
  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current

      const handleDrag = () => {
        if (shelfRef.current) {
          onDrag(shelfRef.current.position.y)
        }
      }

      const handleDragEnd = () => {
        onDragEnd()
      }

      controls.addEventListener("dragging-changed", (event: { value: boolean }) => {
        if (event.value) {
          controls.addEventListener("objectChange", handleDrag)
        } else {
          controls.removeEventListener("objectChange", handleDrag)
          handleDragEnd()
        }
      })

      return () => {
        controls.removeEventListener("dragging-changed", handleDrag)
      }
    }
  }, [onDrag, onDragEnd])

  return (
    <group position={position}>
      {/* Main shelf */}
      <mesh ref={shelfRef} material={MATERIALS[material]} castShadow receiveShadow name="shelf">
        <boxGeometry args={[width, thickness, depth]} />
        {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
      </mesh>

      {/* Division lines */}
      {divisionMeshes}

      {/* Transform control for dragging */}
      <TransformControls
        ref={transformRef}
        object={shelfRef}
        mode="translate"
        showX={false}
        showZ={false}
        size={0.5}
        translationSnap={0.1}
      />
    </group>
  )
}

// Component for a single column with divisions
function ColumnWithDivisions({
  width,
  height,
  depth,
  position,
  divisions,
  material,
  showWireframe,
  thickness,
  onDrag,
  onDragEnd,
}: {
  width: number
  height: number
  depth: number
  position: [number, number, number]
  divisions: number
  material: keyof typeof MATERIALS
  showWireframe: boolean
  thickness: number
  onDrag: (x: number) => void
  onDragEnd: () => void
}) {
  const columnRef = useRef<THREE.Mesh>(null)
  const transformRef = useRef<any>(null)
  const divisionThickness = thickness

  // Create division meshes
  const divisionMeshes = []
  if (divisions > 1) {
    const divisionHeight = height / divisions
    for (let i = 1; i < divisions; i++) {
      const divisionY = -height / 2 + i * divisionHeight
      divisionMeshes.push(
        <mesh key={`div-${i}`} position={[0, divisionY, 0]} material={MATERIALS[material]} castShadow receiveShadow>
          <boxGeometry args={[divisionThickness, divisionThickness, depth]} />
          {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
        </mesh>,
      )
    }
  }

  // Handle transform control events
  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current

      const handleDrag = () => {
        if (columnRef.current) {
          onDrag(columnRef.current.position.x)
        }
      }

      const handleDragEnd = () => {
        onDragEnd()
      }

      controls.addEventListener("dragging-changed", (event: { value: boolean }) => {
        if (event.value) {
          controls.addEventListener("objectChange", handleDrag)
        } else {
          controls.removeEventListener("objectChange", handleDrag)
          handleDragEnd()
        }
      })

      return () => {
        controls.removeEventListener("dragging-changed", handleDrag)
      }
    }
  }, [onDrag, onDragEnd])

  return (
    <group position={position}>
      {/* Main column - FIXED: Using full height instead of height - thickness*2 */}
      <mesh ref={columnRef} material={MATERIALS[material]} castShadow receiveShadow name="column">
        <boxGeometry args={[thickness, height, depth]} />
        {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
      </mesh>

      {/* Division lines */}
      {divisionMeshes}

      {/* Transform control for dragging */}
      <TransformControls
        ref={transformRef}
        object={columnRef}
        mode="translate"
        showY={false}
        showZ={false}
        size={0.5}
        translationSnap={0.1}
      />
    </group>
  )
}

// Main shelving unit component with export capability
function ShelvingUnitModel({
  unit,
  onShelfDrag,
  onShelfDragEnd,
  onColumnDrag,
  onColumnDragEnd,
}: {
  unit: ShelvingUnitState
  onShelfDrag: (id: string, y: number) => void
  onShelfDragEnd: () => void
  onColumnDrag: (id: string, x: number) => void
  onColumnDragEnd: () => void
}) {
  const { width, height, depth, thickness, shelves, columns, showWireframe, showDimensions, material, viewMode } = unit
  const modelRef = useRef<THREE.Group>(null)

  // Create shelf components
  const shelfComponents = shelves.map((shelf) => {
    const yPosition = -height / 2 + shelf.position * height
    return (
      <ShelfWithDivisions
        key={shelf.id}
        width={width - thickness * 2}
        height={height}
        depth={depth - thickness * 2}
        position={[0, yPosition, 0]}
        divisions={shelf.divisions}
        material={material}
        showWireframe={showWireframe}
        thickness={thickness}
        onDrag={(y) => {
          const normalizedY = (y + height / 2) / height
          onShelfDrag(shelf.id, normalizedY)
        }}
        onDragEnd={onShelfDragEnd}
      />
    )
  })

  // Create column components
  const columnComponents = columns.map((column) => {
    const xPosition = -width / 2 + column.position * width
    return (
      <ColumnWithDivisions
        key={column.id}
        width={width}
        height={height} // FIXED: Using full height instead of height - thickness*2
        depth={depth - thickness * 2}
        position={[xPosition, 0, 0]} // FIXED: Centered vertically
        divisions={column.divisions}
        material={material}
        showWireframe={showWireframe}
        thickness={thickness}
        onDrag={(x) => {
          const normalizedX = (x + width / 2) / width
          onColumnDrag(column.id, normalizedX)
        }}
        onDragEnd={onColumnDragEnd}
      />
    )
  })

  return (
    <group ref={modelRef} name="shelving-unit">
      {viewMode === "3d" ? (
        <>
          {/* Bottom */}
          <mesh position={[0, -height / 2, 0]} material={MATERIALS[material]} castShadow receiveShadow name="bottom">
            <boxGeometry args={[width, thickness, depth]} />
            {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
          </mesh>

          {/* Top */}
          <mesh position={[0, height / 2, 0]} material={MATERIALS[material]} castShadow receiveShadow name="top">
            <boxGeometry args={[width, thickness, depth]} />
            {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
          </mesh>

          {/* Left side */}
          <mesh
            position={[-width / 2 + thickness / 2, 0, 0]}
            material={MATERIALS[material]}
            castShadow
            receiveShadow
            name="left-side"
          >
            <boxGeometry args={[thickness, height, depth]} />
            {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
          </mesh>

          {/* Right side */}
          <mesh
            position={[width / 2 - thickness / 2, 0, 0]}
            material={MATERIALS[material]}
            castShadow
            receiveShadow
            name="right-side"
          >
            <boxGeometry args={[thickness, height, depth]} />
            {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
          </mesh>

          {/* Back */}
          <mesh
            position={[0, 0, -depth / 2 + thickness / 2]}
            material={MATERIALS[material]}
            castShadow
            receiveShadow
            name="back"
          >
            <boxGeometry args={[width, height, thickness]} />
            {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
          </mesh>

          {/* Shelves with divisions */}
          {shelfComponents}

          {/* Columns with divisions */}
          {columnComponents}

          {/* Dimension labels */}
          {showDimensions && <DimensionLabels width={width} height={height} depth={depth} thickness={thickness} />}
        </>
      ) : (
        // Orthographic views mode
        <OrthographicViews
          width={width}
          height={height}
          depth={depth}
          thickness={thickness}
          shelves={shelves}
          columns={columns}
          material={material}
        />
      )}
    </group>
  )
}

// Scene setup with lighting and camera
function Scene({ children, viewMode }: { children: React.ReactNode; viewMode: "3d" | "orthographic" }) {
  return (
    <>
      <color attach="background" args={["#1a1a1a"]} />

      {viewMode === "3d" ? (
        // 3D perspective view
        <>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow shadow-mapSize={1024} />
          <directionalLight position={[-10, -10, -5]} intensity={0.2} />
          <gridHelper args={[20, 20, "#444444", "#222222"]} />
          <Environment preset="warehouse" />
          {children}
          <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
        </>
      ) : (
        // Orthographic technical drawing view
        <>
          <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={50} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[0, 0, 5]} intensity={0.5} />
          {children}
          <OrbitControls makeDefault enableRotate={false} enablePan={true} enableZoom={true} />
        </>
      )}
    </>
  )
}

// Thickness presets in inches and mm
const THICKNESS_PRESETS = [
  { name: '1/4" (6mm)', value: 0.06 },
  { name: '1/2" (12mm)', value: 0.12 },
  { name: '3/4" (19mm)', value: 0.19 },
  { name: '1" (25mm)', value: 0.25 },
]

// Main component
export default function ShelvingUnitPro() {
  // State for the shelving unit
  const [unit, setUnit] = useState<ShelvingUnitState>({
    width: 3,
    height: 2,
    depth: 1,
    thickness: 0.05,
    shelves: LAYOUTS.basic.shelves,
    columns: LAYOUTS.basic.columns,
    showWireframe: false,
    showDimensions: true,
    viewMode: "3d",
    material: "wood",
  })

  // Track drag distance for subdivision calculation
  const [dragStartPosition, setDragStartPosition] = useState<Record<string, number>>({})

  // UI states
  const [showControls, setShowControls] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false)

  // Check screen size on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    // Initial check
    checkMobile()

    // Add event listener
    window.addEventListener("resize", checkMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Handle shelf drag
  const handleShelfDrag = (id: string, normalizedY: number) => {
    // Store initial position if this is the start of the drag
    if (!dragStartPosition[id]) {
      setDragStartPosition((prev) => ({
        ...prev,
        [id]: unit.shelves.find((s) => s.id === id)?.position || 0,
      }))
    }

    // Update shelf position
    setUnit((prev) => ({
      ...prev,
      shelves: prev.shelves.map((shelf) => {
        if (shelf.id === id) {
          // Calculate drag distance as percentage of height
          const startPos = dragStartPosition[id] || shelf.position
          const dragDistance = Math.abs(normalizedY - startPos)

          // Calculate divisions based on drag distance
          // The further the drag, the more divisions
          let newDivisions = 1
          if (dragDistance > 0.05) newDivisions = 2
          if (dragDistance > 0.1) newDivisions = 3
          if (dragDistance > 0.15) newDivisions = 4
          if (dragDistance > 0.2) newDivisions = 5

          return {
            ...shelf,
            position: normalizedY,
            divisions: newDivisions,
          }
        }
        return shelf
      }),
    }))
  }

  // Handle column drag
  const handleColumnDrag = (id: string, normalizedX: number) => {
    // Store initial position if this is the start of the drag
    if (!dragStartPosition[id]) {
      setDragStartPosition((prev) => ({
        ...prev,
        [id]: unit.columns.find((c) => c.id === id)?.position || 0,
      }))
    }

    // Update column position
    setUnit((prev) => ({
      ...prev,
      columns: prev.columns.map((column) => {
        if (column.id === id) {
          // Calculate drag distance as percentage of width
          const startPos = dragStartPosition[id] || column.position
          const dragDistance = Math.abs(normalizedX - startPos)

          // Calculate divisions based on drag distance
          let newDivisions = 1
          if (dragDistance > 0.05) newDivisions = 2
          if (dragDistance > 0.1) newDivisions = 3
          if (dragDistance > 0.15) newDivisions = 4
          if (dragDistance > 0.2) newDivisions = 5

          return {
            ...column,
            position: normalizedX,
            divisions: newDivisions,
          }
        }
        return column
      }),
    }))
  }

  // Handle end of drag
  const handleDragEnd = () => {
    // Reset drag start positions
    setDragStartPosition({})
  }

  // Add a new shelf
  const addShelf = () => {
    // Find a good position for the new shelf
    const existingPositions = unit.shelves.map((s) => s.position).sort((a, b) => a - b)
    let newPosition = 0.5 // Default to middle

    if (existingPositions.length > 0) {
      // Find the largest gap between shelves
      let maxGap = 0
      let gapPosition = 0.5

      // Check gap from bottom to first shelf
      if (existingPositions[0] > 0) {
        maxGap = existingPositions[0]
        gapPosition = existingPositions[0] / 2
      }

      // Check gaps between shelves
      for (let i = 0; i < existingPositions.length - 1; i++) {
        const gap = existingPositions[i + 1] - existingPositions[i]
        if (gap > maxGap) {
          maxGap = gap
          gapPosition = existingPositions[i] + gap / 2
        }
      }

      // Check gap from last shelf to top
      if (existingPositions[existingPositions.length - 1] < 1) {
        const gap = 1 - existingPositions[existingPositions.length - 1]
        if (gap > maxGap) {
          maxGap = gap
          gapPosition = existingPositions[existingPositions.length - 1] + gap / 2
        }
      }

      newPosition = gapPosition
    }

    const newShelf = {
      id: `s${Date.now()}`,
      position: newPosition,
      divisions: 2,
    }

    setUnit((prev) => ({
      ...prev,
      shelves: [...prev.shelves, newShelf],
    }))
  }

  // Add a new column
  const addColumn = () => {
    // Find a good position for the new column
    const existingPositions = unit.columns.map((c) => c.position).sort((a, b) => a - b)
    let newPosition = 0.5 // Default to middle

    if (existingPositions.length > 0) {
      // Find the largest gap between columns
      let maxGap = 0
      let gapPosition = 0.5

      // Check gap from left to first column
      if (existingPositions[0] > 0) {
        maxGap = existingPositions[0]
        gapPosition = existingPositions[0] / 2
      }

      // Check gaps between columns
      for (let i = 0; i < existingPositions.length - 1; i++) {
        const gap = existingPositions[i + 1] - existingPositions[i]
        if (gap > maxGap) {
          maxGap = gap
          gapPosition = existingPositions[i] + gap / 2
        }
      }

      // Check gap from last column to right
      if (existingPositions[existingPositions.length - 1] < 1) {
        const gap = 1 - existingPositions[existingPositions.length - 1]
        if (gap > maxGap) {
          maxGap = gap
          gapPosition = existingPositions[existingPositions.length - 1] + gap / 2
        }
      }

      newPosition = gapPosition
    }

    const newColumn = {
      id: `c${Date.now()}`,
      position: newPosition,
      divisions: 2,
    }

    setUnit((prev) => ({
      ...prev,
      columns: [...prev.columns, newColumn],
    }))
  }

  // Remove the last added shelf
  const removeShelf = () => {
    if (unit.shelves.length > 0) {
      setUnit((prev) => ({
        ...prev,
        shelves: prev.shelves.slice(0, -1),
      }))
    }
  }

  // Remove the last added column
  const removeColumn = () => {
    if (unit.columns.length > 0) {
      setUnit((prev) => ({
        ...prev,
        columns: prev.columns.slice(0, -1),
      }))
    }
  }

  // Apply a predefined layout
  const applyLayout = (layout: keyof typeof LAYOUTS) => {
    setUnit((prev) => ({
      ...prev,
      shelves: LAYOUTS[layout].shelves,
      columns: LAYOUTS[layout].columns,
    }))
  }

  // Reset to default size
  const resetUnit = () => {
    setUnit({
      width: 3,
      height: 2,
      depth: 1,
      thickness: unit.thickness, // Preserve current thickness
      shelves: LAYOUTS.basic.shelves,
      columns: LAYOUTS.basic.columns,
      showWireframe: unit.showWireframe,
      showDimensions: unit.showDimensions,
      viewMode: unit.viewMode,
      material: unit.material,
    })
  }

  // Toggle wireframe
  const toggleWireframe = () => {
    setUnit((prev) => ({
      ...prev,
      showWireframe: !prev.showWireframe,
    }))
  }

  // Toggle dimensions
  const toggleDimensions = () => {
    setUnit((prev) => ({
      ...prev,
      showDimensions: !prev.showDimensions,
    }))
  }

  // Toggle view mode
  const toggleViewMode = () => {
    setUnit((prev) => ({
      ...prev,
      viewMode: prev.viewMode === "3d" ? "orthographic" : "3d",
    }))
  }

  // Change material
  const changeMaterial = (material: ShelvingUnitState["material"]) => {
    setUnit((prev) => ({
      ...prev,
      material,
    }))
  }

  // Apply thickness preset
  const applyThicknessPreset = (thickness: number) => {
    setUnit((prev) => ({
      ...prev,
      thickness,
    }))
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  // Toggle menu
  const toggleMenu = () => {
    setShowControls(!showControls)
  }

  // Calculate real-world dimensions in millimeters
  const widthMM = Math.round(unit.width * UNIT_TO_MM)
  const heightMM = Math.round(unit.height * UNIT_TO_MM)
  const depthMM = Math.round(unit.depth * UNIT_TO_MM)
  const thicknessMM = Math.round(unit.thickness * UNIT_TO_MM)

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden flex">
      {/* Side menu panel */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 z-30 transition-all duration-300 ease-in-out ${
          showControls ? (isMobile ? "w-full" : "w-[500px]") : "w-0"
        }`}
      >
        {showControls && (
          <div className="h-full flex flex-col p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Shelving Unit Designer</h2>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={toggleMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="dimensions" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="dimensions" className="py-2">
                  Dimensions
                </TabsTrigger>
                <TabsTrigger value="elements" className="py-2">
                  Elements
                </TabsTrigger>
                <TabsTrigger value="appearance" className="py-2">
                  Appearance
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto pr-4">
                <TabsContent value="dimensions" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="width" className="text-white">
                          Width: {widthMM} mm
                        </Label>
                      </div>
                      <Slider
                        id="width"
                        min={1}
                        max={5}
                        step={0.1}
                        value={[unit.width]}
                        onValueChange={(value) => setUnit((prev) => ({ ...prev, width: value[0] }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="height" className="text-white">
                          Height: {heightMM} mm
                        </Label>
                      </div>
                      <Slider
                        id="height"
                        min={1}
                        max={4}
                        step={0.1}
                        value={[unit.height]}
                        onValueChange={(value) => setUnit((prev) => ({ ...prev, height: value[0] }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="depth" className="text-white">
                          Depth: {depthMM} mm
                        </Label>
                      </div>
                      <Slider
                        id="depth"
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={[unit.depth]}
                        onValueChange={(value) => setUnit((prev) => ({ ...prev, depth: value[0] }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="thickness" className="text-white">
                          Thickness: {thicknessMM} mm
                        </Label>
                      </div>
                      <Slider
                        id="thickness"
                        min={0.01}
                        max={0.2}
                        step={0.01}
                        value={[unit.thickness]}
                        onValueChange={(value) => setUnit((prev) => ({ ...prev, thickness: value[0] }))}
                      />
                    </div>

                    <div className="pt-2">
                      <Label className="text-white mb-2 block">Thickness Presets</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {THICKNESS_PRESETS.map((preset) => (
                          <Button
                            key={preset.value}
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => applyThicknessPreset(preset.value)}
                          >
                            {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                      <Switch id="showDimensions" checked={unit.showDimensions} onCheckedChange={toggleDimensions} />
                      <Label htmlFor="showDimensions" className="text-white">
                        Show Dimensions
                      </Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="elements" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white">Shelves: {unit.shelves.length}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={addShelf} className="h-8">
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeShelf}
                          disabled={unit.shelves.length === 0}
                          className="h-8"
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="flex items-center justify-between">
                      <span className="text-white">Columns: {unit.columns.length}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={addColumn} className="h-8">
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeColumn}
                          disabled={unit.columns.length === 0}
                          className="h-8"
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4">
                      <h3 className="text-white mb-3 font-medium">Preset Layouts</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => applyLayout("basic")} className="h-8">
                          <Grid3X3 className="h-3 w-3 mr-1" />
                          Basic
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applyLayout("bookshelf")} className="h-8">
                          <Rows className="h-3 w-3 mr-1" />
                          Bookshelf
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applyLayout("display")} className="h-8">
                          <PanelLeft className="h-3 w-3 mr-1" />
                          Display
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applyLayout("grid")} className="h-8">
                          <Grid3X3 className="h-3 w-3 mr-1" />
                          Grid
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="showWireframe" checked={unit.showWireframe} onCheckedChange={toggleWireframe} />
                      <Label htmlFor="showWireframe" className="text-white">
                        Show Wireframe
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="viewMode"
                        checked={unit.viewMode === "orthographic"}
                        onCheckedChange={() => toggleViewMode()}
                      />
                      <Label htmlFor="viewMode" className="text-white">
                        Technical Drawing View
                      </Label>
                    </div>

                    <div className="pt-4">
                      <h3 className="text-white mb-4 font-medium">Materials</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant={unit.material === "wood" ? "default" : "outline"}
                          size="sm"
                          className={cn("flex items-center gap-2 h-8", unit.material === "wood" ? "bg-amber-700" : "")}
                          onClick={() => changeMaterial("wood")}
                        >
                          <div className="w-3 h-3 bg-[#A67C52] rounded-full"></div>
                          Wood
                        </Button>
                        <Button
                          variant={unit.material === "white" ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "flex items-center gap-2 h-8",
                            unit.material === "white" ? "bg-gray-200 text-gray-900" : "",
                          )}
                          onClick={() => changeMaterial("white")}
                        >
                          <div className="w-3 h-3 bg-[#F5F5F5] rounded-full"></div>
                          White
                        </Button>
                        <Button
                          variant={unit.material === "black" ? "default" : "outline"}
                          size="sm"
                          className={cn("flex items-center gap-2 h-8", unit.material === "black" ? "bg-gray-900" : "")}
                          onClick={() => changeMaterial("black")}
                        >
                          <div className="w-3 h-3 bg-[#333333] rounded-full"></div>
                          Black
                        </Button>
                        <Button
                          variant={unit.material === "walnut" ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "flex items-center gap-2 h-8",
                            unit.material === "walnut" ? "bg-[#5D4037]" : "",
                          )}
                          onClick={() => changeMaterial("walnut")}
                        >
                          <div className="w-3 h-3 bg-[#5D4037] rounded-full"></div>
                          Walnut
                        </Button>
                        <Button
                          variant={unit.material === "oak" ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "flex items-center gap-2 h-8",
                            unit.material === "oak" ? "bg-[#D7CCA1] text-gray-900" : "",
                          )}
                          onClick={() => changeMaterial("oak")}
                        >
                          <div className="w-3 h-3 bg-[#D7CCA1] rounded-full"></div>
                          Oak
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>

              <div className="pt-6 border-t border-gray-800 mt-auto">
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={resetUnit} className="flex items-center gap-1">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
              {/* Instructions inside menu */}
              <div className="pt-6 border-t border-gray-800 mt-4">
                <h3 className="font-bold mb-2 text-white">How to Use</h3>
                <ul className="text-sm space-y-1 text-gray-300">
                  <li>• Drag shelves up/down to reposition</li>
                  <li>• Drag columns left/right to reposition</li>
                  <li>• The further you drag, the more divisions appear</li>
                  <li>• Orbit: Left-click + drag, Zoom: Scroll, Pan: Right-click + drag</li>
                  <li>• Switch to Technical Drawing view to see orthographic projections</li>
                </ul>
              </div>
            </Tabs>
          </div>
        )}
      </div>

      {/* Canvas container */}
      <div className="w-full h-full">
        {/* Full-screen 3D canvas */}
        <Canvas shadows className="w-full h-full">
          <Scene viewMode={unit.viewMode}>
            <ShelvingUnitModel
              unit={unit}
              onShelfDrag={handleShelfDrag}
              onShelfDragEnd={handleDragEnd}
              onColumnDrag={handleColumnDrag}
              onColumnDragEnd={handleDragEnd}
            />
          </Scene>
        </Canvas>

        {/* Floating hamburger menu button */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="outline"
            size="icon"
            className="bg-gray-900/80 border-gray-700 hover:bg-gray-800"
            onClick={toggleMenu}
          >
            <Menu className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Floating action buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-gray-900/80 border-gray-700 hover:bg-gray-800"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5 text-white" /> : <Maximize2 className="h-5 w-5 text-white" />}
          </Button>
          <Button
            variant="outline"
            className="bg-gray-900/80 border-gray-700 hover:bg-gray-800 px-3"
            onClick={toggleViewMode}
          >
            {unit.viewMode === "3d" ? (
              <View className="h-5 w-5 text-white mr-2" />
            ) : (
              <Cube className="h-5 w-5 text-white mr-2" />
            )}
            <span className="text-white">{unit.viewMode === "3d" ? "Technical View" : "3D View"}</span>
          </Button>
        </div>

        {/* Dimensions display */}
        <div className="absolute bottom-4 left-4 z-10 bg-gray-900/80 p-3 rounded-lg border border-gray-700">
          <div className="text-white text-sm space-y-1">
            <div>Width: {widthMM} mm</div>
            <div>Height: {heightMM} mm</div>
            <div>Depth: {depthMM} mm</div>
            <div>Thickness: {thicknessMM} mm</div>
          </div>
        </div>
      </div>
    </div>
  )
}
