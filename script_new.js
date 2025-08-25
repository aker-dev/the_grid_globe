// Fonction pour générer une grille triangulaire géodésique basée sur un icosaèdre
function generateTriangularGrid() {
  const points = [];
  const triangles = [];
  const arcs = [];
  const gridAltitude = 0.05;

  // Créer les 12 sommets d'un icosaèdre
  const phi = (1 + Math.sqrt(5)) / 2; // Nombre d'or
  const icosahedronVertices = [
    [0, 1, phi],
    [0, -1, phi],
    [0, 1, -phi],
    [0, -1, -phi],
    [1, phi, 0],
    [-1, phi, 0],
    [1, -phi, 0],
    [-1, -phi, 0],
    [phi, 0, 1],
    [-phi, 0, 1],
    [phi, 0, -1],
    [-phi, 0, -1],
  ];

  // Normaliser et convertir en coordonnées lat/lng
  icosahedronVertices.forEach((vertex, index) => {
    const [x, y, z] = vertex;
    const length = Math.sqrt(x * x + y * y + z * z);
    const nx = x / length;
    const ny = y / length;
    const nz = z / length;

    // Convertir en lat/lng
    const lat = (Math.asin(nz) * 180) / Math.PI;
    const lng = (Math.atan2(ny, nx) * 180) / Math.PI;

    points.push({
      lat: lat,
      lng: lng,
      id: `vertex_${index}`,
      altitude: gridAltitude,
      x: nx,
      y: ny,
      z: nz,
    });
  });

  // Définir les 20 faces triangulaires de l'icosaèdre
  const icosahedronFaces = [
    [0, 1, 8],
    [0, 8, 4],
    [0, 4, 5],
    [0, 5, 9],
    [0, 9, 1],
    [1, 9, 7],
    [1, 7, 6],
    [1, 6, 8],
    [8, 6, 10],
    [8, 10, 4],
    [4, 10, 2],
    [4, 2, 5],
    [5, 2, 11],
    [5, 11, 9],
    [9, 11, 7],
    [7, 11, 3],
    [7, 3, 6],
    [6, 3, 10],
    [10, 3, 2],
    [2, 3, 11],
  ];

  // Fonction pour subdiviser un triangle
  function subdivideTriangle(v1, v2, v3, depth) {
    if (depth === 0) {
      triangles.push([v1, v2, v3]);
      return;
    }

    // Calculer les points médians
    const mid12 = getMidpoint(v1, v2);
    const mid23 = getMidpoint(v2, v3);
    const mid31 = getMidpoint(v3, v1);

    // Subdiviser récursivement
    subdivideTriangle(v1, mid12, mid31, depth - 1);
    subdivideTriangle(v2, mid23, mid12, depth - 1);
    subdivideTriangle(v3, mid31, mid23, depth - 1);
    subdivideTriangle(mid12, mid23, mid31, depth - 1);
  }

  // Fonction pour obtenir le point médian normalisé
  function getMidpoint(p1, p2) {
    const key = `${Math.min(p1.id, p2.id)}_${Math.max(p1.id, p2.id)}`;

    // Vérifier si ce point médian existe déjà
    const existing = points.find((p) => p.id === key);
    if (existing) return existing;

    // Calculer le point médian en 3D
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const mz = (p1.z + p2.z) / 2;

    // Normaliser pour projeter sur la sphère
    const length = Math.sqrt(mx * mx + my * my + mz * mz);
    const nx = mx / length;
    const ny = my / length;
    const nz = mz / length;

    // Convertir en lat/lng
    const lat = (Math.asin(nz) * 180) / Math.PI;
    const lng = (Math.atan2(ny, nx) * 180) / Math.PI;

    const midpoint = {
      lat: lat,
      lng: lng,
      id: key,
      altitude: gridAltitude,
      x: nx,
      y: ny,
      z: nz,
    };

    points.push(midpoint);
    return midpoint;
  }

  // Subdiviser chaque face de l'icosaèdre
  const subdivisionLevel = 2; // Niveau de subdivision (2 = assez dense)
  icosahedronFaces.forEach((face) => {
    const [i1, i2, i3] = face;
    subdivideTriangle(points[i1], points[i2], points[i3], subdivisionLevel);
  });

  // Créer les arcs à partir des triangles
  const edges = new Set();
  triangles.forEach((triangle) => {
    const [p1, p2, p3] = triangle;

    // Ajouter les trois arêtes du triangle
    const edge1 = `${Math.min(p1.id, p2.id)}_${Math.max(p1.id, p2.id)}`;
    const edge2 = `${Math.min(p2.id, p3.id)}_${Math.max(p2.id, p3.id)}`;
    const edge3 = `${Math.min(p3.id, p1.id)}_${Math.max(p3.id, p1.id)}`;

    [edge1, edge2, edge3].forEach((edge) => {
      if (!edges.has(edge)) {
        edges.add(edge);
        const [id1, id2] = edge.split("_");
        const point1 = points.find((p) => p.id === id1);
        const point2 = points.find((p) => p.id === id2);

        if (point1 && point2) {
          arcs.push({
            startLat: point1.lat,
            startLng: point1.lng,
            endLat: point2.lat,
            endLng: point2.lng,
            altitude: gridAltitude,
          });
        }
      }
    });
  });

  return { points, arcs };
}

// Générer les données de la grille
const gridData = generateTriangularGrid();

const world = Globe()(document.getElementById("globeViz"))
  .globeImageUrl("./img/earth-topology.png")
  .backgroundImageUrl("./img/night-sky.png")
  .width(window.innerWidth)
  .height(window.innerHeight)
  // Ajouter les points de la grille
  .pointsData(gridData.points)
  .pointColor(() => "#00ffff")
  .pointRadius(0.1)
  .pointAltitude((d) => d.altitude)
  .pointResolution(6)
  // Ajouter les arcs de la grille
  .arcsData(gridData.arcs)
  .arcColor(() => "#00ffff")
  .arcAltitude((d) => d.altitude)
  .arcStroke(0.05);

world;
