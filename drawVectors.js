import { currentCameraIndex, bodies, getViewMatrix, gl, program } from "./gravitysim.js";
export function createVectors() {
	let currentVelocity = bodies[currentCameraIndex].velocity;
	let currentForce = bodies[currentCameraIndex].force;
	let currentPosition = bodies[currentCameraIndex].position;
	// console.log(currentVelocity, currentForce);
	drawVector(currentPosition, currentVelocity, "v", 1, [0, 0, 1, 1]); 
	drawVector(currentPosition, currentForce, "F", 2e-24, [1, 0, 0, 1]); 
}

function drawVector(origin, vector, type, scale, color) {
	const startX = origin[0];
	const startY = origin[1];
	const endX = startX + vector[0] * scale;
	const endY = startY + vector[1] * scale;
	const phi = Math.atan2((endY-startY),(endX-startX)) 
	//arctan function to find the angle between the horzion and direction of vector.
	//atan2 prevents division by 0
	let arrowScale = 0.1* Math.sqrt((endY-startY)**2 + (endX-startX)**2 );
	//scale arrows length relative to length of vector
	arrowScale = Math.min(Math.max(arrowScale, 0.05), 2)
	//set limits for arrow scale- cant be greater than 2 or les than 0.05
	const leftArrowVertex = [endX +arrowScale*(Math.cos(phi+165*Math.PI/180)), endY+ arrowScale*(Math.sin(phi+165*Math.PI/180))];
	const rightArrowVertex =[endX + arrowScale*(Math.cos(phi+195*Math.PI/180)), endY + arrowScale*(Math.sin(phi+195*Math.PI/180))];
	//calculate the coords of the arrow using trig to create arrows
	 const positions = new Float32Array([
		startX, startY, endX, endY,                         // main line
		endX, endY, leftArrowVertex[0], leftArrowVertex[1], // left arrowhead
		endX, endY, rightArrowVertex[0], rightArrowVertex[1] // right arrowhead
	]);
	//push positions
	const positionBuffer = gl.createBuffer();
	//define buffer to allocate vram and bind data
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	
	const aPositionLoc = gl.getAttribLocation(program, "aPosition");
	gl.enableVertexAttribArray(aPositionLoc);
	gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);
	
	// Set the colour for the vector
	const uColor = gl.getUniformLocation(program, "uColor");
	gl.uniform4f(uColor, color[0], color[1], color[2], color[3]);
	
	// Apply view matrix
	const uView = gl.getUniformLocation(program, "uView");
	gl.uniformMatrix3fv(uView, false, getViewMatrix());
	
	gl.drawArrays(gl.LINES, 0, 6);

}