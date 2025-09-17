#version 300 es
precision lowp float;       

uniform vec4 uColor;           // rgb + base alpha
uniform float uGlowStrength;   
out vec4 outColor;

void main() {
   
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);                
    // smooth radial falloff: inner bright radius -> outer fade out
    float alpha = smoothstep(0.6, 0.0, d); 
    alpha *= uGlowStrength;
    
    alpha *= (1.0 - d);

   
    if(alpha < 0.01) discard; //save fillrate

    outColor = vec4(uColor.rgb, alpha * uColor.a);
}
