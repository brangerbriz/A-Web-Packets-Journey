/*

    NetManagerStand
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    instantiating this class creates the network manager stand (for scene 1). it
    extends the BaseObjClass

    requires the following dependencies from /libs:
    - BaseObjClass.js
    - three.min.js
    - DRACOLoader.js ( +decoder libs in libs/loaders/draco/ )
    as well as the following media files:
    - nmd_stand.jpg
    - nmd_stand.drc
    - wind_sock-1.drc
    - wind_sock-2.drc
    - wind_sock-3.drc
    - wind_sock-4.drc
    - wind_sock-5.drc
    - wind_sock-6.drc

    -----------
       usage
    -----------
    let stand

    // in VRWorld setup
    stand = new NetManagerStand((mesh,instance)=>{
        scene.add(mesh)
    })

    // in VRWorld draw loop
    stand.update(tick)
*/
class NetManagerStand extends BaseObjClass {
    constructor(callback){
        super(callback)

        this.flength = 6     // 6 wind socks total in animFrames
        this.loadTotalOf(7)  // 1 stand + 6 wind socks to load

        this.mat = new THREE.MeshLambertMaterial({
            side:2, map: new THREE.TextureLoader().load('images/nmd_stand.jpg')
        })

        this.loader.load( `models/drcs/nmd_stand.drc`, (geometry)=>{
            this.mesh = new THREE.Mesh(geometry,this.mat)
            for (let i = 0; i < 6; i++) this.loadWindSock(i)
            this.loaded()
        })
    }

    loadWindSock(i){
        let idx = i + 1
        this.loader.load( `models/drcs/wind_sock-${idx}.drc`, (geometry)=>{
            let object = new THREE.Mesh(geometry,this.mat)
            this.animFrames.push( object )
            if(idx==1){
                this.frame = object
                this.mesh.add(this.frame)
            }
            this.loaded()
        })
    }
}
