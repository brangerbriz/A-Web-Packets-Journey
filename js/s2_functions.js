function loadIsland(callback){
    let imap = new THREE.TextureLoader().load('images/island.jpg')
    let imat = new THREE.MeshLambertMaterial({side:2, map:imap})
    let trees = new THREE.MeshBasicMaterial({
        color:new THREE.Color(1, 0.870588, 0.490196),
        opacity:0.5, transparent:true
    })

    new THREE.OBJLoader()
    .load( `models/obj-mtl/the_gateway/isla.obj`, (object)=>{
        object.name = 'the-island'
        object.children[0].material = trees
        object.children[1].material = imat
        object.children[1].castShadow = true
        object.children[1].receiveShadow = true
        if(callback) callback( object )
    },null,(err)=>{ console.warn(err)})
}




class ParticleWall {
    constructor(scene){
        this.amt = 1000
        this.area = 200
        this.size = 1 // 0.25
        this.opac = 1 // 0.25
        this.tick = 0

        this.mesh = new THREE.Object3D()
        for (let i = 0; i < this.amt; i++) this.initParticle(true)
        scene.add(this.mesh)

    }
    ranSpot(){
        return {
            x:Math.random()*this.area - this.area/2,
            y:Math.random()*this.area - this.area/2,
            z:Math.random()*this.area - this.area/2
        }
    }

    _mvpart(p){
        let target = -self.area/2
        let speed = 3000
        new TWEEN.Tween(p.position).to({x:target }, speed)
        .onComplete(()=>{
            let ran = this.ranSpot()
            p.position.set(self.area/2,ran.y,ran.z)
            this._mvpart(p)
        }).start()
    }

    initParticle(){
        let self = this
        let ran = this.ranSpot()
        // let geometry = new THREE.SphereBufferGeometry(0.25,2,2)
        let s = this.size
        let geometry = new THREE.PlaneBufferGeometry(s,s,s)
        let material = new THREE.MeshBasicMaterial({
            transparent:true,opacity:this.opac,side:2
        })
        let particle =  new THREE.Mesh( geometry, material )
        particle.position.set(ran.x,ran.y,ran.z)
        particle.rotation.y = Math.PI/2
        particle.rotation.z = Math.PI/4
        // particle.update = function(amnt){
        //     this.position.x -= amnt
        //     if(this.position.x <= -self.area/2){
        //         let ran = self.ranSpot()
        //         this.position.set(self.area/2,ran.y,ran.z)
        //     }
        // }
        this.mesh.add( particle )
        this._mvpart( particle )
    }

    update(tick){
        // tick = tick * 10 // adjust speed (up to ~30)
        // if(this.tick!==Math.floor(tick)){
        //     this.tick = Math.floor(tick)
        //
        //     this.mesh.children.forEach(p=>{
        //         p.update(2)
        //     })
        // }
    }
}
