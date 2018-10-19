/*

    VRWorld
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    this class takes care of a lot of the three.js boiler plate setup as well as
    handling the setup for the platform specific controls: mobile, cardboard,
    desktop and WebVR.

    requires the following dependencies from /libs:
    - three.min.js
    - PointerLockControls.js
    - WebVR.js (my edited version)
    - webvr-polyfill.js
    - VRControls.js
    - VREffect.js
    - stats.min.js (for debug)
    - OrbitControls.js (for debug)

    -----------
       usage
    -----------

    const world = new VRWorld({
        background: '#000',          // either a THREE.Texture or color-value
        titleCard:'image.png',       // shows up when 'paused'
        //shadowMap: true,             // boolean
        debug:false,                 // display stats && mobile errors
        debugControls:true,          // orbit cntrls, instead of device cntrls
        cutscene:false,             // if true, it wont' setup any cntrls
        camera:{ x:0, y:0, z:0, fov:40 },
        fog:{ color:'#f0f', near:100, far:150 },
        crosshair: {
            names:['obj-name'], // names of object to include in raycasting
            block:['wall'], // optional list of object names that block raycaster
            time:1000, // time over object before select fires
            select:function(name){
                console.log(`selected ${name}`)
            },
            progress:function(prog,name){
                // how long have we been 'selecting' this object
                // ie. what percentage of the time above past
                console.log(`over ${name} for ${prog*100}% of time`)
            },
            exit:function(name){
                console.log(`no longer selecting ${name}`)
            },
            debug:function(names){
                // click to get names of all objs in view  of crosshair
                console.log(names)
            }
        },
        setup:(scene,camera,renderer)=>{
            //
            // init function
            //
        },
        draw:(scene,camera,renderer,clock)=>{
            //
            // animation loop
            //
        }
    })
*/
class VRWorld {
    constructor(config){
        if(!config) config = {}
        this.tick = new THREE.Clock()
        if(config.titleCard) this.titleCard  = config.titleCard

        this.setRenderer(config)
        this.setScene(config)
        if(config.cutscene) this.desktopAnimate()
        else this.setControls(config)
        if(config.debug) this.setDebug()

        // run setup function
        if(config.setup) config.setup(this.scene,this.camera,this.renderer)
        if(config.draw) this.draw = config.draw
    }

    resize(){
        if(this.type=="mobile" && !this.resizeDelay){
            this.resizeDelay = setTimeout(()=>{
                this.resizeDelay = null
                this.camera.aspect = innerWidth / innerHeight
                this.camera.updateProjectionMatrix()
                // this.vrEffect.setSize( innerWidth, innerHeight, false )
                this.renderer.setSize(innerWidth, innerHeight)
            }, 250)
        } else {
            this.camera.aspect = innerWidth / innerHeight
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(innerWidth, innerHeight)
        }
    }

    // -------------------------------------------------------------------------
    // ------------------------------------------------------------------- setup
    // -------------------------------------------------------------------------

    setRenderer(config){
        this.renderer = new THREE.WebGLRenderer({ antialias:true })
        this.renderer.setSize( innerWidth, innerHeight )
        // TODO look into detecting pixel ratio, warn if it's gonna looked aliased
        this.renderer.setPixelRatio(Math.floor(window.devicePixelRatio))
        this.renderer.domElement.style.position = 'absolute'
        this.renderer.shadowMap.enabled = true // TODO config.renderer.o?
        // let bg = (typeof config.background == "string") ?
        //     config.background : 0x000000
        // this.renderer.setClearColor( bg,0 )
        document.body.appendChild( this.renderer.domElement )
    }

    setScene(config){
        this.scene = new THREE.Scene()

        if(config.debugControls) this.scene.userData.debug = true

        if(config.background instanceof THREE.Texture){
            this.scene.background = config.background
        } else if (typeof config.background=="string"){
            this.scene.background = new THREE.Color(config.background)
        }

        if(config.fog){
            this.scene.fog = new THREE.Fog(
                config.fog.color, config.fog.near, config.fog.far
            )
        }

        let ar = innerWidth/innerHeight
        let fov = (config && config.camera && config.camera.fov) ?
            config.camera.fov : 70
        let min = (config && config.camera && config.camera.min) ?
            config.camera.min : 0.1
        let max = (config && config.camera && config.camera.max) ?
            config.camera.max : 1000000
        this.camera = new THREE.PerspectiveCamera(fov, ar, min, max )
        if(config.camera) {
            let x = config.camera.x || 0
            let y = config.camera.y || 0
            let z = config.camera.z || 0
            this.camera.position.set(x,y,z)
        }

        window.addEventListener('resize',()=>{this.resize()},false)

        if(config.crosshair){
            // reference point for anything that needs to be placed
            // just behindthe crosshair's position
            this.crosshair_t = new THREE.Object3D()
            this.crosshair_t.position.z = -0.51
            this.camera.add( this.crosshair_t )

            this.crosshair = new THREE.Mesh(
                new THREE.RingBufferGeometry( 0.01, 0.02, 32 ),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff, opacity: 0, transparent: true
                })
            )
            this.crosshair_p = new THREE.Mesh(
                new THREE.RingBufferGeometry( 0.01, 0.02, 32, null, 0, 0 ),
                new THREE.MeshBasicMaterial({color: 0xffff00})
            )
            this.crosshair.position.z = -0.5
            this.crosshair_p.position.z = -0.49
            this.camera.add( this.crosshair )
            this.camera.add( this.crosshair_p )
            // create raycaster
            this.setRaycaster(config.crosshair)
        }
    }

    // --------------------------------------------------------------- raycaster

    setRaycaster(params){
        this.rayparams = params
        this.raycaster = new THREE.Raycaster()
        this.rayarr = [] // intersected objects
        // for debug
        if(typeof this.rayparams.debug=="function"){
            console.log('VRWorld: click to see current raycast array')
            document.addEventListener('click',(e)=>{
                let check = this.scene.children
                let arr = this.raycaster.intersectObjects( check, true )
                let names = arr.map(o=>o.object.name)
                this.rayparams.debug(names)
            })
        }
    }

    _isBlockName(name){
        if(this.rayparams.block && this.rayparams.block.includes(name))
            return true
        else return false
    }

    _resetCrosshair(){
        if(typeof this.rayparams.exit=="function")
            this.rayparams.exit(this.rayselecting)
        this.rayselecting = null
        this.rayselected = null
        this.crosshair_p.geometry.dispose()
        this.crosshair_p.geometry =
            new THREE.RingBufferGeometry(0.01,0.02,32,null,0,0)
        clearInterval(this.raytimer)
    }

    _raySelect(){
        if( this.rayarr.length == 0 ){
            // if we're not over anything, reset everything
            this._resetCrosshair()
        } else if( this._isBlockName(this.rayarr[0].object.name) ){
            // if we're on a block item
            this._resetCrosshair()
        } else if(this.rayselecting !== this.rayarr[0].object.name &&
                  this.rayselected  !== this.rayarr[0].object.name ){
            // if we are over something && that thing is not what we either
            // started selecting or finished selecting, then start selecting
            this.rayselecting = this.rayarr[0].object.name
            // start the rayselecting progress timer
            this.rayselon = this.tick.elapsedTime
            let time = this.rayparams.time || 1000
            clearInterval(this.raytimer)
            this.raytimer = setInterval(()=>{
                // we've "selectd" it, if we're still selecting that item
                // once we've reached the designated time
                this.rayselected = this.rayselecting
                this.rayselecting = null
                // make crosshair appears fuly selected
                this.crosshair_p.geometry.dispose()
                this.crosshair_p.geometry =
                    new THREE.RingBufferGeometry(0.01,0.02,32,null,0,Math.PI*2)
                // trigger callback
                if(typeof this.rayparams.select=="function")
                    this.rayparams.select(this.rayselected)
                clearInterval(this.raytimer)
            },time)
        }
    }

    _rayProgres(){
        if(typeof this.rayparams.progress=="function"){
            // calculate progress
            let time = this.rayparams.time || 1000
            let pass = this.tick.elapsedTime - this.rayselon
            let prog = pass / (time/1000)
            // update mesh
            let theta = prog * (Math.PI*2)
            let geo = new THREE.RingBufferGeometry(0.01,0.02,32,null,0,theta)
            this.crosshair_p.geometry.dispose()
            this.crosshair_p.geometry = geo
            // run callback
            this.rayparams.progress(prog,this.rayselecting)
        }
    }

    updateRaycaster(){
        // if()
        this.raycaster.setFromCamera(this.crosshair.position, this.camera )
        let check = this.scene.children
        this.rayarr = this.raycaster.intersectObjects( check, true )
        let watch = this.rayparams.names
        if(this.rayparams.block) watch = watch.concat(this.rayparams.block)
        this.rayarr = this.rayarr.filter(o=>watch.includes(o.object.name))
        this._raySelect() // select closest intersected obj && start timer
        if(this.rayselecting) this._rayProgres() // report how long selected
    }

    // ----------------------------------------------------------- debug helpers

    dlog(message){
        let err = document.createElement('div')
        err.textContent = message
        this.mdbg.appendChild(err)
    }

    setDebug(){
        this.stats = new Stats()
        document.body.appendChild( this.stats.dom )
        //
        this.mdbg = document.createElement('div')
        this.mdbg.style.backgroundColor = 'rgba(0,0,0,0.5)'
        this.mdbg.style.color = '#fff'
        this.mdbg.style.fontFamily = 'Source_Code, monospace'
        this.stats.domElement.appendChild(this.mdbg)

        if(this.type=="mobile"){
            window.addEventListener('error', function(e){
                if(e.message) { // Chrome sometimes provides this
                    this.dlog(`ERR: ${e.message} at line: ${e.lineno} in ${e.filename}`)
                } else {
                    this.dlog(`ERR: ${e.type} in ${e.srcElement || e.target}`)
                }
            }, true)
        }
    }

    // -------------------------------------------------------------------------
    // ------------------------------------------------- cross-platform controls
    // -------------------------------------------------------------------------

    _setCntrls(type){
        this.type = type
        if (type == "mobile") {
            this.createCoverScreen()
            this.mobileSetup()
        } else if(type == "webvr") {
            this.webVRSetup()
            this.createCoverScreen()
        } else {
            this.createCoverScreen()
            this.desktopSetup()
        }
    }

    setControls(config){
        this.screen
        this.type   // mobile | webvr | desktop
        this.height = config.height || 1.6

        if(config.debugControls){
            this.debugControlsSetup()
            this.desktopAnimate()
        } else if(location.search.includes('platform=webvr')){
            this._setCntrls("webvr")
        } else if(location.search.includes('platform=mobile')){
            this._setCntrls("mobile")
        } else if(location.search.includes('platform=desktop')){
            this._setCntrls("desktop")
        }  else {
            // if webVR capability
            if(navigator.getVRDisplays) this._setCntrls("webvr")
            // if mobile (NOTE: this likely will also fire for tablets)
            else if (typeof window.orientation !== 'undefined') this._setCntrls("mobile")
            // otherwise asume a non-vr capable desktop
            else this._setCntrls("desktop")
        }
    }

    debugControlsSetup(){
        this.debugControls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
        this.debugControls.minDistance = 1
        this.debugControls.maxDistance = 500
        // this.debugControls.maxPolarAngle = Math.PI / 2
    }

    createCoverScreen(){
        if(this.screen) this.screen.parentElement.removeChild(this.screen)

        let css = {
            'box-sizing':'border-box',
            'font-family':'Source_Code, monospace',
            // 'background':'rgba(0,0,0,0.5)',
            'color':'#fff',
            'text-align':'center',
            'padding':'10px',
            'width':'100%',
            'height':'100%',
            'position':'fixed',
            'top':'0px;',
            'left':'0px',
            'z-index':'10',
            'display':'flex',
            'flex-direction':'column',
            'justify-content': 'space-between',
            'align-items': 'center'
        }
        let ele = document.createElement('div')
        for(let prop in css) ele.style[prop] = css[prop]
        this.screen = ele
        this.pause = true
        document.body.appendChild(this.screen)

        let top = document.createElement('div')
        this.screen.appendChild(top)

        if(this.titleCard){
            let img = document.createElement('img')
            img.src = this.titleCard
            img.style.width = '90%'
            img.ondragstart= ()=>{return false}
            this.titleCard = img
            this.screen.appendChild(this.titleCard)
        } else {
            let mid = document.createElement('div')
            this.screen.appendChild(mid)
        }

        let btn_css = {
            'padding': '12px 40px',
            'border': '1px solid #000',
            'border-radius': '4px',
            'background': '#000',
            'color': '#fff',
            'font': '13px sans-serif',
            'text-align': 'center',
            'margin': '0px 5px',
            'text-transform':'uppercase',
            'cursor': 'pointer'
        }

        if(this.type=="desktop"){
            let button = document.createElement('button')
            button.addEventListener('click',(e)=>{ this.toggleCover('off') })
            for(let prop in btn_css) button.style[prop] = btn_css[prop]
            button.textContent = "Start (esc to pause)"
            this.screen.appendChild(button)

        } else if(this.type=="webvr"){
            let vrbtn = document.querySelector('#webvr-info-button')
            for(let prop in btn_css) vrbtn.style[prop] = btn_css[prop]
            vrbtn.addEventListener('click',()=>{
                if(vrbtn.textContent.includes('ENTER')) this.toggleCover('off')
                else if(vrbtn.textContent.includes('EXIT')) this.toggleCover('on')
            })
            let bottom = document.createElement('div')
            this.screen.appendChild(bottom)

        } else if(this.type=="mobile"){
            // TODO add to home screen button/info/something...
            // maybe replace top element? w/ "fullscreen" or "download" etc
            let div = document.createElement('div')
            div.style.display = "flex"
            div.style.justifyContent = "space-around"

            let button = document.createElement('button')
            button.addEventListener('click',(e)=>{ this.toggleCover('off') })
            for(let prop in btn_css) button.style[prop] = btn_css[prop]
            button.textContent = "Start"
            div.appendChild(button)

            let vr_btn = document.createElement('button')
            vr_btn.addEventListener('click',(e)=>{
                this.toggleCover('off')
                this.vrDisplay.requestPresent([{source:this.renderer.domElement}])
            })
            for(let prop in btn_css) vr_btn.style[prop] = btn_css[prop]
            vr_btn.textContent = "Switch to VR"
            div.appendChild(vr_btn)

            this.screen.appendChild(div)
            this.renderer.domElement.addEventListener('touchend',(e)=>{
                navigator.getVRDisplays().then((vrDisplays)=>{
                    if(!vrDisplays[0].isPresenting) this.toggleCover('on')
                })
            })

        }
    }

    toggleCover(type){
        if(type=="on") this.pause = true
        else if(type=="off") this.pause = false
        else this.pause = !this.pause

        if(!this.pause){
            this.screen.style.display = 'none'
            if(this.type=="desktop") this.enableDesktopControls()
            if(this.raycaster) this.camera.children[1].material.opacity = 0.5
        } else {
            this.screen.style.display = 'flex'
            clearInterval(this.raytimer)
            if(this.raycaster) this.camera.children[1].material.opacity = 0
        }
    }

    // ------------------------------------------------------------- type: webvr

    webVRSetup(){
        this.renderer.vr.enabled = true
        this.renderer.vr.userHeight = this.height
        document.body.appendChild( WEBVR.createButton(this.renderer) )
        this.camera.name = 'camera'
        this.scene.add( this.camera )
        this.renderer.setAnimationLoop(()=>{ this.webvrAnimate() })
    }

    // ----------------------------------------------------------- type: desktop

    desktopSetup(){
        this.camera.position.set(0,0,0)

        this.controls = new THREE.PointerLockControls( this.camera )
        this.controls.getObject().position.y = this.height
        let cam = this.controls.getObject()
        cam.name = 'camera'
        this.scene.add( cam )

        let havePointerLock = 'pointerLockElement' in document ||
                              'mozPointerLockElement' in document ||
                              'webkitPointerLockElement' in document
        if(havePointerLock){
            let change = (event)=>{
                if (document.pointerLockElement === document.body ||
                    document.mozPointerLockElement === document.body ||
                    document.webkitPointerLockElement === document.body ) {
                    this.controls.enabled = true
                    this.toggleCover('off')
                } else {
                    this.controls.enabled = false
                    this.toggleCover('on')
                }
            }
            let error = (event)=>{
                console.log('VRWorld: pointer lock error',event)
                this.controls.enabled = false
                this.toggleCover('on')
            }
            document.addEventListener('pointerlockchange',change,false)
            document.addEventListener('pointerlockerror',error,false)

            this.desktopAnimate()

        } else {
            throw new Error('VRWorld: no pointerlock API support')
        }
    }

    enableDesktopControls(event){
        document.body.requestPointerLock = document.body.requestPointerLock ||
                                        document.body.mozRequestPointerLock ||
                                        document.body.webkitRequestPointerLock
        document.body.requestPointerLock()
    }

    // ------------------------------------------------------------ type: mobile

    mobileSetup(){
        document.addEventListener('touchmove',(e)=>{e.preventDefault()})
        this.camera.name = 'camera'
        this.scene.add( this.camera )

        this.polyfill = new WebVRPolyfill()

        this.vrEffect = new THREE.VREffect(this.renderer)
        this.vrEffect.setSize( innerWidth, innerHeight, false )
        window.addEventListener('resize',(e)=>{
            this.vrEffect.setSize( innerWidth, innerHeight, false )
        },false)

        navigator.getVRDisplays().then((vrDisplays)=>{
            if(vrDisplays.length) {
                this.vrDisplay = vrDisplays[0]
                // apply VR headset positional data to camera
                this.controls = new THREE.VRControls(this.camera)
                this.controls.standing = true
                // start animation loop
                this.vrDisplay.requestAnimationFrame(()=>{ this.mobileAnimate() })
                // button to switch to cardboard mode
                // this.createMobileScreen() // TODO REMOVE/REPLACE
            } else { alert('something went wrong with webvr-polyfill!') }
        })
    }

    // -------------------------------------------------------------------------
    // ---------------------------------------------------------- animation loop
    // -------------------------------------------------------------------------

    mobileAnimate(){
        this.vrEffect.render(this.scene, this.camera)
        if(this.draw) this.draw(this.scene,this.camera,this.vrEffect,this.tick )
        if(this.raycaster && !this.pause && !this.debugControls) this.updateRaycaster()
        if(this.stats) this.stats.update()
        this.controls.update()
        this.vrDisplay.requestAnimationFrame(()=>{ this.mobileAnimate() })
    }

    webvrAnimate(){
        this.renderer.render( this.scene, this.camera )
        if(this.debugControls) this.debugControls.update()
        if(this.raycaster && !this.pause && !this.debugControls) this.updateRaycaster()
        if(this.draw) this.draw(this.scene,this.camera,this.renderer,this.tick )
        if(this.stats) this.stats.update()
    }

    desktopAnimate(){
        requestAnimationFrame(()=>{ this.desktopAnimate() })
        this.renderer.render( this.scene, this.camera )
        if(this.debugControls) this.debugControls.update()
        if(this.raycaster && !this.pause && !this.debugControls) this.updateRaycaster()
        if(this.draw) this.draw(this.scene,this.camera,this.renderer,this.tick )
        if(this.stats) this.stats.update()
    }
}
