const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');
    if (!gl) { alert('WebGL not supported'); }
    let addMoreDetails = document.getElementById("moreDetailsButton")
    // === Shaders ===
    const vertexShaderSource = `
    attribute vec2 aPosition;
    uniform mat3 uView;   // 2D camera matrix
    void main() {
        vec3 pos = uView * vec3(aPosition, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);}
    `;

    const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 uColor;
    void main() {
        gl_FragColor = uColor;
    }
    `;

    // === Compile Shaders ===
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
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // === Create Program ===
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
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    let zoom = 1.0, panX= 0, panY=0; // Initialize zoom and pan variables for the camera
    const uView = gl.getUniformLocation(program, 'uView'); //set the uniform location for the view matrix
    let dragging = false;

    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
            // Zoom in/out, when the mouse wheel is scrolled
            zoom *= e.deltaY > 0 ? 0.9 : 1.1;
            zoom = Math.max(0.01, Math.min(zoom, 20));
    });
    canvas.addEventListener('mousedown', function(e) {
        if (e.button === 0) { // Left mouse button
            dragging = true;
            canvas.addEventListener('mousemove', onMouseMove);
        }
    });
    canvas.addEventListener("mouseup", () => dragging = false);
    function onMouseMove(e) {
        if (dragging ==true){ // If not dragging, do nothing
            // Pan the camera when the mouse is moved while holding down the left button
            panX += (e.movementX / canvas.width) *2 ;
            panY -= (e.movementY / canvas.height) *2; // Invert Y-axis 
            gl.uniformMatrix3fv(uView, false, getViewMatrix())//update the view matrix with the new pan and zoom values
        } 
    }
    function getViewMatrix() {
        //uses a 3x3 matrix to represent the 2D camera position and zoom level
        //the use of a 3x3 is because we this is using homogeneous coordinates which is like a system of coordinates that allows for 
        // translation, rotation, and scaling in a single matrix for cartesian coordinates
        //although this is a bit goofy its standard in 2d graphics coz it can do multiple transformations in one go - should help speed up rendering 
            return new Float32Array([
                zoom, 0,    0,
                0,    zoom, 0,
                panX,    panY,    1
            ]);
        }


    let bodies = [
        {
            position: [-0.5, 0.8],
            velocity: [0.2, 0],
            force: [0, 0],
            mass: 4.8 * 10 ** 20,
            radius: 0.01,
            trailPositions: []
        },
        {
            position: [0, 0],
            velocity: [0, 0],
            force: [0, 0],
            mass: 8 * 10 ** 23,
            radius: 0.05,
            trailPositions: []
        },
            {
            position: [-0.5, -0.5],
            velocity: [0, 0.3],
            force: [0, 0],
            mass: 4.8 * 10 ** 20    ,
            radius: 0.004,
            trailPositions: []
        },
    ];
    
    function drawCircle(X,Y,radius){
        const numSegments = 500; 
        
        let vertices = [X, Y];
        for (let i = 0; i <= numSegments; i++) {
            let angle = i * 2 * Math.PI / numSegments;
            let x = X + radius * Math.cos(angle);
            let y = Y + radius * Math.sin(angle);
            vertices.push(x, y);
        }
        vertices = new Float32Array(vertices);

        // === Upload Buffer ===
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        const uColor = gl.getUniformLocation(program, 'uColor');
        gl.uniform4f(uColor, 1, 1, 1, 1.0); 
        gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2);
    }

canvas.width = window.innerHeight;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);
let addNewBody = document.getElementById("createNewBody")
gl.clearColor(0, 0, 0, 1); 
gl.clear(gl.COLOR_BUFFER_BIT);
let timeStep = 0.005;
const gravity = 6.6743* 10 ** -11//gravitiational constant in m^3 kg^-1 s^-2
let distanceScale = 2e7;
let trailBuffer = gl.createBuffer();
function calculateGravity(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix3fv(uView, false, getViewMatrix()); //set view with matrix
    checkCollisions()
        for (let i=0; i<bodies.length; i++){
            //half step velocity and add to positions
            let accelerationX = bodies[i].force[0]/bodies[i].mass // a=f/m
            let accelerationY = bodies[i].force[1]/bodies[i].mass

            bodies[i].velocity[0] += accelerationX  * timeStep/2
            bodies[i].velocity[1] += accelerationY * timeStep/2

            bodies[i].position[0] += bodies[i].velocity[0] * timeStep;
            bodies[i].position[1] += bodies[i].velocity[1] * timeStep;
        }

        for (let i=0; i<bodies.length;i++){
            bodies[i].force = [0,0] //reset force for additional calculations
            for (let z=0;z<bodies.length;z++){
                if (z!==i){

                    let spatiumVector = [(bodies[z].position[0]-bodies[i].position[0]) * distanceScale, (bodies[z].position[1]-bodies[i].position[1]) * distanceScale] 
                    //creates a 2d vector between the two objects
                    let distanceScalar = (Math.sqrt(spatiumVector[0]**2 + spatiumVector[1]**2)) 
                    //finds the distance between the two objects and then increase scale for more realistic projection
                    let forceScalar = ( gravity * (bodies[i].mass*bodies[z].mass))/(distanceScalar ** 2); 
                    // newton's law of universal gravitation F=G(m1*m2)/r^2
                    let unitSpatiumVector = [spatiumVector[0]/distanceScalar, spatiumVector[1]/distanceScalar];
                     //converts the distance vector to a unit vector
                    bodies[i].force[0] += forceScalar * unitSpatiumVector[0]
                    bodies[i].force[1] += forceScalar * unitSpatiumVector[1];
                }
            }
        }
        for (let i=0;i<bodies.length;i++){
                let accelerationX = bodies[i].force[0]/bodies[i].mass // a=f/m
                let accelerationY = bodies[i].force[1]/bodies[i].mass
                bodies[i].velocity[0] += accelerationX  * timeStep/2
                bodies[i].velocity[1] += accelerationY * timeStep/2
                drawCircle(bodies[i].position[0], bodies[i].position[1] ,bodies[i].radius)
                updateTrailPosition(i)
        }
        requestAnimationFrame(calculateGravity);
}
calculateGravity()
function updateTrailPosition(i){
    bodies[i].trailPositions.push(bodies[i].position[0], bodies[i].position[1]);
    if (bodies[i].trailPositions.length > 5000 * 2) {
        bodies[i].trailPositions.splice(0, 2);
    }
 
    if (bodies[i].trailPositions.length > 1000){
        const lastX = bodies[i].trailPositions[bodies[i].trailPositions.length - 2];
        const lastY = bodies[i].trailPositions[bodies[i].trailPositions.length - 1];
        
        const minDistance = bodies[i].radius; //distance threshold using the bodies radius
        const searchEnd = Math.floor(bodies[i].trailPositions.length * 0.25); // Check the first 25% on trial pieces
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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bodies[i].trailPositions), gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, trailBuffer);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);
        const uColor = gl.getUniformLocation(program, 'uColor');
        gl.uniform4f(uColor, 0.5, 0.5, 1.0, 1);
        gl.drawArrays(gl.LINE_STRIP, 0, bodies[i].trailPositions.length / 2);
    }
}

function checkCollisions(){
    for (let i = bodies.length -1; i >=0; i--) {
    //iterate through each body
            for (let z=bodies.length -1; z >=0; z--){
            //check if the two bodies are not the same
            if (i!==z){
                let spatiumVector = [bodies[z].position[0]-bodies[i].position[0], bodies[z].position[1]-bodies[i].position[1]] //reuses to original vector code
                let distanceBetweenBodies = (Math.sqrt(spatiumVector[0]**2 + spatiumVector[1]**2))  
                let keepBody, bodyRemove 
                if (distanceBetweenBodies < (bodies[i].radius + bodies[z].radius)){
                    if (bodies[i].mass >= bodies[z].mass){ //choose which body to keep based on mass
                        //if body i is bigger than body z then keep body i and remove body z
                        keepBody = i;
                        bodyRemove = z; 
                    }else{
                        keepBody = z;
                        bodyRemove = i;
                    }

                    bodies[keepBody].mass += bodies[bodyRemove].mass //combine masses
                    bodies[keepBody].radius += bodies[bodyRemove].radius //add together radius - a bit unrealistic but easy implementation
                    //combine velocities using the formula for conservation of momentum
                    // v1*m1 + v2*m2 = (m1+m2)*v3
                       bodies[keepBody].velocity[0] = (bodies[keepBody].velocity[0] * bodies[keepBody].mass + 
                                                       bodies[bodyRemove].velocity[0] * bodies[bodyRemove].mass) / bodies[keepBody].mass;
                    bodies[keepBody].velocity[1] = (bodies[keepBody].velocity[1] * bodies[keepBody].mass + 
                                                       bodies[bodyRemove].velocity[1] * bodies[bodyRemove].mass) / bodies[keepBody].mass;
                    bodies.splice(bodyRemove,1) //remove the smaller body from the array
                    return; // Exit the function after a collision
                }

            }
        }


    }
}
addNewBody.addEventListener("click", function(){
    addMoreDetails.removeAttribute("hidden")
    addMoreDetails.addEventListener("click", function(){
        
    })
})