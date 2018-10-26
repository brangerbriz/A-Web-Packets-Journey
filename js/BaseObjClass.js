/*

    BaseObjClass
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    this is a base class for other classes which setups the DRC loader, as well
    as logic for obj-animated-gif-style animation update as well as handling the
    loaded callback

    requires the following dependencies from /libs:
    - three.min.js
    - DRACOLoader.js ( +decoder libs in libs/loaders/draco/ )

    -----------
       usage
    -----------

    class NewClass extends BaseObjClass {
        constructor(callback){
            super(callback)

            this.flength = 4     // n objs being pushed to this.animFrames
            this.loadTotalOf(5)  // n objs to load (ie. this.loaded() calls)
            // or
            // this.loadTotalOf(5,func) // optional callback to run after load
        }
    }
*/
class BaseObjClass {
    constructor(callback){
        this.mesh = new THREE.Object3D()
        this.cb = callback   // callback to run once it's all loaded

        this.tick = 0        // internal animation tick
        this.frame = null    // current mesh (ie. this.animFrames[this.fidx])
        this.fspeed = 8      // animation speed
        this.flength = 0     // target length of animFrames
        this.fidx = 0        // index of current animFrames
        this.animFrames = [] // meshes that function as different frames in
                             // animation update loop

        THREE.DRACOLoader.setDecoderPath( '../libs/loaders/draco/' )
        this.loader = new THREE.DRACOLoader()
    }

    after(times,func){
        return function() {
            if (--times < 1) return func.apply(this, arguments)
        }
    }

    loadTotalOf(amount,extraCallback){
        this.loaded = this.after(amount,()=>{
            // callback to fire once everything is loaded
            if(this.cb) this.cb(this.mesh, this)
            // in case extended class has additional things to call on load
            if(extraCallback) extraCallback()
        })
    }

    update(tick){
        tick = tick * this.fspeed  // adjust speed
        let frames = this.animFrames
        if(frames.length == this.flength){
            if(this.tick!==Math.floor(tick)){
                this.tick = Math.floor(tick)
                // inc framecount
                this.fidx++
                if(this.fidx>=frames.length) this.fidx = 0
                // remove last frame from mesh
                this.mesh.remove(this.frame)
                // show next frame
                this.frame = frames[this.fidx]
                this.mesh.add(this.frame)
            }
        }
    }
}
