// TODO: http://learningthreejs.com/blog/2012/01/20/casting-shadows/
class SceneLights {
    constructor(scene,helpers){
        this.scene = scene
        this.helpers = helpers

        this._a = true
        this.a = new THREE.AmbientLight( 0x404040 ) // 0x404040
        this.a.name = 'light-ambient'
        scene.add( this.a )

        this._h = true
        this.h = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 )
        this.h.color.setHSL( 0.6, 1, 0.9 )
        this.h.groundColor.setHSL( 0.095, 1, 0.75 )
        this.h.position.set( 0, 10, 0 )
        this.h.name = 'light-hem'
        scene.add( this.h )
        this.h_helper = new THREE.HemisphereLightHelper( this.h, 2 )
        this.h_helper.name = 'light-hemisphere-helper'
        if(helpers) scene.add( this.h_helper )

        this._d = true
        this.d_mapsize = 200
        this.d_dSize = 2
        this.d = new THREE.DirectionalLight( 0xffffff, 0.3 )
        this.d.color.setHSL( 0.1, 1, 0.95 )
        this.d.position.set( 3.7, 0.9, 2.3 )

        this.d.position.multiplyScalar( 3 )
        this.d.name = 'light-dir1'
        if(this._d) scene.add( this.d )
        this.d.castShadow = true
        this.d.shadow.mapSize.width = this.d_mapsize
        this.d.shadow.mapSize.height = this.d_mapsize
        this.d.shadow.bias = -0.0001 // don't understand this
        this.d.shadow.camera.left = -this.d_dSize
        this.d.shadow.camera.right = this.d_dSize
        this.d.shadow.camera.top = this.d_dSize
        this.d.shadow.camera.bottom = -this.d_dSize
        this.d.shadow.camera.far = 3500
        this.d_helper = new THREE.DirectionalLightHelper(this.d, 2)
        this.d_helper.name = 'light-dir1-helper'
        if(this._d && helpers) scene.add( this.d_helper )

        this._s = true
        this.s_mapsize = 512
        this.s = new THREE.SpotLight( 0xffffff )
        this.s.angle = Math.PI / 5
        this.s.penumbra = 0.3
        this.s.intensity = 0.1
        this.s.decay = 1
        this.s.distance = 0
        this.s.position.set( 1, 2.75, -0.7 )
        this.s.position.multiplyScalar( 3 )
        this.s.castShadow = false // TODO: variable
        this.s.shadow.camera.near = 1
        this.s.shadow.camera.far = 30
        // this.s.shadow.mapSize.width = this.s_mapsize
        // this.s.shadow.mapSize.height = this.s_mapsize
        this.s.name = 'light-spot1'
        scene.add( this.s )
        this.s_helper = new THREE.CameraHelper( this.s.shadow.camera )
        this.s_helper.name = 'light-spot1-helper'
        if(helpers) scene.add( this.s_helper )
    }

    set ambientLight(bool){
        this._a = bool
        if(bool) this.scene.add( this.a )
        else this.scene.remove( this.a )
    }
    get ambientLight(){ return this._a }

    set hemisphereLight(bool){
        this._h = bool
        if(bool) {
            this.scene.add( this.h )
            if(this.helpers) this.scene.add( this.h_helper )
        }
        else {
            this.scene.remove( this.h )
            if(this.helpers) this.scene.remove( this.h_helper )
        }
    }
    get hemisphereLight(){ return this._h }

    set directionalLight(bool){
        this._d = bool
        if(bool) {
            this.scene.add( this.d )
            if(this.helpers) this.scene.add( this.d_helper )
        }
        else {
            this.scene.remove( this.d )
            if(this.helpers) this.scene.remove( this.d_helper )
        }
    }
    get directionalLight(){ return this._d }

    set dir_mapsize(v){
        this.d_mapsize = v
        this.d.shadow.mapSize.width = v
        this.d.shadow.mapSize.height = v
    }
    get dir_mapsize(){ return this.d_mapsize }

    set spotLight(bool){
        this._s = bool
        if(bool) {
            this.scene.add( this.s )
            if(this.helpers) this.scene.add( this.s_helper )
        }
        else {
            this.scene.remove( this.s )
            if(this.helpers) this.scene.remove( this.s_helper )
        }
    }
    get spotLight(){ return this._s }

    set spot_mapsize(v){
        this.s_mapsize = v
        this.s.shadow.mapSize.width = v
        this.s.shadow.mapSize.height = v
    }
    get spot_mapsize(){ return this.s_mapsize }

}
