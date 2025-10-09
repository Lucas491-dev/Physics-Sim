import { bodies, getViewMatrix,panX,panY,zoom } from "./gravitysim.js"; 

console.log("SpaceTime visualization loaded");

let gl = null;
let gridProgram = null;
let gridProgramInfo = null;
let gridBuffers = null;
let gridEnabled = false;
let initialized = false;
// Initialize the spacetime visualization system ONLY when content is loaded
export async function initSpacetimeVisualization(webglContext) {
    gl = webglContext;
    
    const fragmentShaderSource = await loadShaderSource("gridFragmentShader.glsl");
    const vertexShaderSource = await loadShaderSource("gridVertexShader.glsl");
    //load in shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    gridProgram = createProgram(gl, vertexShader, fragmentShader);
    
    // Get uniform and attribute locations for grid program
    gridProgramInfo = {
        program: gridProgram,
        attribLocations: {
            position: gl.getAttribLocation(gridProgram, "aPosition"),
        },
        uniformLocations: {
            view: gl.getUniformLocation(gridProgram, "uView"),
            color: gl.getUniformLocation(gridProgram, "uColor"),
            massPositions: gl.getUniformLocation(gridProgram, "uMassPositions"),
            masses: gl.getUniformLocation(gridProgram, "uMasses"),
            numBodies: gl.getUniformLocation(gridProgram, "uNumBodies"),
        },
    };
    
    gridBuffers = initGridBuffers(gl);
    initialized = true;
    console.log("Spacetime visualization initialized");
}

async function loadShaderSource(url) {
  //load in shader program from seperate files
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load shader: ${url}`);
  }
  return await response.text();
}

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

function createProgram(gl, vertexShader, fragmentShader) {
  //define the shader program using the vertex and fragment shader
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program failed to link:", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}
function createGrid(size = 20, divisions = 60) {
 
	const positions = [];
	const step = (2 * size) / divisions;
	const indices =[];
	// Create grid vertices
	for (let i = 0; i <= divisions; i++) {
    for (let j = 0; j <= divisions; j++) {
      const x = -size + j * step;
      const y = -size + i * step;
      positions.push(x, y);
      
      const currentIndex = i * (divisions + 1) + j;
      
      //check we arent in the last collum so we can add horzontal lines
      if (j < divisions) {
        indices.push(currentIndex, currentIndex + 1);
      }
      
      // check we aren't in the last row so we can add vertical lines
      if (i < divisions) {
        indices.push(currentIndex, currentIndex + (divisions + 1));
      }
    }
  }

	return {
		positions: new Float32Array(positions),
		indices: new Uint16Array(indices),
	};
}

function initGridBuffers(gl) {
  //initalize the vram once and then reallocate it each frame - speeds up performance
	const grid = createGrid(200, 100); 
	
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, grid.positions, gl.STATIC_DRAW);
	
	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.indices, gl.STATIC_DRAW);
	
	return {
		position: positionBuffer,
		indices: indexBuffer,
		vertexCount: grid.indices.length,
	};
}

// Export function to draw the grid
export function drawSpacetimeGrid() {
    if (!initialized || !gridEnabled) return;
    //exit if we havent initalized the function or if the grid hasnt been selected 
    // Use the grid specific shader program
    gl.useProgram(gridProgram);
    
    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffers.position);
    gl.vertexAttribPointer(gridProgramInfo.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gridProgramInfo.attribLocations.position);
    
    // Bind index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gridBuffers.indices);
    
    // Set view matrix
    gl.uniformMatrix3fv(gridProgramInfo.uniformLocations.view, false, getViewMatrix());
    
    // Prepare mass data for shader
    const maxBodies = 10; // Limit for shader uniform arrays - prevents it from overloading devices
    const massPositions = new Float32Array(maxBodies * 2);
    const masses = new Float32Array(maxBodies);
    // uses float32 arrays to send data in the correct format for webgl
    const numBodies = Math.min(bodies.length, maxBodies);
    
    for (let i = 0; i < numBodies; i++) {
        massPositions[i * 2] = bodies[i].position[0];
        massPositions[i * 2 + 1] = bodies[i].position[1];
       masses[i] = bodies[i].mass
    }
    
    // Set uniforms
    
    gl.uniform2fv(gridProgramInfo.uniformLocations.massPositions, massPositions);
    gl.uniform1fv(gridProgramInfo.uniformLocations.masses, masses);
    gl.uniform1i(gridProgramInfo.uniformLocations.numBodies, numBodies);
    gl.uniform4f(gridProgramInfo.uniformLocations.color, 0.3, 0.3, 0.8, 0.4);
    
    // Draw grid lines
    gl.drawElements(gl.LINES, gridBuffers.vertexCount, gl.UNSIGNED_SHORT, 0);
}

// Export function to toggle grid visibility
export function toggleSpacetimeGrid() {
    gridEnabled = !gridEnabled;
    console.log("Spacetime grid:", gridEnabled ? "enabled" : "disabled");
}
