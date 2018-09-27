// requires: three.min.js
// adapted from:
// http://www.realtimerendering.com/erich/udacity/exercises/unit3_toon_solution3.html
class ToonMaterial {
    constructor(color,light,brightness){
        let b = brightness || 1.0
        this.uniforms = {
            "uDirLightPos": { type: "v3", value: new THREE.Vector3() },
            "uDirLightColor": { type: "c", value: new THREE.Color( 0xffffff ) },
            "uMaterialColor": { type: "c", value: new THREE.Color( 0xffffff ) },
            uKd: { type: "f", value: 0.7 },
            uBorder: { type: "f", value: 0.4 },
            uBright: { type: "f", value: b }
        }
        let materialColor = new THREE.Color(color.r, color.g, color.b)
        let material = this.createShaderMaterial(light)
            // material.side = THREE.DoubleSide
            material.uniforms.uMaterialColor.value.copy(materialColor)
        return material
    }

    getUniforms(){

    }

    getVertexShader(){
        return`
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {

            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            vNormal = normalize( normalMatrix * normal );
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            vViewPosition = -mvPosition.xyz;

        }`
    }

    getFragmentShader(){
        return`
        uniform vec3 uMaterialColor;

        uniform vec3 uDirLightPos;
        uniform vec3 uDirLightColor;

        uniform float uKd;
        uniform float uBorder;
        uniform float uBright;

        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {

            // compute direction to light
            vec4 lDirection = viewMatrix * vec4( uDirLightPos, 0.0 );
            vec3 lVector = normalize( lDirection.xyz );

            // diffuse: N * L. Normal must be normalized, since it's interpolated.
            vec3 normal = normalize( vNormal );
            //was: float diffuse = max( dot( normal, lVector ), 0.0);
            // solution
            float diffuse = dot( normal, lVector );
            if ( diffuse > 0.6 ) { diffuse = 1.0; }
            else if ( diffuse > -0.2 ) { diffuse = 0.7; }
            else { diffuse = 0.3; }

            gl_FragColor = vec4( uKd * uMaterialColor * uDirLightColor * diffuse * uBright , 1.0 );

        }`
    }

    createShaderMaterial(light) {
        let material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(this.uniforms),
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getFragmentShader()
        })
        material.uniforms.uDirLightPos.value = light.position
        material.uniforms.uDirLightColor.value = light.color
        return material
    }
}
