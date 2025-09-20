const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2", { antialias: true });
if (!gl) alert("WebGL 2 not supported");
const actualAntialias = gl.getContextAttributes().antialias;
console.log("Antialiasing enabled:", actualAntialias); // Check if antialiasing is supported
let addPlanet = false;
let isCreatingPlanet = false;
let creatingPlanetIndex;
let glowEffectEnabled = true;
export let velocityList = [];
export let timeStep = 0.005; // Default time step value
let toggleGlowButton = document.getElementById("toggleGlowEffect");
const fragmentShaderSource = await fetchShaderSource("fragmentShader.glsl");
const vertexShaderSource = await fetchShaderSource("vertexShader.glsl");
import { displayGraph } from "./graphResults.js";
// fetch shaders from seperate files
async function fetchShaderSource(url) {
	const response = await fetch(url);
	return await response.text();
}

//  Compile Shaders
function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(
	gl,
	gl.FRAGMENT_SHADER,
	fragmentShaderSource
);

// === Create Program Using Shaders
function createProgram(gl, vertexShader, fragmentShader) {
	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		return null;
	}
	return program;
}

const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);
const uGlowStrength = gl.getUniformLocation(program, "uGlowStrength");
gl.uniform1f(uGlowStrength, 2.0); // Try values between 1.5 and 4.0 for different glow strengths
const aPosition = gl.getAttribLocation(program, "aPosition");
let zoom = 0.01,
	panX = 0,
	panY = 0; // Initialize zoom and pan variables for the camera
const uView = gl.getUniformLocation(program, "uView"); //set the uniform location for the view matrix
let dragging = false;

canvas.addEventListener("wheel", function (e) {
	e.preventDefault();
	// Zoom in/out, when the mouse wheel is scrolled
	zoom *= e.deltaY > 0 ? 0.9 : 1.1;
	zoom = Math.max(0.001, Math.min(zoom, 0.1));
	gl.uniformMatrix3fv(uView, false, getViewMatrix());
	gl.clear(gl.COLOR_BUFFER_BIT);
	for (let i = 0; i < bodies.length; i++) {
		drawCircle(
			bodies[i].position[0],
			bodies[i].position[1],
			bodies[i].radius,
			bodies[i].colour
		);
	}
	// Draw trails for each body

	for (let i = 0; i < bodies.length; i++) {
		if (bodies[i].trailPositions.length >= 4) {
			gl.bindBuffer(gl.ARRAY_BUFFER, trailBuffer);
			gl.bufferSubData(
				gl.ARRAY_BUFFER,
				0,
				new Float32Array(bodies[i].trailPositions)
			);
			gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(aPosition);
			const uColor = gl.getUniformLocation(program, "uColor");
			gl.uniform4f(
				uColor,
				bodies[i].colour[0],
				bodies[i].colour[1],
				bodies[i].colour[2],
				0.2
			);
			const vertexCount = Math.floor(bodies[i].trailPositions.length / 2);
			if (vertexCount > 0) {
				gl.drawArrays(gl.LINE_STRIP, 0, vertexCount);
			}
		}
	}
});
canvas.addEventListener("mousedown", function (e) {
	if (e.button === 0) {
		// Left mouse button
		dragging = true;
		canvas.addEventListener("mousemove", onMouseMove);
	}
});
canvas.addEventListener("mouseup", () => (dragging = false));
function onMouseMove(e) {
	if (dragging == true) {
		// If not dragging, do nothing
		// Pan the camera when the mouse is moved while holding down the left button

		panX += (e.movementX / canvas.width) * 2;
		panY -= (e.movementY / canvas.height) * 2; // Invert Y-axis
		gl.uniformMatrix3fv(uView, false, getViewMatrix()); // update the view matrix with the new pan and zoom values

		gl.clear(gl.COLOR_BUFFER_BIT);
		for (let i = 0; i < bodies.length; i++) {
			drawCircle(
				bodies[i].position[0],
				bodies[i].position[1],
				bodies[i].radius,
				bodies[i].colour
			);
		}
		// Draw trails for each body while paused
		for (let i = 0; i < bodies.length; i++) {
			if (bodies[i].trailPositions.length >= 4) {
				gl.bindBuffer(gl.ARRAY_BUFFER, trailBuffer);
				gl.bufferSubData(
					gl.ARRAY_BUFFER,
					0,
					new Float32Array(bodies[i].trailPositions)
				);
				gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(aPosition);
				const uColor = gl.getUniformLocation(program, "uColor");
				gl.uniform4f(
					uColor,
					bodies[i].colour[0],
					bodies[i].colour[1],
					bodies[i].colour[2],
					0.2
				);
				const vertexCount = Math.floor(bodies[i].trailPositions.length / 2);
				if (vertexCount > 0) {
					gl.drawArrays(gl.LINE_STRIP, 0, vertexCount);
				}
			}
		}
	}
}
function getViewMatrix() {
	//uses a 3x3 matrix to represent the 2D camera position and zoom level
	//the use of a 3x3 is because we this is using homogeneous coordinates which is like a system of coordinates that allows for
	// translation, rotation, and scaling in a single matrix for cartesian coordinates
	//although this is a bit goofy its standard in 2d graphics coz it can do multiple transformations in one go - should help speed up rendering
	const aspectRatio = canvas.width / canvas.height; //prevent distortion when resizing window

	return new Float32Array([
		zoom / aspectRatio,
		0,
		0,
		0,
		zoom,
		0,
		panX,
		panY,
		1,
	]);
}
//assigning buffers
let trailBuffer = gl.createBuffer();
const maxTrailPoints = 10000;
gl.bindBuffer(gl.ARRAY_BUFFER, trailBuffer);
gl.bufferData(gl.ARRAY_BUFFER, maxTrailPoints * 2 * 4, gl.DYNAMIC_DRAW);

let bodies = [
	{
		position: [-50.5, 6.8],
		velocity: [0, -7.5],
		force: [0, 0],
		mass: 6 * 10 ** 24,
		radius: 0.5,
		trailPositions: [],
		colour: [1, 0, 0, 1],
	},
 
	{
		position: [20, 0],
		velocity: [0, 10],
		force: [-1, 1],
		mass: 8 * 10 ** 23,
		radius: 0.05,
		trailPositions: [],
		colour: [0, 1, 0, 1],
	},
	{
		position: [-50, -60],
		velocity: [0, 0],
		force: [0, 0],
		mass: 4.8 * 10 ** 20,
		radius: 0.004,
		trailPositions: [],
		colour: [0, 0, 1, 1],
	},
	{
		position: [0, 0.8],
		velocity: [0, 0],
		force: [0, 0],
		mass: 1.989 * 10 ** 30,
		radius: 3.5,
		trailPositions: [],
		colour: [1, 1, 0.8, 1],
	},
       {
        position: [-100, 5],
		velocity: [2, 5],
		force: [0, 0],
		mass: 4.8 * 10 ** 22,
		radius: 0.01,
		trailPositions: [],
		colour: [1, 0, 0, 1],
     }
    ,
];
function drawCircle(X, Y, radius, colour) {
	const numSegments = 75;

	const uColor = gl.getUniformLocation(program, "uColor");
	if (glowEffectEnabled == true) {
		const glowLayers = parseInt(radius + 4); //number of layers with a minimum of 7

		const maxVerts = numSegments + 2;
		const vertexBuf = new Float32Array(maxVerts * 2);
		const glowBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, glowBuffer);
		// allocate GPU storage once for the maximum possible size
		//by doing this we dont have to rellocate memory for each glow layer

		gl.bufferData(gl.ARRAY_BUFFER, vertexBuf.byteLength, gl.DYNAMIC_DRAW);
		gl.enableVertexAttribArray(aPosition);
		gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
		for (let layer = 1; layer < glowLayers + 1; layer++) {
			const glowSize = radius*0.75 + ( 5 * (1 - Math.pow(0.9, layer)));
			const glowOpacity = 0.2 / layer; // Decreases opacity for outer layers

			let glowVertices = [X, Y];
			for (let i = 0; i <= numSegments; i++) {
				let angle = (i * 2 * Math.PI) / numSegments;
				let x = X + glowSize * Math.cos(angle);
				let y = Y + glowSize * Math.sin(angle);
				glowVertices.push(x, y);
			}

			glowVertices = new Float32Array(glowVertices);

			// submit the vertex data for this layer
			// reusing the same buffer to avoid reallocating memory each time
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, glowVertices);
			gl.uniform4f(uColor, colour[0], colour[1], colour[2], glowOpacity);

			// Draw glow layer
			gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2);
		}
	}
	//now for the actual planet/star what not
	let vertices = [X, Y];
	for (let i = 0; i <= numSegments; i++) {
		let angle = (i * 2 * Math.PI) / numSegments;
		let x = X + radius * Math.cos(angle);
		let y = Y + radius * Math.sin(angle);
		vertices.push(x, y);
	}
	vertices = new Float32Array(vertices);

	// === Upload Buffer ===
	//assign the vertex buffer to the GPU
	const vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	//send the vertex data to the shader

	gl.enableVertexAttribArray(aPosition);
	gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

	//define the colour of the planet
	gl.uniform4f(uColor, colour[0], colour[1], colour[2], colour[3]);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2);
	//draw the circle using triangle fan mode
}
function resizeCanvasToDisplaySize(canvas) {
	const dpr = window.devicePixelRatio || 1; //consider device pixel ratio for high-DPI displays - my monitor :(
	const width = Math.round(window.innerWidth * dpr);
	const height = Math.round(window.innerHeight * dpr);
	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width;
		canvas.height = height;
		gl.viewport(0, 0, canvas.width, canvas.height); // Update the WebGL viewport to match the new canvas size
	}
	canvas.style.width = "100vw";
	canvas.style.height = "100vh";
}

window.addEventListener("resize", () => resizeCanvasToDisplaySize(canvas)); //resize canvas when window is resized
resizeCanvasToDisplaySize(canvas); // Call once to setup canvas size initially
gl.clearColor(0, 0, 0, 1);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
gl.clear(gl.COLOR_BUFFER_BIT);
const gravity = 6.6743 * 10 ** -11; //gravitiational constant in m^3 kg^-1 s^-2
let distanceScale = 2e8;

let paused = false;
document.getElementById("pauseButton").addEventListener("click", function () {
	paused = !paused; //toggle the paused state
	document.getElementById("pauseButton").innerHTML = paused
		? '<i class="fa fa-play fa-3x" style="color: rgba(255, 255, 255, 1);"></i>'
		: '<i class="fa fa-pause fa-3x" style="color: #ffffffff;"></i>';
	//update the button icon based on the paused state

	if (!paused) {
		calculateGravity();
	} //if unpaused then restart the simulation loop
});

function calculateGravity() {
   
	gl.uniformMatrix3fv(uView, false, getViewMatrix()); //set view with matrix

	if (paused) return; // If paused, exit the function and do not continue the simulation loop
	gl.clear(gl.COLOR_BUFFER_BIT);

	checkCollisions();
	for (let i = 0; i < bodies.length; i++) {
		//half step velocity and add to positions
		let accelerationX = bodies[i].force[0] / bodies[i].mass; // a=f/m
		let accelerationY = bodies[i].force[1] / bodies[i].mass;

		bodies[i].velocity[0] += (accelerationX * timeStep) / 2;
		bodies[i].velocity[1] += (accelerationY * timeStep) / 2;
       
		bodies[i].position[0] += bodies[i].velocity[0] * timeStep;
		bodies[i].position[1] += bodies[i].velocity[1] * timeStep;
        if (i === 1) {
            velocityList.push(Math.sqrt(bodies[i].velocity[0]**2 + bodies[i].velocity[1]**2))
        }
	}

	for (let i = 0; i < bodies.length; i++) {
		bodies[i].force = [0, 0]; //reset force for additional calculations
		for (let z = 0; z < bodies.length; z++) {
			if (z !== i) {
				let spatiumVector = [
					(bodies[z].position[0] - bodies[i].position[0]) * distanceScale,
					(bodies[z].position[1] - bodies[i].position[1]) * distanceScale,
				];
				//creates a 2d vector between the two objects
				let distanceScalar = Math.sqrt(
					spatiumVector[0] ** 2 + spatiumVector[1] ** 2
				);
				//finds the distance between the two objects and then increase scale for more realistic projection
				let forceScalar =
					(gravity * (bodies[i].mass * bodies[z].mass)) / distanceScalar ** 2;
				// newton's law of universal gravitation F=G(m1*m2)/r^2
				let unitSpatiumVector = [
					spatiumVector[0] / distanceScalar,
					spatiumVector[1] / distanceScalar,
				];
				//converts the distance vector to a unit vector
				bodies[i].force[0] += forceScalar * unitSpatiumVector[0];
				bodies[i].force[1] += forceScalar * unitSpatiumVector[1];
			}
		}
	}
	for (let i = 0; i < bodies.length; i++) {
		let accelerationX = bodies[i].force[0] / bodies[i].mass; // a=f/m
		let accelerationY = bodies[i].force[1] / bodies[i].mass;
		bodies[i].velocity[0] += (accelerationX * timeStep) / 2;
		bodies[i].velocity[1] += (accelerationY * timeStep) / 2;
		updateTrailPosition(i);
		drawCircle(
			bodies[i].position[0],
			bodies[i].position[1],
			bodies[i].radius,
			bodies[i].colour
		);
	}

	requestAnimationFrame(calculateGravity);
	increaseSize(); //increase the size of the newly added planet while the mouse is held down
}
calculateGravity();
function updateTrailPosition(i) {
	bodies[i].trailPositions.push(bodies[i].position[0], bodies[i].position[1]);
	if (bodies[i].trailPositions.length > maxTrailPoints * 2) {
		bodies[i].trailPositions.splice(0, 2);
	}

	if (bodies[i].trailPositions.length > 1000) {
		const lastX = bodies[i].trailPositions[bodies[i].trailPositions.length - 2];
		const lastY = bodies[i].trailPositions[bodies[i].trailPositions.length - 1];

		const minDistance = bodies[i].radius * 2; //distance threshold using the bodies radius
		const searchEnd = Math.floor(bodies[i].trailPositions.length * 0.5); // Check the first half on trail pieces
		//this prevents the program from constantly removing the current trial piece as that would be within the threshold of the radius.

		for (let trail = 0; trail < searchEnd; trail += 2) {
			let trailx = bodies[i].trailPositions[trail];
			let trialy = bodies[i].trailPositions[trail + 1];
			let distance = Math.sqrt((trailx - lastX) ** 2 + (trialy - lastY) ** 2);

			if (distance < minDistance) {
				//Detect if a full rotation has been made so that some points can be deleted
				//remove coordinates in pairs
				bodies[i].trailPositions.splice(0, trail + 2);
				break;
			}
		}
	}

	// Ensure array integrity
	if (bodies[i].trailPositions.length % 2 !== 0) {
		console.error("Trail array corrupted! Fixing...");
		bodies[i].trailPositions.pop(); // Remove last element to make it even so that the points are even
	}

	// Only render if we have valid data
	if (bodies[i].trailPositions.length >= 4) {
		gl.bindBuffer(gl.ARRAY_BUFFER, trailBuffer);
		gl.bufferSubData(
			gl.ARRAY_BUFFER,
			0,
			new Float32Array(bodies[i].trailPositions)
		);
		gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(aPosition);
		const uColor = gl.getUniformLocation(program, "uColor");
		gl.uniform4f(
			uColor,
			bodies[i].colour[0],
			bodies[i].colour[1],
			bodies[i].colour[2],
			0.2
		);
		const vertexCount = Math.floor(bodies[i].trailPositions.length / 2);
		if (vertexCount > 0) {
			gl.drawArrays(gl.LINE_STRIP, 0, vertexCount);
		}
	}
}

function checkCollisions() {
	for (let i = bodies.length - 1; i >= 0; i--) {
		//iterate through each body
		for (let z = bodies.length - 1; z >= 0; z--) {
			//check if the two bodies are not the same
			if (i !== z) {
				let spatiumVector = [
					bodies[z].position[0] - bodies[i].position[0],
					bodies[z].position[1] - bodies[i].position[1],
				]; //reuses to original vector code
				let distanceBetweenBodies = Math.sqrt(
					spatiumVector[0] ** 2 + spatiumVector[1] ** 2
				);
				let keepBody, bodyRemove;
				if (distanceBetweenBodies < bodies[i].radius + bodies[z].radius) {
					if (bodies[i].mass >= bodies[z].mass) {
						//choose which body to keep based on mass
						//if body i is bigger than body z then keep body i and remove body z
						keepBody = i;
						bodyRemove = z;
					} else {
						keepBody = z;
						bodyRemove = i;
					}

					bodies[keepBody].mass += bodies[bodyRemove].mass; //combine masses
					bodies[keepBody].radius += bodies[bodyRemove].radius * 0.1; //add together radius - a bit unrealistic but easy implementation
					//combine velocities using the formula for conservation of momentum
					// v1*m1 + v2*m2 = (m1+m2)*v3
					bodies[keepBody].velocity[0] =
						(bodies[keepBody].velocity[0] * bodies[keepBody].mass +
							bodies[bodyRemove].velocity[0] * bodies[bodyRemove].mass) /
						bodies[keepBody].mass;
					bodies[keepBody].velocity[1] =
						(bodies[keepBody].velocity[1] * bodies[keepBody].mass +
							bodies[bodyRemove].velocity[1] * bodies[bodyRemove].mass) /
						bodies[keepBody].mass;
					bodies.splice(bodyRemove, 1); //remove the smaller body from the array
					return; // Exit the function after a collision
				}
			}
		}
	}
}
let menuButton = document.getElementById("menuButton");
let menu = document.getElementById("Sidenav");
let menuOpen = false;
let closeMenuButtom = document.getElementById("closeMenu");
menuButton.addEventListener("click", function () {
	if (!menuOpen) menu.style.width = "15%";
	menuOpen = true;
	menuButton.style.display = "none";
});
closeMenuButtom.addEventListener("click", function () {
	menuOpen = false;

	menu.style.width = "0px";
	menuButton.style.display = "block";
});
let quickAdd = document.getElementById("quickAdd");
quickAdd.addEventListener("click", function () {
	addPlanet = true;
});
canvas.addEventListener("mousedown", function (e) {
	if (addPlanet && e.button === 0) {
		// If the addplanet has been clicked and left mouse button is clicked

		const mouseX = e.clientX;
		const mouseY = e.clientY;
		const rect = canvas.getBoundingClientRect();
		const canvasX = mouseX - rect.left;
		const canvasY = mouseY - rect.top;

		// Convert to normalized coordinates (-1 to 1) using display size, not actual canvas size
		const normX = (canvasX / rect.width) * 2 - 1;
		const normY = 1 - (canvasY / rect.height) * 2; // Flip Y axis

		const aspectRatio = rect.width / rect.height;
		const worldX = (normX * aspectRatio) / zoom + panX;
        const worldY = normY / zoom + panY;

		// Convert mouse coordinates to world coordinates

		bodies.push({
			position: [worldX, worldY],
			velocity: [0, 0],
			force: [0, 0],
			mass: 5 * 10 ** 20,
			radius: 0.01,
			trailPositions: [],
			colour: [Math.random(), Math.random(), Math.random(), 1],
		});
		creatingPlanetIndex = bodies.length - 1;
		isCreatingPlanet = true;
		//create new planet
		canvas.addEventListener("mousemove", function onSetVelocity(e) {
			if (!addPlanet) return; // If not in addPlanet mode, exit
			if (e.buttons & 1) {
				// Check if left mouse button is held down
				canvas.removeEventListener("mousemove", onMouseMove);
				// prevents the camera from panning while setting velocity
				canvas.style.cursor = "crosshair"; //change cursor to crosshair when setting velocity
				const aspectRatio = canvas.width / canvas.height;
				// Calculate the current mouse position in world coordinates
				const currentMouseX = e.clientX;
				const currentMouseY = e.clientY;
				const currentNormX = (currentMouseX / canvas.width) * 2 - 1;
				const currentNormY = 1 - (currentMouseY / canvas.height) * 2;
				const currentWorldX = (currentNormX * aspectRatio) / zoom - 1;
				const currentWorldY = currentNormY / zoom;
				//update the velocity of the newly added planet based on the drag distance
				bodies[bodies.length - 1].velocity[0] = currentWorldX - worldX;
				bodies[bodies.length - 1].velocity[1] = currentWorldY - worldY;
				gl.clear(gl.COLOR_BUFFER_BIT);
			}
		});
		canvas.addEventListener("mouseup", function onRelease(e) {
			if (!addPlanet) return;
			canvas.style.cursor = "default"; // Reset cursor style
			addPlanet = false; // Reset the flag to prevent adding multiple planets
			isCreatingPlanet = false;
			creatingPlanetIndex = -1;
			canvas.removeEventListener("mouseup", onRelease); // Remove this mouseup listener
			canvas.addEventListener("mousemove", onMouseMove); // Re-enable camera panning
		});
	}
});
function increaseSize() {
	// Only increase size if we're actively creating a planet and have a valid index
	if (
		!isCreatingPlanet ||
		creatingPlanetIndex === -1 ||
		creatingPlanetIndex >= bodies.length
	)
		return;

	bodies[creatingPlanetIndex].radius += 0.01;
	bodies[creatingPlanetIndex].mass +=
		bodies[creatingPlanetIndex].radius * 10 ** 26; // Increase mass proportionally to radius increase
}
toggleGlowButton.addEventListener("click", function () {
	glowEffectEnabled = !glowEffectEnabled;
});
let timeInput=document.getElementById("timeStepInput")
let timeDisplay=document.getElementById("timeStep")
timeInput.addEventListener("change", function(){
    timeStep= timeInput.value * 0.001
    timeDisplay.innerHTML = "Time Step: " + timeStep;
    
})
