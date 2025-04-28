"use client"

import { Text } from "@react-three/drei"
import * as THREE from "three"
import { useMemo, useRef } from "react"

// Conversion factor from abstract units to millimeters
// This makes 1 unit = 1000mm (1 meter)
const UNIT_TO_MM = 1000

// Component to display a dimension line with proper technical drawing elements
export function DimensionLine({
  start,
  end,
  offset = 0.1,
  offsetDirection = [0, 0, 1],
  color = "#ffffff",
  fontSize = 0.05,
  unit = "mm",
  thickness = 0.5,
  arrowSize = 0.04,
  extensionLineOffset = 0.03,
}: {
  start: [number, number, number]
  end: [number, number, number]
  offset?: number
  offsetDirection?: [number, number, number]
  color?: string
  fontSize?: number
  unit?: string
  thickness?: number
  arrowSize?: number
  extensionLineOffset?: number
}) {
  // References for the lines
  const dimensionLineRef = useRef<THREE.Line>(null)
  const extensionLine1Ref = useRef<THREE.Line>(null)
  const extensionLine2Ref = useRef<THREE.Line>(null)
  const arrow1Ref = useRef<THREE.Line>(null)
  const arrow2Ref = useRef<THREE.Line>(null)
  const textRef = useRef<any>(null)

  // Calculate the offset points
  const offsetVec = new THREE.Vector3(...offsetDirection).normalize().multiplyScalar(offset)
  const startPoint = new THREE.Vector3(...start).add(offsetVec)
  const endPoint = new THREE.Vector3(...end).add(offsetVec)

  // Calculate the midpoint for the label
  const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5)

  // Calculate the length in mm
  const length = startPoint.distanceTo(endPoint) * UNIT_TO_MM
  const displayValue = Math.round(length)

  // Calculate the direction for the dimension line
  const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize()

  // Calculate perpendicular direction for extension lines
  const perpendicular = new THREE.Vector3(direction.y, -direction.x, 0).normalize()
  if (Math.abs(direction.y) < 0.1 && Math.abs(direction.x) < 0.1) {
    // If direction is mostly along Z axis, use a different perpendicular
    perpendicular.set(1, 0, 0)
  }

  // Calculate points for the extension lines with offset
  const extensionOffset = perpendicular.clone().multiplyScalar(extensionLineOffset)
  const startExtA = new THREE.Vector3(...start).add(extensionOffset)
  const startExtB = startPoint.clone().add(extensionOffset)
  const endExtA = new THREE.Vector3(...end).add(extensionOffset)
  const endExtB = endPoint.clone().add(extensionOffset)

  // Calculate points for the arrows
  const arrowAngle = Math.PI / 6 // 30 degrees
  const arrowAxis = new THREE.Vector3(0, 0, 1)

  // First arrow (at start point)
  const arrow1Dir = direction.clone()
  const arrow1Point1 = arrow1Dir.clone().applyAxisAngle(arrowAxis, arrowAngle).multiplyScalar(arrowSize).add(startPoint)
  const arrow1Point2 = arrow1Dir
    .clone()
    .applyAxisAngle(arrowAxis, -arrowAngle)
    .multiplyScalar(arrowSize)
    .add(startPoint)

  // Second arrow (at end point)
  const arrow2Dir = direction.clone().negate()
  const arrow2Point1 = arrow2Dir.clone().applyAxisAngle(arrowAxis, arrowAngle).multiplyScalar(arrowSize).add(endPoint)
  const arrow2Point2 = arrow2Dir.clone().applyAxisAngle(arrowAxis, -arrowAngle).multiplyScalar(arrowSize).add(endPoint)

  // Create geometries
  const dimensionLineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([startPoint.x, startPoint.y, startPoint.z, endPoint.x, endPoint.y, endPoint.z])
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [startPoint.x, startPoint.y, startPoint.z, endPoint.x, endPoint.y, endPoint.z])

  const extensionLine1Geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([startExtA.x, startExtA.y, startExtA.z, startExtB.x, startExtB.y, startExtB.z])
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [startExtA.x, startExtA.y, startExtA.z, startExtB.x, startExtB.y, startExtB.z])

  const extensionLine2Geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([endExtA.x, endExtA.y, endExtA.z, endExtB.x, endExtB.y, endExtB.z])
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [endExtA.x, endExtA.y, endExtA.z, endExtB.x, endExtB.y, endExtB.z])

  const arrow1Geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([
      startPoint.x,
      startPoint.y,
      startPoint.z,
      arrow1Point1.x,
      arrow1Point1.y,
      arrow1Point1.z,
      startPoint.x,
      startPoint.y,
      startPoint.z,
      arrow1Point2.x,
      arrow1Point2.y,
      arrow1Point2.z,
    ])
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [
    startPoint.x,
    startPoint.y,
    startPoint.z,
    arrow1Point1.x,
    arrow1Point1.y,
    arrow1Point1.z,
    arrow1Point2.x,
    arrow1Point2.y,
    arrow1Point2.z,
  ])

  const arrow2Geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([
      endPoint.x,
      endPoint.y,
      endPoint.z,
      arrow2Point1.x,
      arrow2Point1.y,
      arrow2Point1.z,
      endPoint.x,
      endPoint.y,
      endPoint.z,
      arrow2Point2.x,
      arrow2Point2.y,
      arrow2Point2.z,
    ])
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [
    endPoint.x,
    endPoint.y,
    endPoint.z,
    arrow2Point1.x,
    arrow2Point1.y,
    arrow2Point1.z,
    arrow2Point2.x,
    arrow2Point2.y,
    arrow2Point2.z,
  ])

  // Create material
  const lineMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({ color, linewidth: thickness })
  }, [color, thickness])

  return (
    <group>
      {/* Dimension line */}
      <line ref={dimensionLineRef} geometry={dimensionLineGeometry} material={lineMaterial} />

      {/* Extension lines */}
      <line ref={extensionLine1Ref} geometry={extensionLine1Geometry} material={lineMaterial} />
      <line ref={extensionLine2Ref} geometry={extensionLine2Geometry} material={lineMaterial} />

      {/* Arrowheads */}
      <line ref={arrow1Ref} geometry={arrow1Geometry} material={lineMaterial} />
      <line ref={arrow2Ref} geometry={arrow2Geometry} material={lineMaterial} />

      {/* Dimension text */}
      <Text
        ref={textRef}
        position={[midPoint.x, midPoint.y, midPoint.z]}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.004}
        outlineColor="#000000"
        depthOffset={1}
      >
        {`${displayValue}${unit}`}
      </Text>
    </group>
  )
}

// Component to display all dimensions for the shelving unit
export function DimensionLabels({
  width,
  height,
  depth,
  thickness,
}: {
  width: number
  height: number
  depth: number
  thickness: number
}) {
  // Calculate half dimensions
  const halfWidth = width / 2
  const halfHeight = height / 2
  const halfDepth = depth / 2

  return (
    <group>
      {/* Width dimension (front) */}
      <DimensionLine
        start={[-halfWidth, -halfHeight - 0.1, halfDepth]}
        end={[halfWidth, -halfHeight - 0.1, halfDepth]}
        offset={0.05}
        offsetDirection={[0, -1, 0]}
      />

      {/* Height dimension (front right) */}
      <DimensionLine
        start={[halfWidth + 0.1, -halfHeight, halfDepth]}
        end={[halfWidth + 0.1, halfHeight, halfDepth]}
        offset={0.05}
        offsetDirection={[1, 0, 0]}
      />

      {/* Depth dimension (top right) */}
      <DimensionLine
        start={[halfWidth, halfHeight + 0.1, halfDepth]}
        end={[halfWidth, halfHeight + 0.1, -halfDepth]}
        offset={0.05}
        offsetDirection={[0, 1, 0]}
      />

      {/* Thickness dimension (front right) */}
      <DimensionLine
        start={[halfWidth - thickness, -halfHeight + 0.2, halfDepth + 0.05]}
        end={[halfWidth, -halfHeight + 0.2, halfDepth + 0.05]}
        offset={0.02}
        offsetDirection={[0, 1, 1]}
        fontSize={0.04}
      />
    </group>
  )
}

// Component for a rectangle with thickness
function RectWithThickness({
  width,
  height,
  thickness,
  position = [0, 0, 0],
  color = "#ffffff",
  hiddenLineColor = "#888888",
}: {
  width: number
  height: number
  thickness: number
  position?: [number, number, number]
  color?: string
  hiddenLineColor?: string
}) {
  const [x, y, z] = position
  const halfWidth = width / 2
  const halfHeight = height / 2
  const halfThickness = thickness / 2

  // Outer rectangle
  const outerRectGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([
      -halfWidth,
      -halfHeight,
      0,
      halfWidth,
      -halfHeight,
      0,
      halfWidth,
      halfHeight,
      0,
      -halfWidth,
      halfHeight,
      0,
      -halfWidth,
      -halfHeight,
      0,
    ])
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [halfWidth, halfHeight])

  // Inner rectangle
  const innerRectGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([
      -halfWidth + thickness,
      -halfHeight + thickness,
      0,
      halfWidth - thickness,
      -halfHeight + thickness,
      0,
      halfWidth - thickness,
      halfHeight - thickness,
      0,
      -halfWidth + thickness,
      halfHeight - thickness,
      0,
      -halfWidth + thickness,
      -halfHeight + thickness,
      0,
    ])
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [halfWidth, halfHeight, thickness])

  // Connecting lines
  const connectingLinesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([
      // Bottom left
      -halfWidth,
      -halfHeight,
      0,
      -halfWidth + thickness,
      -halfHeight + thickness,
      0,

      // Bottom right
      halfWidth,
      -halfHeight,
      0,
      halfWidth - thickness,
      -halfHeight + thickness,
      0,

      // Top right
      halfWidth,
      halfHeight,
      0,
      halfWidth - thickness,
      halfHeight - thickness,
      0,

      // Top left
      -halfWidth,
      halfHeight,
      0,
      -halfWidth + thickness,
      halfHeight - thickness,
      0,
    ])
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [halfWidth, halfHeight, thickness])

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({ color }), [color])

  return (
    <group position={[x, y, z]}>
      <line geometry={outerRectGeometry} material={lineMaterial} />
      <line geometry={innerRectGeometry} material={lineMaterial} />
      <line geometry={connectingLinesGeometry} material={lineMaterial} />
    </group>
  )
}

// Component for a line with thickness
function LineWithThickness({
  start,
  end,
  thickness,
  color = "#ffffff",
}: {
  start: [number, number, number]
  end: [number, number, number]
  thickness: number
  color?: string
}) {
  const startVec = new THREE.Vector3(...start)
  const endVec = new THREE.Vector3(...end)
  const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize()

  // Calculate perpendicular direction
  const perpendicular = new THREE.Vector3(direction.y, -direction.x, 0).normalize()
  if (Math.abs(direction.y) < 0.1 && Math.abs(direction.x) < 0.1) {
    // If direction is mostly along Z axis, use a different perpendicular
    perpendicular.set(1, 0, 0)
  }

  const halfThickness = thickness / 2
  const offset = perpendicular.clone().multiplyScalar(halfThickness)

  const start1 = startVec.clone().add(offset)
  const start2 = startVec.clone().sub(offset)
  const end1 = endVec.clone().add(offset)
  const end2 = endVec.clone().sub(offset)

  // Main line
  const mainLineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([startVec.x, startVec.y, startVec.z, endVec.x, endVec.y, endVec.z])
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [startVec.x, startVec.y, startVec.z, endVec.x, endVec.y, endVec.z])

  // Thickness lines
  const thicknessLinesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array([
      // Top line
      start1.x,
      start1.y,
      start1.z,
      end1.x,
      end1.y,
      end1.z,

      // Bottom line
      start2.x,
      start2.y,
      start2.z,
      end2.x,
      end2.y,
      end2.z,

      // Start cap
      start1.x,
      start1.y,
      start1.z,
      start2.x,
      start2.y,
      start2.z,

      // End cap
      end1.x,
      end1.y,
      end1.z,
      end2.x,
      end2.y,
      end2.z,
    ])
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [start1.x, start1.y, start1.z, end1.x, end1.y, end1.z, start2.x, start2.y, start2.z, end2.x, end2.y, end2.z])

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({ color }), [color])

  return (
    <group>
      <line geometry={mainLineGeometry} material={lineMaterial} />
      <line geometry={thicknessLinesGeometry} material={lineMaterial} />
    </group>
  )
}

// Component for orthographic views with dimensions
export function OrthographicViews({
  width,
  height,
  depth,
  thickness,
  shelves,
  columns,
  material,
}: {
  width: number
  height: number
  depth: number
  thickness: number
  shelves: Array<{ position: number; divisions: number }>
  columns: Array<{ position: number; divisions: number }>
  material: string
}) {
  // Calculate half dimensions
  const halfWidth = width / 2
  const halfHeight = height / 2
  const halfDepth = depth / 2

  // Calculate real-world dimensions in millimeters
  const widthMM = Math.round(width * UNIT_TO_MM)
  const heightMM = Math.round(height * UNIT_TO_MM)
  const depthMM = Math.round(depth * UNIT_TO_MM)
  const thicknessMM = Math.round(thickness * UNIT_TO_MM)

  // Colors for different views
  const viewColors = {
    outline: "#ffffff",
    hiddenLine: "#888888",
    dimension: "#4a9eff",
    text: "#ffffff",
    fill: "#333333",
  }

  // Calculate shelf positions
  const shelfPositions = shelves.map((shelf) => -halfHeight + shelf.position * height)

  // Calculate column positions
  const columnPositions = columns.map((column) => -halfWidth + column.position * width)

  return (
    <group>
      {/* Top View (looking down from top) - positioned at the top */}
      <group position={[0, height + 0.5, 0]}>
        <Text position={[0, 0.3, 0]} fontSize={0.1} color={viewColors.text} anchorX="center" anchorY="middle">
          Top View
        </Text>

        {/* Outer frame with thickness */}
        <RectWithThickness
          width={width}
          height={depth}
          thickness={thickness}
          position={[0, 0, 0]}
          color={viewColors.outline}
          hiddenLineColor={viewColors.hiddenLine}
        />

        {/* Columns (vertical dividers) */}
        {columnPositions.map((x, i) => (
          <LineWithThickness
            key={`top-column-${i}`}
            start={[x, -halfDepth + thickness, 0]}
            end={[x, halfDepth - thickness, 0]}
            thickness={thickness}
            color={viewColors.outline}
          />
        ))}

        {/* Width dimension */}
        <DimensionLine
          start={[-halfWidth, halfDepth + 0.2, 0]}
          end={[halfWidth, halfDepth + 0.2, 0]}
          offset={0.05}
          offsetDirection={[0, 1, 0]}
          color={viewColors.dimension}
        />

        {/* Depth dimension */}
        <DimensionLine
          start={[halfWidth + 0.2, -halfDepth, 0]}
          end={[halfWidth + 0.2, halfDepth, 0]}
          offset={0.05}
          offsetDirection={[1, 0, 0]}
          color={viewColors.dimension}
        />

        {/* Thickness dimension */}
        <DimensionLine
          start={[-halfWidth + thickness / 2, -halfDepth - 0.1, 0]}
          end={[-halfWidth + thickness * 1.5, -halfDepth - 0.1, 0]}
          offset={0.03}
          offsetDirection={[0, -1, 0]}
          color={viewColors.dimension}
          fontSize={0.04}
        />
      </group>

      {/* Front View (looking from front) - positioned at the front */}
      <group position={[0, 0, depth + 0.5]}>
        <Text
          position={[0, halfHeight + 0.3, 0]}
          fontSize={0.1}
          color={viewColors.text}
          anchorX="center"
          anchorY="middle"
        >
          Front View
        </Text>

        {/* Outer frame with thickness */}
        <RectWithThickness
          width={width}
          height={height}
          thickness={thickness}
          position={[0, 0, 0]}
          color={viewColors.outline}
          hiddenLineColor={viewColors.hiddenLine}
        />

        {/* Shelves (horizontal dividers) with thickness */}
        {shelfPositions.map((y, i) => (
          <LineWithThickness
            key={`front-shelf-${i}`}
            start={[-halfWidth + thickness, y, 0]}
            end={[halfWidth - thickness, y, 0]}
            thickness={thickness}
            color={viewColors.outline}
          />
        ))}

        {/* Columns (vertical dividers) with thickness */}
        {columnPositions.map((x, i) => (
          <LineWithThickness
            key={`front-column-${i}`}
            start={[x, -halfHeight + thickness, 0]}
            end={[x, halfHeight - thickness, 0]}
            thickness={thickness}
            color={viewColors.outline}
          />
        ))}

        {/* Width dimension */}
        <DimensionLine
          start={[-halfWidth, -halfHeight - 0.2, 0]}
          end={[halfWidth, -halfHeight - 0.2, 0]}
          offset={0.05}
          offsetDirection={[0, -1, 0]}
          color={viewColors.dimension}
        />

        {/* Height dimension */}
        <DimensionLine
          start={[halfWidth + 0.2, -halfHeight, 0]}
          end={[halfWidth + 0.2, halfHeight, 0]}
          offset={0.05}
          offsetDirection={[1, 0, 0]}
          color={viewColors.dimension}
        />

        {/* Thickness dimension */}
        <DimensionLine
          start={[-halfWidth, -halfHeight + thickness / 2, 0]}
          end={[-halfWidth, -halfHeight + thickness * 1.5, 0]}
          offset={0.03}
          offsetDirection={[-1, 0, 0]}
          color={viewColors.dimension}
          fontSize={0.04}
        />
      </group>

      {/* Side View (looking from right) - positioned at the right */}
      <group position={[width + 0.5, 0, 0]}>
        <Text
          position={[0, halfHeight + 0.3, 0]}
          fontSize={0.1}
          color={viewColors.text}
          anchorX="center"
          anchorY="middle"
        >
          Side View
        </Text>

        {/* Outer frame with thickness */}
        <RectWithThickness
          width={depth}
          height={height}
          thickness={thickness}
          position={[0, 0, 0]}
          color={viewColors.outline}
          hiddenLineColor={viewColors.hiddenLine}
        />

        {/* Shelves (horizontal dividers) with thickness */}
        {shelfPositions.map((y, i) => (
          <LineWithThickness
            key={`side-shelf-${i}`}
            start={[-halfDepth + thickness, y, 0]}
            end={[halfDepth - thickness, y, 0]}
            thickness={thickness}
            color={viewColors.outline}
          />
        ))}

        {/* Depth dimension */}
        <DimensionLine
          start={[-halfDepth, -halfHeight - 0.2, 0]}
          end={[halfDepth, -halfHeight - 0.2, 0]}
          offset={0.05}
          offsetDirection={[0, -1, 0]}
          color={viewColors.dimension}
        />

        {/* Height dimension */}
        <DimensionLine
          start={[halfDepth + 0.2, -halfHeight, 0]}
          end={[halfDepth + 0.2, halfHeight, 0]}
          offset={0.05}
          offsetDirection={[1, 0, 0]}
          color={viewColors.dimension}
        />

        {/* Thickness dimension */}
        <DimensionLine
          start={[-halfDepth, -halfHeight + thickness / 2, 0]}
          end={[-halfDepth, -halfHeight + thickness * 1.5, 0]}
          offset={0.03}
          offsetDirection={[-1, 0, 0]}
          color={viewColors.dimension}
          fontSize={0.04}
        />
      </group>
    </group>
  )
}
