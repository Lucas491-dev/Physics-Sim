attribute vec2 aPosition;
uniform mat3 uView;
uniform vec2 uMassPositions[10];
uniform float uMasses[10];
uniform int uNumBodies;

varying vec2 vOriginalPosition;
varying vec2 vWorldPosition;

void main() {
    vOriginalPosition = aPosition;
   
    vec2 distortion = vec2(0.0, 0.0);
   
    for (int i = 0; i < 10; i++) {
        if (i >= uNumBodies) break;
       
        vec2 diff = aPosition - uMassPositions[i];
        float distance = length(diff);
       
        if (distance > 0.1) { // distance threshold
            float influence = uMasses[i] / (distance * distance * 0.1 + 1.0);
            influence = clamp(influence, 0.0, 10.0); 
           
            vec2 direction = normalize(diff);
            distortion -= direction * influence *0.5; // Increased multiplier - makes it a bit more visual 
        }
    }
   
    vec2 distortedPosition = aPosition + distortion;
    vWorldPosition = distortedPosition;
   
    vec3 viewPos = uView * vec3(distortedPosition, 1.0);
    gl_Position = vec4(viewPos.xy, 0.0, 1.0);
}