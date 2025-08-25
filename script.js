let scene, camera, renderer, globe, controls;
let continentPoints = [];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000814);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;
    
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('container').appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
    
    createGlobe();
    createContinentPoints();
    setupControls();
    
    window.addEventListener('resize', onWindowResize, false);
    animate();
}

function createGlobe() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        color: 0x001122,
        transparent: true,
        opacity: 0.8,
        shininess: 100
    });
    
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
}

function createContinentPoints() {
    const continentData = getContinentData();
    const pointGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    continentData.forEach(continent => {
        continent.points.forEach(point => {
            const { x, y, z } = latLonToVector3(point.lat, point.lon, 1.02);
            positions.push(x, y, z);
            colors.push(...continent.color);
        });
    });
    
    pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    pointGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const pointMaterial = new THREE.PointsMaterial({
        size: 0.015,
        vertexColors: true,
        transparent: true,
        opacity: 0.9
    });
    
    const points = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(points);
    continentPoints.push(points);
}

function getContinentData() {
    return [
        {
            name: 'North America',
            color: [1, 0.2, 0.2],
            points: generateContinentPoints([
                {lat: 70, lon: -100}, {lat: 60, lon: -165}, {lat: 55, lon: -130},
                {lat: 50, lon: -100}, {lat: 45, lon: -75}, {lat: 40, lon: -95},
                {lat: 35, lon: -105}, {lat: 30, lon: -95}, {lat: 25, lon: -80},
                {lat: 20, lon: -100}, {lat: 15, lon: -90}, {lat: 65, lon: -60}
            ])
        },
        {
            name: 'South America',
            color: [0.2, 1, 0.2],
            points: generateContinentPoints([
                {lat: 10, lon: -70}, {lat: 0, lon: -60}, {lat: -10, lon: -65},
                {lat: -20, lon: -60}, {lat: -30, lon: -65}, {lat: -40, lon: -70},
                {lat: -50, lon: -75}, {lat: 5, lon: -75}, {lat: -15, lon: -50}
            ])
        },
        {
            name: 'Europe',
            color: [0.2, 0.2, 1],
            points: generateContinentPoints([
                {lat: 70, lon: 25}, {lat: 65, lon: 15}, {lat: 60, lon: 10},
                {lat: 55, lon: 20}, {lat: 50, lon: 5}, {lat: 45, lon: 15},
                {lat: 40, lon: 20}, {lat: 60, lon: 30}, {lat: 50, lon: 40}
            ])
        },
        {
            name: 'Africa',
            color: [1, 1, 0.2],
            points: generateContinentPoints([
                {lat: 35, lon: 10}, {lat: 20, lon: 0}, {lat: 10, lon: 20},
                {lat: 0, lon: 25}, {lat: -10, lon: 30}, {lat: -20, lon: 25},
                {lat: -30, lon: 20}, {lat: 15, lon: 40}, {lat: 5, lon: 45}
            ])
        },
        {
            name: 'Asia',
            color: [1, 0.2, 1],
            points: generateContinentPoints([
                {lat: 70, lon: 100}, {lat: 60, lon: 120}, {lat: 50, lon: 80},
                {lat: 40, lon: 100}, {lat: 30, lon: 120}, {lat: 20, lon: 100},
                {lat: 10, lon: 110}, {lat: 40, lon: 60}, {lat: 50, lon: 140}
            ])
        },
        {
            name: 'Australia',
            color: [0.2, 1, 1],
            points: generateContinentPoints([
                {lat: -10, lon: 130}, {lat: -20, lon: 140}, {lat: -30, lon: 135},
                {lat: -25, lon: 120}, {lat: -15, lon: 125}
            ])
        }
    ];
}

function generateContinentPoints(basePoints) {
    const points = [];
    basePoints.forEach(point => {
        points.push(point);
        for (let i = 0; i < 15; i++) {
            points.push({
                lat: point.lat + (Math.random() - 0.5) * 10,
                lon: point.lon + (Math.random() - 0.5) * 15
            });
        }
    });
    return points;
}

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return { x, y, z };
}

function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.autoRotate = false;
}

function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    
    globe.rotation.y += 0.005;
    continentPoints.forEach(points => {
        points.rotation.y += 0.005;
    });
    
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);