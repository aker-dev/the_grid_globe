// Fonction pour générer une grille triangulaire géodésique
function generateTriangularGrid() {
  const points = [];
  const arcs = [];

  // Paramètres de la grille
  const divisions = 16; // Nombre de divisions par hémisphère
  const gridAltitude = 0.05; // Altitude de la grille au-dessus du globe

  // Générer les points de la grille en utilisant une subdivision icosaédrique
  for (let lat = -90; lat <= 90; lat += 180 / divisions) {
    const numLongPoints = Math.max(
      1,
      Math.round(Math.cos((lat * Math.PI) / 180) * divisions * 2)
    );
    for (let i = 0; i < numLongPoints; i++) {
      const lng = (i / numLongPoints) * 360 - 180;
      points.push({
        lat: lat,
        lng: lng,
        id: `${lat}_${lng}`,
        altitude: gridAltitude,
      });
    }
  }

  // Générer les arcs pour créer la structure triangulaire
  points.forEach((point, index) => {
    points.forEach((otherPoint, otherIndex) => {
      if (index < otherIndex) {
        const distance = Math.sqrt(
          Math.pow(point.lat - otherPoint.lat, 2) +
            Math.pow(point.lng - otherPoint.lng, 2)
        );

        // Connecter les points proches pour former des triangles
        if (distance < 25 && distance > 5) {
          arcs.push({
            startLat: point.lat,
            startLng: point.lng,
            endLat: otherPoint.lat,
            endLng: otherPoint.lng,
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
  .arcStroke(0.05)
  .arcDashLength(0.1)
  .arcDashGap(0.05)
  .arcDashAnimateTime(2000);

world;
