attribute vec2 aPosition;
uniform mat3 uView;
uniform vec2 uMassPositions[10];
uniform float uMasses[10];
uniform int uNumBodies;
varying vec2 vOriginalPosition;
varying vec2 vWorldPosition;

void main() {
    vOriginalPosition = aPosition;
    
    // Accumulate total distortion from original position
    vec2 totalDistortion = vec2(0.0, 0.0);
    
    // Calculate each body's distortion independently from the original position
    for (int i = 0; i < 10; i++) {
        if (i >= uNumBodies) break;
        
        // calculate from ORIGINAL aPosition
        vec2 diff = aPosition - uMassPositions[i];
        float distance = length(diff);
        
        if (distance > 0.06) {  // Minimum distance threshold
            float massScale = pow(uMasses[i] / 2e24, 5.1);  //scale masses
            distance = max(distance, 0.4);
            float influence = massScale / (distance * distance);
            influence = influence / (0.9 + influence);
            //the smoothing was causing things to be off centre so i toned it down
            
            vec2 direction = normalize(diff);
            
            // Add to total distortion
            totalDistortion -= direction * influence;
        }
    }
    
    // Apply all distortions at once
    vec2 finalPosition = aPosition + totalDistortion;
    vWorldPosition = finalPosition;
    
    // Apply view transformation
    vec3 finalViewPos = uView * vec3(finalPosition, 1.0);
    gl_Position = vec4(finalViewPos.xy, 0.0, 1.0);
}