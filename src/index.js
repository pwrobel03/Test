import "./styles.css";

import THREE, { OrbitControls } from "./three";
import CANNON from "cannon";
import { DiceManager, DiceD6 } from "threejs-dice/lib/dice";
import Stats from "stats.js";

// standard global variables
var container,
	scene,
	camera,
	renderer,
	controls,
	stats,
	world,
	dice = [];

init();

// FUNCTIONS
function init() {
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth,
		SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45,
		ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
		NEAR = 0.01,
		FAR = 20000;
	camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(-30, 30, -30);
	// RENDERER
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	container = document.getElementById("ThreeJS");
	container.appendChild(renderer.domElement);
	// EVENTS
	// CONTROLS
	controls = new OrbitControls(camera, renderer.domElement);
	// STATS
	stats = new Stats();
	stats.domElement.style.position = "absolute";
	stats.domElement.style.bottom = "0px";
	stats.domElement.style.zIndex = 100;
	container.appendChild(stats.domElement);

	let ambient = new THREE.AmbientLight("#ffffff", 0.3);
	scene.add(ambient);

	let directionalLight = new THREE.DirectionalLight("#ffffff", 0.5);
	directionalLight.position.x = -1000;
	directionalLight.position.y = 1000;
	directionalLight.position.z = 1000;
	scene.add(directionalLight);

	let light = new THREE.SpotLight(0xefdfd5, 1.3);
	light.position.y = 100;
	light.target.position.set(0, 0, 0);
	light.castShadow = true;
	light.shadow.camera.near = 50;
	light.shadow.camera.far = 110;
	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;
	scene.add(light);

	// FLOOR
	// var floorMaterial = new THREE.MeshPhongMaterial({
	// 	color: "#161616",
	// 	side: THREE.DoubleSide
	// });
	// var floorGeometry = new THREE.PlaneGeometry(30, 30, 10, 10);
	// var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	// floor.receiveShadow = true;
	// floor.rotation.x = Math.PI / 2;
	// scene.add(floor);

	////////////
	// CUSTOM //
	////////////
	world = new CANNON.World();

	world.gravity.set(0, -9.82 * 20, 0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 16;

	DiceManager.setWorld(world);

	//Floor
	let floorBody = new CANNON.Body({
		mass: 0,
		shape: new CANNON.Plane(),
		material: DiceManager.floorBodyMaterial
	});
	floorBody.quaternion.setFromAxisAngle(
		new CANNON.Vec3(1, 0, 0),
		-Math.PI / 2
	);
	world.add(floorBody);

	//Walls

	var colors = ["#ffffff", "#ffff00", "#00ff00", "#0000ff", "#ff00ff"];
	for (var i = 0; i < 1; i++) {
		var die = new DiceD6({ size: 3.5, backColor: colors[i] });
		scene.add(die.getObject());
		dice.push(die);
		setTimeout(randomDiceThrow(), 500);
	}

	function randomDiceThrow() {
		var diceValues = [];

		for (var i = 0; i < 1; i++) {
			let yRand = Math.random() * 20;
			dice[i].getObject().position.x = -15 - (i % 3) * 1.5;
			dice[i].getObject().position.y = 2 + Math.floor(i / 3) * 1.5;
			dice[i].getObject().position.z = -15 + (i % 3) * 1.5;
			dice[i].getObject().quaternion.x =
				((Math.random() * 90 - 45) * Math.PI) / 180;
			dice[i].getObject().quaternion.z =
				((Math.random() * 90 - 45) * Math.PI) / 180;
			dice[i].updateBodyFromMesh();
			let rand = Math.random() * 5;
			dice[i]
				.getObject()
				.body.velocity.set(25 + rand, 40 + yRand, 15 + rand);
			dice[i]
				.getObject()
				.body.angularVelocity.set(
					20 * Math.random() - 10,
					20 * Math.random() - 10,
					20 * Math.random() - 10
				);

			const test = Math.ceil(Math.random() * 5);
			diceValues.push({ dice: dice[i], value: test });
		}

		DiceManager.prepareValues(diceValues);
	}

	// document
	// .querySelector("#ThreeJS")
	// .addEventListener("click", randomDiceThrow);
	// setInterval(randomDiceThrow, 3000);
	// randomDiceThrow();

	requestAnimationFrame(animate);
}

function animate() {
	updatePhysics();
	render();
	update();

	requestAnimationFrame(animate);
}

function updatePhysics() {
	world.step(1.0 / 60.0);

	for (var i in dice) {
		dice[i].updateMeshFromBody();
	}
}

function update() {
	controls.update();
	stats.update();
}

function render() {
	renderer.render(scene, camera);
}
