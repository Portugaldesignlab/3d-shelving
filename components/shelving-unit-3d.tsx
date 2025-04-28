"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, TransformControls, Html } from "@react-three/drei"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RotateCcw } from "lucide-react"

// Types for our shelving unit
type Shelf = {
  id: string
  position: number // 0-1 percentage of the container height
  divisions: number // Number of vertical divisions
}

type ShelvingUnitState = {
  width: number
  height: number
  depth: number
  shelves: Shelf[]
  showWireframe: boolean
  material: "wood" | "white" | "black"
}

// Predefined layouts
const LAYOUTS = {
  basic: {
    shelves: [{ id: "s1", position: 0.5, divisions: 2 }],
  },
  bookshelf: {
    shelves: [
      { id: "s1", position: 0.25, divisions: 1 },
      { id: "s2", position: 0.5, divisions: 3 },
      { id: "s3", position: 0.75, divisions: 2 },
    ],
  },
  display: {
    shelves: [
      { id: "s1", position: 0.33, divisions: 2 },
      { id: "s2", position: 0.66, divisions: 4 },
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
}

// Wireframe material
const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: "#FFFFFF",
  wireframe: true,
  transparent: true,
  opacity: 0.3,
})

// Component for a single shelf with divisions
function ShelfWithDivisions({
  width,
  height,
  depth,
  position,
  divisions,
  material,
  showWireframe,
  onDrag,
  onDragEnd,
}: {
  width: number
  height: number
  depth: number
  position: [number, number, number]
  divisions: number
  material: "wood" | "white" | "black"
  showWireframe: boolean
  onDrag: (y: number) => void
  onDragEnd: () => void
}) {
  const shelfRef = useRef<THREE.Mesh>(null)
  const transformRef = useRef<any>(null)
  const thickness = 0.05 * height // Shelf thickness

  // Create division meshes
  const divisionMeshes = []
  if (divisions > 1) {
    const divisionWidth = width / divisions
    for (let i = 1; i < divisions; i++) {
      const divisionX = -width / 2 + i * divisionWidth
      divisionMeshes.push(
        <mesh key={`div-${i}`} position={[divisionX, 0, 0]} material={MATERIALS[material]} castShadow receiveShadow>
          <boxGeometry args={[thickness, thickness, depth]} />
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
      <mesh ref={shelfRef} material={MATERIALS[material]} castShadow receiveShadow>
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

// Main shelving unit component
function ShelvingUnitModel({
  unit,
  onShelfDrag,
  onShelfDragEnd,
}: {
  unit: ShelvingUnitState
  onShelfDrag: (id: string, y: number) => void
  onShelfDragEnd: () => void
}) {
  const { width, height, depth, shelves, showWireframe, material } = unit
  const thickness = 0.05 * height // Wall thickness

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
        onDrag={(y) => {
          const normalizedY = (y + height / 2) / height
          onShelfDrag(shelf.id, normalizedY)
        }}
        onDragEnd={onShelfDragEnd}
      />
    )
  })

  return (
    <group>
      {/* Bottom */}
      <mesh position={[0, -height / 2, 0]} material={MATERIALS[material]} castShadow receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
      </mesh>

      {/* Top */}
      <mesh position={[0, height / 2, 0]} material={MATERIALS[material]} castShadow receiveShadow>
        <boxGeometry args={[width, thickness, depth]} />
        {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
      </mesh>

      {/* Left side */}
      <mesh position={[-width / 2 + thickness / 2, 0, 0]} material={MATERIALS[material]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
      </mesh>

      {/* Right side */}
      <mesh position={[width / 2 - thickness / 2, 0, 0]} material={MATERIALS[material]} castShadow receiveShadow>
        <boxGeometry args={[thickness, height, depth]} />
        {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
      </mesh>

      {/* Back */}
      <mesh position={[0, 0, -depth / 2 + thickness / 2]} material={MATERIALS[material]} castShadow receiveShadow>
        <boxGeometry args={[width, height, thickness]} />
        {showWireframe && <meshBasicMaterial wireframe color="white" transparent opacity={0.3} />}
      </mesh>

      {/* Shelves with divisions */}
      {shelfComponents}

      {/* Instructions */}
      <Html position={[0, -height / 2 - 0.5, 0]} center>
        <div className="bg-black/70 text-white p-2 rounded text-xs w-48 text-center">
          Drag shelves up/down to reposition
          <br />
          The further you drag, the more divisions appear
        </div>
      </Html>
    </group>
  )
}

// Scene setup with lighting and camera
function Scene({ children }: { children: React.ReactNode }) {
  const { camera } = useThree()

  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, 0, 5)
  }, [camera])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow shadow-mapSize={1024} />
      <directionalLight position={[-10, -10, -5]} intensity={0.2} />
      <gridHelper args={[10, 10, "#666666", "#444444"]} />
      {children}
      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
    </>
  )
}

// Main component
export default function ShelvingUnit3D() {
  // State for the shelving unit
  const [unit, setUnit] = useState<ShelvingUnitState>({
    width: 3,
    height: 2,
    depth: 1,
    shelves: LAYOUTS.basic.shelves,
    showWireframe: false,
    material: "wood",
  })

  // Track drag distance for subdivision calculation
  const [dragStartPosition, setDragStartPosition] = useState<Record<string, number>>({})

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

  // Handle end of shelf drag
  const handleShelfDragEnd = () => {
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

  // Remove the last added shelf
  const removeShelf = () => {
    if (unit.shelves.length > 0) {
      setUnit((prev) => ({
        ...prev,
        shelves: prev.shelves.slice(0, -1),
      }))
    }
  }

  // Apply a predefined layout
  const applyLayout = (layout: keyof typeof LAYOUTS) => {
    setUnit((prev) => ({
      ...prev,
      shelves: LAYOUTS[layout].shelves,
    }))
  }

  // Reset to default size
  const resetUnit = () => {
    setUnit({
      width: 3,
      height: 2,
      depth: 1,
      shelves: LAYOUTS.basic.shelves,
      showWireframe: unit.showWireframe,
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

  // Change material
  const changeMaterial = (material: "wood" | "white" | "black") => {
    setUnit((prev) => ({
      ...prev,
      material,
    }))
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl">
      <div className="w-full h-[600px] bg-gray-800 rounded-lg overflow-hidden shadow-xl mb-6">
        <Canvas shadows>
          <Scene>
            <ShelvingUnitModel unit={unit} onShelfDrag={handleShelfDrag} onShelfDragEnd={handleShelfDragEnd} />
          </Scene>
        </Canvas>
      </div>

      <Tabs defaultValue="designer" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="designer">Designer</TabsTrigger>
          <TabsTrigger value="presets">Presets & Materials</TabsTrigger>
        </TabsList>
        <TabsContent value="designer" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="width" className="text-white">
                    Width: {unit.width.toFixed(1)}
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
                    Height: {unit.height.toFixed(1)}
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
                    Depth: {unit.depth.toFixed(1)}
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
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Shelves: {unit.shelves.length}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addShelf}>
                    Add Shelf
                  </Button>
                  <Button variant="outline" size="sm" onClick={removeShelf} disabled={unit.shelves.length === 0}>
                    Remove Shelf
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="showWireframe" checked={unit.showWireframe} onCheckedChange={toggleWireframe} />
                <Label htmlFor="showWireframe" className="text-white">
                  Show Wireframe
                </Label>
              </div>

              <div className="flex justify-between mt-4">
                <Button variant="outline" size="sm" onClick={resetUnit} className="flex items-center gap-1">
                  <RotateCcw className="h-4 w-4" />
                  Reset Unit
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="presets" className="pt-4">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-white mb-3 font-medium">Preset Layouts</h3>
              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => applyLayout("basic")}>
                  Basic (1 Shelf)
                </Button>
                <Button variant="outline" onClick={() => applyLayout("bookshelf")}>
                  Bookshelf (3 Shelves)
                </Button>
                <Button variant="outline" onClick={() => applyLayout("display")}>
                  Display (2 Shelves)
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-white mb-3 font-medium">Materials</h3>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => changeMaterial("wood")}
                  data-active={unit.material === "wood"}
                >
                  <div className="w-4 h-4 bg-[#A67C52] rounded-full"></div>
                  Wood
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => changeMaterial("white")}
                  data-active={unit.material === "white"}
                >
                  <div className="w-4 h-4 bg-[#F5F5F5] rounded-full"></div>
                  White
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => changeMaterial("black")}
                  data-active={unit.material === "black"}
                >
                  <div className="w-4 h-4 bg-[#333333] rounded-full"></div>
                  Black
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 text-sm text-gray-400 max-w-lg text-center">
        <p>
          <strong>How it works:</strong> Drag shelves up or down to reposition them. The further you drag a shelf from
          its original position, the more vertical divisions will automatically be created.
        </p>
      </div>
    </div>
  )
}
