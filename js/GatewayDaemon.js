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

        this.fspeed = 2
        this.flength = 7         // 7 poses
        this.loadTotalOf(8,()=>{ // 1 for pushMesh, 7 for poses
            //this._up() // run after all is loaded
        })

        this.mat = new THREE.MeshLambertMaterial({
            side:2, map:new THREE.TextureLoader().load('images/gateway_daemon.jpg')
        })

        this.pushMesh = new THREE.Object3D()
        this.loader.load( `models/drcs/gdaemon_push.drc`, (geopush)=>{
            this.pushMesh = new THREE.Mesh(geopush,this.mat)
            this.loaded()
        },null,(err)=>{ console.log(err)})

        for (let i = 0; i < this.flength; i++) this.loadPoses(i)
    }

    loadPoses(i){
        let idx = i + 1
        let path = `models/drcs/gdaemon_0${idx}.drc`

        this.loader.load(path,(geo)=>{
            let pose = new THREE.Mesh(geo,this.mat)
            let adjust = -9.72
            pose.position.x = adjust*i

            if(i==0) this.mesh.add( pose )
            this.animFrames.push( pose )
            this.loaded()
        },null,(err)=>{ console.log(err)})
    }

}
