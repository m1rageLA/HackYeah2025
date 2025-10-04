import L from 'leaflet'

const CRS = L.CRS.EPSG3857

const toPoint = (latlng) => CRS.project(L.latLng(latlng.lat, latlng.lng))
const toLatLng = (point) => {
  const latLng = CRS.unproject(point)
  return { lat: latLng.lat, lng: latLng.lng }
}

const ensurePathPair = (startPath, targetPath) => {
  const maxLength = Math.max(startPath.length, targetPath.length)
  const safeStart = [...startPath]
  const safeTarget = [...targetPath]

  while (safeStart.length < maxLength) {
    safeStart.push(safeStart[safeStart.length - 1])
  }

  while (safeTarget.length < maxLength) {
    safeTarget.push(safeTarget[safeTarget.length - 1] ?? safeStart[safeTarget.length - 1])
  }

  return [safeStart, safeTarget]
}

export const interpolatePath = (startPath, targetPath, progress) => {
  if (!Array.isArray(startPath) || startPath.length === 0) {
    return []
  }

  const [start, target] = ensurePathPair(startPath, targetPath)
  const clampedProgress = Math.max(0, Math.min(1, progress))

  return start.map((startPoint, index) => {
    const targetPoint = target[index] ?? startPoint
    return {
      lat: startPoint.lat + (targetPoint.lat - startPoint.lat) * clampedProgress,
      lng: startPoint.lng + (targetPoint.lng - startPoint.lng) * clampedProgress,
    }
  })
}

const computeVertexOffsets = (projectedPath, halfWidth) => {
  if (projectedPath.length < 2) {
    return projectedPath.map(() => ({ x: 0, y: 0 }))
  }

  const accumNormals = projectedPath.map(() => ({ x: 0, y: 0 }))

  for (let index = 0; index < projectedPath.length - 1; index += 1) {
    const current = projectedPath[index]
    const next = projectedPath[index + 1]
    const dx = next.x - current.x
    const dy = next.y - current.y
    const length = Math.hypot(dx, dy)

    if (length === 0) {
      continue
    }

    const nx = -dy / length
    const ny = dx / length

    accumNormals[index].x += nx
    accumNormals[index].y += ny
    accumNormals[index + 1].x += nx
    accumNormals[index + 1].y += ny
  }

  return accumNormals.map((normal) => {
    const magnitude = Math.hypot(normal.x, normal.y)
    if (magnitude === 0) {
      return { x: 0, y: 0 }
    }
    return {
      x: (normal.x / magnitude) * halfWidth,
      y: (normal.y / magnitude) * halfWidth,
    }
  })
}

export const createFrontBand = (path, widthMeters = 12000) => {
  if (!Array.isArray(path) || path.length < 2) {
    return null
  }

  const halfWidth = widthMeters / 2
  const projected = path.map((point) => toPoint(point))
  const offsets = computeVertexOffsets(projected, halfWidth)

  const upper = projected.map((point, index) => {
    return toLatLng({ x: point.x + offsets[index].x, y: point.y + offsets[index].y })
  })

  const lower = projected
    .map((point, index) => {
      return toLatLng({ x: point.x - offsets[index].x, y: point.y - offsets[index].y })
    })
    .reverse()

  return [...upper, ...lower]
}

const computePathSegments = (path) => {
  if (!Array.isArray(path) || path.length < 2) {
    return null
  }

  const projected = path.map((point) => toPoint(point))
  const segments = []
  let totalLength = 0

  for (let index = 0; index < projected.length - 1; index += 1) {
    const current = projected[index]
    const next = projected[index + 1]
    const dx = next.x - current.x
    const dy = next.y - current.y
    const length = Math.hypot(dx, dy)

    if (length === 0) {
      continue
    }

    const segment = {
      start: current,
      end: next,
      dx,
      dy,
      length,
      normal: { x: -dy / length, y: dx / length },
    }

    segments.push(segment)
    totalLength += length
  }

  if (segments.length === 0) {
    return null
  }

  return { segments, totalLength, projected }
}

export const getPointAlongPath = (path, fraction = 0.5) => {
  const data = computePathSegments(path)
  if (!data) {
    const point = path[0] ?? { lat: 0, lng: 0 }
    return {
      position: point,
      normal: { x: 0, y: 0 },
      bearing: 0,
    }
  }

  const targetDistance = data.totalLength * Math.max(0, Math.min(1, fraction))
  let distanceTraversed = 0

  for (let index = 0; index < data.segments.length; index += 1) {
    const segment = data.segments[index]
    if (distanceTraversed + segment.length >= targetDistance) {
      const remaining = targetDistance - distanceTraversed
      const ratio = remaining / segment.length

      const point = {
        x: segment.start.x + segment.dx * ratio,
        y: segment.start.y + segment.dy * ratio,
      }

      const normal = segment.normal
      const latLng = toLatLng(point)
      const bearing = (Math.atan2(segment.dx, segment.dy) * 180) / Math.PI
      return {
        position: latLng,
        normal,
        bearing: (bearing + 360) % 360,
      }
    }

    distanceTraversed += segment.length
  }

  const lastSegment = data.segments[data.segments.length - 1]
  const latLng = toLatLng(lastSegment.end)
  const bearing = (Math.atan2(lastSegment.dx, lastSegment.dy) * 180) / Math.PI
  return {
    position: latLng,
    normal: lastSegment.normal,
    bearing: (bearing + 360) % 360,
  }
}

export const getPointWithDepth = (path, fraction = 0.5, depthMeters = 0) => {
  const base = getPointAlongPath(path, fraction)
  const offsetX = base.normal.x * depthMeters
  const offsetY = base.normal.y * depthMeters
  const projectedBase = toPoint(base.position)
  const offsetPoint = {
    x: projectedBase.x + offsetX,
    y: projectedBase.y + offsetY,
  }

  return {
    position: toLatLng(offsetPoint),
    normal: base.normal,
    bearing: base.bearing,
  }
}

export const buildFrontGeometry = (front) => {
  const path = interpolatePath(front.startPath, front.advancePath, front.progress)
  const band = createFrontBand(path, front.width)
  const midpoint = getPointWithDepth(path, 0.5, 0)

  return {
    ...front,
    path,
    band,
    labelPosition: midpoint.position,
    bearing: midpoint.bearing,
  }
}

export const getFrontGeometries = (fronts) => fronts.map((front) => buildFrontGeometry(front))

export const deriveDivisionPosition = (division, fronts) => {
  if (!division.assignment) {
    return {
      ...division,
      displayPosition: division.position,
      bearing: 0,
    }
  }

  const front = fronts.find((entry) => entry.id === division.assignment.frontId)
  if (!front || !front.path || front.path.length < 2) {
    return {
      ...division,
      displayPosition: division.position,
      bearing: 0,
    }
  }

  const anchor = typeof division.assignment.anchor === 'number' ? division.assignment.anchor : 0.5
  const depth = division.assignment.depth ?? -4000
  const point = getPointWithDepth(front.path, anchor, depth)

  return {
    ...division,
    displayPosition: point.position,
    bearing: point.bearing,
  }
}

export const getDivisionViewModels = (divisions, fronts) =>
  divisions.map((division) => deriveDivisionPosition(division, fronts))

