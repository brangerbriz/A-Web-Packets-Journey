/*

    WiFiPlane
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    instantiating this class creates a WiFi Plane object.

    requires the following dependencies from /libs:
    - BaseObjClass.js
    - Packet.js
    - ToonMaterial.js
    - three.min.js
    - Tween.js
    - DRACOLoader.js ( +decoder libs in libs/loaders/draco/ )
    as well as the following media files:
    - plane_banner.jpg
    - plane.drc
    - banner-01.drc
    - banner-02.drc
    - banner-03.drc
    - banner-04.drc
    - banner-05.drc

    -----------
       usage
    -----------
    let plane

    // in VRWorld setup
    plane = new WiFiPlane({
        light:dl,
        ip:'192.168.0.68'
    },(mesh,instance)=>{
        scene.add(mesh)
    })

    // in VRWorld draw loop
    plane.update(tick)

*/
class WiFiPlane extends BaseObjClass {
    constructor(config,callback){
        super(callback)

        this.flength = 5    // 5 banners
        this.loadTotalOf(8) // 5 banners + 1 image + 1 plane + 1 pilot

        this.light = config.light
        this.type = config.type || 'dns'
        this.IPAddr = config.ip || `192.168.1.${Math.floor(Math.random()*255)}`

        let toon = new ToonMaterial({r:1,g:0.2,b:0.41},this.light)
        let bmat = this.createCanvasMaterial()

        this.loader.load( `models/drcs/plane.drc`, (geometry)=>{
            this.mesh = new THREE.Mesh(geometry,toon)
            // IP banner
            for (let i = 0; i < this.flength; i++) this.loadBanner(i,bmat)
            // packet pilot
            this.createPilot(config)
            // propeller
            this.createPropeller(this.light)
            this.loaded()
        })
    }

    createPilot(config){
        // this.packet = new packet object
        // this.pilot = the packet object's mesh
        let direction = new THREE.Vector3(1,1,0)
        this.packet = new Packet({
            type:this.type,
            lights:true
        },(packet)=>{
            this.pilot = packet
            packet.position.set(-0.25,0.25,0)
            packet.lookAt(direction)
            this.mesh.add(packet)
            this.loaded()
        })
    }

    // -------------------------------------------------------------------------
    // propeller + banner stuff

    pspin(p){
        let x = p.rotation.x + Math.PI*2
        new TWEEN.Tween(p.rotation).to({x:x}, 200)
            .onComplete(()=>this.pspin(p)).start()
    }

    createPropeller(light){
        let propeller = new THREE.Object3D()
        propeller.name = "propeller"
        let pz = new THREE.Object3D()
        let geometry = new THREE.BoxBufferGeometry( 0.025, 1, 0.05 )
        let material = new ToonMaterial({r:1,g:1,b:1}, light)
        for (let i = 0; i < 5; i++) {
            let p = new THREE.Mesh( geometry, material )
                p.rotation.set(i/10+0.1,0,0)
            pz.add(p)
        }
        propeller.add(pz)
        propeller.position.set(1.05, 0.23, 0)
        propeller.rotation.set(0,0,0.23)
        this.pspin(pz)
        this.mesh.add(propeller)
    }

    createIPBannerCanvas(material){
        let ip = this.IPAddr
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        canvas.width = canvas.height = 1024
        ctx.font = '80px monospace'
        ctx.textBaseline = 'top'
        let img = new Image()
        img.onload = ()=>{
            ctx.drawImage(img,0,0)
            ctx.fillText(ip,239,537)
            ctx.fillText(ip,124,802)
            material.map.needsUpdate = true
            this.loaded()
        }
        img.src = `images/plane_banner.jpg`
        return canvas
    }

    createCanvasMaterial(){
        let material = new THREE.MeshLambertMaterial()
        let canvas = this.createIPBannerCanvas(material)
        material.map = new THREE.Texture( canvas )
        return material
    }

    loadBanner(i,material){
        let idx = i + 1
        this.loader.load( `models/drcs/banner-0${idx}.drc`, (geometry)=>{
            let object = new THREE.Mesh(geometry,material)
            object.name = "banner"
            this.animFrames.push( object )
            if(idx==1){
                this.frame = object
                this.mesh.add(this.frame)
            }
            this.loaded()
        })
    }

    // -------------------------------------------------------------------------
    // animations for scene 1

    animReadyToBoard(type){
        if(type) this.packet.swapPacket(type)
        return new Promise((resolve,reject)=>{
            this.pilot.position.set(-0.25,-0.1,-3)
            this.pilot.rotation.set(0,0,0)
            new TWEEN.Tween(this.pilot.rotation).to({y:-Math.PI/2}, 500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(()=>{ resolve() }).start()
        })
    }

    animBow(){
        return new Promise((resolve,reject)=>{
            // bow down
            new TWEEN.Tween(this.pilot.rotation)
            .to({x:1.57,y:-0.79,z:1.57}, 500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(()=>{
                // bow up
                new TWEEN.Tween(this.pilot.rotation)
                .to({x:0,y:-Math.PI/2,z:0}, 500)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onComplete(()=>{
                    resolve()
                }).start()
            }).start()
        })
    }

    animBoard(){
        return new Promise((resolve,reject)=>{
            // turn back
            new TWEEN.Tween(this.pilot.rotation).to({x:0,y:0,z:0}, 500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(()=>{
                // hop on plane
                let sit = new THREE.Vector3(-0.25,0.25,0)
                new TWEEN.Tween(this.pilot.position).to(sit, 1000)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onComplete(()=>{
                    // look up at flying direction
                    let lookUp = {x:-1.57,y:1.03,z:1.57}
                    new TWEEN.Tween(this.pilot.rotation).to(lookUp, 250)
                    .easing(TWEEN.Easing.Quadratic.InOut)
                    .onComplete(()=>{
                        resolve()
                    }).start()
                }).start()
            }).start()
        })
    }

    animTurnAround(){
        return new Promise((resolve,reject)=>{
            // turn to look at network NetManagerStand
            new TWEEN.Tween(this.pilot.rotation).to({x:0,y:0,z:0}, 250)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(()=>{
                new TWEEN.Tween(this.pilot.rotation).to({x:0,y:-2.5,z:0}, 500)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onComplete(()=>{
                    resolve()
                }).start()
            }).start()
        })
    }

    animHopOff(){
        return new Promise((resolve,reject)=>{
            // head over to NetManagerStand
            new TWEEN.Tween(this.pilot.position).to({x:-3,y:0,z:-2.3}, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(()=>{
                resolve()
            }).start()
        })
    }

    pilotMountAnim(callback){
        this.animReadyToBoard()
        .then(()=>this.animBow())
        .then(()=>this.animBoard())
        .then(()=>{ if(callback) callback() })
        .catch(err => console.error(err))
    }

    pilotUnMountAnim(callback){
        this.animTurnAround()
        .then(()=>this.animHopOff())
        .then(()=>{ if(callback) callback() })
        .catch(err => console.error(err))
    }

}
