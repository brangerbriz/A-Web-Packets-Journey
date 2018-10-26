/*

    NetManagerDaemon
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    instantiating this class creates the network manager daemon (for scene 1).
    it extends the BaseObjClass

    requires the following dependencies from /libs:
    - BaseObjClass.js
    - three.min.js
    - DRACOLoader.js ( +decoder libs in libs/loaders/draco/ )
    as well as the following media files:
    - nmd_diff.jpg
    - nmd_body.drc
    - nmd_push.drc
    - nmd_push_s.drc
    - nmd_push_w.drc
    - nmd_s1.drc
    - nmd_s2.drc
    - nmd_s3.drc
    - nmd_s4.drc
    - nmd_w1.drc
    - nmd_w2.drc
    - nmd_w3.drc
    - nmd_w4.drc


    -----------
       usage
    -----------
    let daemon

    // in VRWorld setup
    daemon = new NetManagerDaemon((mesh)=>{
        scene.add(mesh)
    })

    // in VRWorld draw loop
    daemon.update(tick)
*/
class NetManagerDaemon extends BaseObjClass {
    constructor(callback){
        super(callback)

        this.flength = 4         // 4 wing animations
        this.loadTotalOf(5,()=>{ // 1 for pushMesh, 4 for wings
            this._up() // run after all is loaded
        })

        this.pushMesh = new THREE.Object3D()

        this.mat = new THREE.MeshLambertMaterial({
            map: new THREE.TextureLoader().load('images/nmd_diff.jpg')
        })
        this.pink = new THREE.MeshLambertMaterial({ side:2, color:'#ff7599'})
        this.white = new THREE.MeshLambertMaterial({
            side:2, color:'#fff', opacity:'0.7', transparent:true
        })

        this.loader.load( 'models/drcs/nmd_body.drc', (geometry)=>{
            let object = new THREE.Mesh( geometry, this.mat )
                object.name = 'network-manager-daemon'

            let neck = new THREE.Mesh( // invisible neck for raycasting
                new THREE.CylinderBufferGeometry( 0.75, 0.75, 4, 10 ),
                new THREE.MeshBasicMaterial({opacity:0, transparent:true }))
                neck.position.y = -0.75
                neck.name = 'network-manager-daemon'

            this.mesh.add( object )
            this.mesh.add( neck )
            for (let i = 0; i < this.flength; i++) this.loadFlapping(i)
        },null,(err)=>{ console.log(err)})

        this.loadPushFrame()
    }

    loadPushFrame(){
        this.loader.load( `models/drcs/nmd_push.drc`, (geopush)=>{
            this.pushMesh.add( new THREE.Mesh( geopush, this.mat ) )

            this.loader.load( `models/drcs/nmd_push_s.drc`, (geops)=>{
                this.pushMesh.add( new THREE.Mesh( geops, this.pink ) )

                this.loader.load( `models/drcs/nmd_push_w.drc`, (geopw)=>{
                    this.pushMesh.add( new THREE.Mesh( geopw, this.mat ) )

                    this.pushMesh.children.forEach(m=>{ m.position.z = -3 })
                    this.loaded() // increment loaded tally

                },null,(err)=>{ console.log(err)})

            },null,(err)=>{ console.log(err)})

        },null,(err)=>{ console.log(err)})
    }

    loadFlapping(i){
        let idx = i + 1
        let wing_spine_path = `models/drcs/nmd_s${idx}.drc`
        let wing_trans_path = `models/drcs/nmd_w${idx}.drc`
        let wing = new THREE.Object3D()

        // conditionally apply y offset
        if(i==1) wing.position.y = -9.035
        else if(i==2) wing.position.y = -18.2749
        else if(i==3) wing.position.y = -27.7849

        this.loader.load( wing_spine_path, (geospine)=>{
            wing.add( new THREE.Mesh( geospine, this.pink ) )

            this.loader.load( wing_trans_path, (geotrans)=>{
                wing.add( new THREE.Mesh( geotrans, this.white ) )

                this.animFrames.push( wing ) // add to frames array
                if(i==0) this.mesh.add( wing ) // if first, add to mesh
                this.loaded() // increment loaded tally

            },null,(err)=>{ console.log(err)})

        },null,(err)=>{ console.log(err)})
    }

    _up(){
        let target = this.mesh.position.y + 0.3
        new TWEEN.Tween(this.mesh.position).to({ y:target }, 1200)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(()=>{ this._down() }).start()
    }

    _down(){
        let target = this.mesh.position.y - 0.3
        new TWEEN.Tween(this.mesh.position).to({ y:target }, 1200)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(()=>{ this._up() }).start()
    }

}
