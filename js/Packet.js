/*

    Packet
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    instantiating this class creates an Internet Packet character

    requires the following dependencies from /libs:
    - three.min.js
    - Tween.js
    as well as the following media files:
    - packet.png ( face spritesheet )

    -----------
       usage
    -----------

    let p = new Packet({
        name: "packet",    // name of mesh
        lights: false,     // if there's lights in scene,
        type: 'dns',       // packet type to create inner payload
        bounce: false,     // to bounce or not to bounce
    },(mesh,instance)=>{
        scene.add( mesh )  // handle mesh
    })
*/
class Packet {
    constructor(config,callback){
        this.opts = config || {}
        this.name = config.name || "packet"
        this.mesh
        this.moving = false
        this.geometry = new THREE.BoxBufferGeometry( 0.5, 0.5, 0.5 )
        this.pos = { x:0, y:0.35, z:0 }
        this.matConfig = {
            color:'#fff',
            specular: new THREE.Color(0.5,0.5,0.5),
            side: THREE.DoubleSide,
            shininess: 1,
            refelctivity:0,
            transparent:true,
            opacity:0.9
        }
        this.tx = new THREE.TextureLoader().load('images/packet.png',()=>{
            this._init()
            if(callback) callback(this.mesh,this)
        })
    }

    _init(){
        let mt = (this.opts.lights) ? 'MeshPhongMaterial' : 'MeshBasicMaterial'
        let opts = Object.assign({map: this.tx},this.matConfig)
        this.materials = new THREE.MeshFaceMaterial([
            new THREE[mt](this.matConfig),
            new THREE[mt](this.matConfig),
            new THREE[mt](this.matConfig),
            new THREE[mt](this.matConfig),
            new THREE[mt](opts),
            new THREE[mt](this.matConfig)
        ])
        this.materials[4].map.offset.y = 0.5
        this.materials[4].map.repeat.x = 0.5
        this.materials[4].map.repeat.y = 0.5

        this.mesh = new THREE.Mesh(this.geometry,this.materials)
        this.mesh.position.set(0,this.pos.y,0)
        this.mesh.name = this.name
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true

        if(this.opts.type) this._packet(this.opts.type)

        // start bounce && blink
        this.bspeed = Math.random()*500 + 750
        this.bounce = this.opts.bounce ? true : false
        if(this.bounce) this._up()
        this._blink()
    }

    _packet(type){
        this.type = type
        let o,c
        let mt = (this.opts.lights) ? 'MeshToonMaterial' : 'MeshBasicMaterial'
        //https://threejs.org/docs/scenes/geometry-browser.html#SphereBufferGeometry
        // [radius, wSeg, hSeg, phiStart, phiLength, thetaStart, thetaLength]
        switch (type) {
          case 'dns': o=[0.25,5,4,0,6.3,0,6.3]; c='#00f'; break;
          case 'http': o=[0.25,7,3,0,6.3,0,3.1]; c='#f00'; break;
          case 'voip': o=[0.25, 3, 2, 0, 6.3, 0, 2.3]; c='#f0f'; break;
          case 'ftp': o=[0.25, 0, 4, 0, 6.3, 0, 2.5]; c='#ff0'; break;
          case 'imap': o=[0.25, 0, 0, 0, 6.3, 0, 2.0]; c='#0ff'; break;
          case 'ssh': o=[0.25, 0, 1, 0, 6.3, 0, 4.5]; c='#f70'; break;
          case 'bt': o=[0.25, 5, 2, 0, 6.3, 0, 5.2]; c='#770'; break;
          case 'irc': o=[ 0.25, 3, 1, 0, 6.3, 0, 3.4]; c='#0f0'; break;
            // ...etc...
        }
        let geometry = new THREE.SphereBufferGeometry(...o)
        let material = new THREE[mt]({
            specular: new THREE.Color(1,0,0),
            side:2, flatShading:true, shininess: 1, color:c,
        })
        let gem = new THREE.Mesh( geometry, material )
        this.mesh.add( gem )
    }

    swapPacket(type){
        let p = this.mesh.children[0]
        this.mesh.remove(p)
        this._packet(type)
    }

    // ----------------------------------------------- auto (tweened) animations

    _up(){
        let target = this.pos.y + 0.3
        new TWEEN.Tween(this.mesh.position).to({ y:target }, this.bspeed)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(()=>{
            if(this.bounce) this._down()
        }).start()
    }

    _down(){
        let target = this.pos.y
        new TWEEN.Tween(this.mesh.position).to({ y:target }, this.bspeed)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(()=>{
            if(this.bounce) this._up()
        }).start()
    }

    _blink(){
        this.materials[4].map.offset.x = 0.5
        setTimeout(()=>{
            this.materials[4].map.offset.x = 0
            let ran = Math.random()*7000 + 1000
            setTimeout(()=>{ this._blink() },ran)
        },100)
    }

}
