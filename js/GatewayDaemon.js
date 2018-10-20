/*

    GatewayDaemon
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    instantiating this class creates the gateway daemon (for scene 2). it
    extends the BaseObjClass

    requires the following dependencies from /libs:
    - BaseObjClass.js
    - three.min.js
    - DRACOLoader.js ( +decoder libs in libs/loaders/draco/ )
    as well as the following media files:
    - gdaemon_01.drc
    - gdaemon_02.drc
    - gdaemon_03.drc
    - gdaemon_04.drc
    - gdaemon_05.drc
    - gdaemon_06.drc
    - gdaemon_07.drc
    - gdaemon_push.drc

    -----------
       usage
    -----------
    let daemon

    // in VRWorld setup
    daemon = new GatewayDaemon((mesh)=>{
        scene.add(mesh)
    })

    // in VRWorld draw loop
    daemon.update(tick)
*/
class GatewayDaemon extends BaseObjClass {
    constructor(callback){
        super(callback)

        this.floating = false

        this.fspeed = 2
        this.flength = 7         // 7 poses
        this.loadTotalOf(8,()=>{ // 1 for pushMesh, 7 for poses
            //this._up() // run after all is loaded
        })

        this.mat = new THREE.MeshLambertMaterial({
            side:2, map:new THREE.TextureLoader().load('images/gateway_daemon.jpg')
        })

        this.mesh.name = 'gateway-daemon'

        this.pushMesh = new THREE.Object3D()
        this.loader.load( `models/drcs/gdaemon_push.drc`, (geopush)=>{
            this.pushMesh = new THREE.Mesh(geopush,this.mat)
            this.loaded()
        },null,(err)=>{ console.log(err)})

        for (let i = 0; i < this.flength; i++) this.loadPoses(i)
    }

    swapPose(i){
        // 0: standing
        // 1: batons down
        // 2: batons up
        // 3: batons left
        // 4: baton right
        // 5: batons out
        // 6: baton cross
        let frame = this.animFrames[this.fidx]
        this.mesh.remove( frame )
        this.fidx = i
        this.mesh.add( this.animFrames[i] )
    }

    checkPacket(time){
        new TWEEN.Tween(this.mesh.position).to({z:5}, time)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(()=>{
            new TWEEN.Tween(this.mesh.position).to({z:7.5}, time)
            .easing(TWEEN.Easing.Quadratic.Out).start()
        }).start()
        new TWEEN.Tween(this.mesh.rotation).to({x:-Math.PI*2}, time)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(()=>{
            new TWEEN.Tween(this.mesh.rotation).to({x:0}, time)
            .easing(TWEEN.Easing.Quadratic.Out).start()
        }).start()
    }

    float(){
        if(!this.floating){
            new TWEEN.Tween(this.mesh.position).to({y:1.25,z:7.5}, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(()=>{
                this.floating = true
                this.float()
            }).start()
            new TWEEN.Tween(this.mesh.rotation).to({x:Math.PI*2}, 1000)
            .easing(TWEEN.Easing.Quadratic.Out).start()
        } else {
            let y = (this.mesh.position.y > 1.2) ? 1 : 1.25
            new TWEEN.Tween(this.mesh.position).to({y:y}, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(()=>this.float()).start()
        }
    }

    loadPoses(i){
        let idx = i + 1
        let path = `models/drcs/gdaemon_0${idx}.drc`
        let x = [0,-9.72,-19.52,-29.16,-35.279,-46.599,-55.219]
        this.loader.load(path,(geo)=>{
            let pose = new THREE.Mesh(geo,this.mat)
            pose.position.x = x[i]
            pose.name = 'gateway-daemon'
            if(i==0) this.mesh.add( pose )
            this.animFrames[i] = pose
            this.loaded()
        },null,(err)=>{ console.log(err)})
    }

}
