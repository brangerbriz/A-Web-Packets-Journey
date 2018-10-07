/*
    DialogueVR
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    this class takes a 'narrative' object which it uses to create the 3D
    dialogue boxes in the game.

    requires the following dependencies from /libs:
    - three.min.js


    -----------
       usage
    -----------

    const talk = new DialogueVR({
        'object-name':{ // name of dialogue object, there can be multiple
                        // see one of the _narrative.js files for full example
            'start':[   // the first convo must be called 'start'
                {       // convos are array's consisting of objects (text boxes)
                        // each object requires a 'text' property (max length 3)
                    text:[
                        "Oh, hello there! I didn't notice",
                        "another packet standing behind us :)"
                    ],
                        // you can also specify options  (up to 4)
                        // value for 'goto' should be another convo name
                        // if no options are specified, a 'next' option appears
                        // unless it's the last object in 'start' array, in
                        // which case an 'end' option appears
                    options:[
                        {text:"what's a packet?",goto:'packet-is'},
                        {text:"what were you looking at?",goto:'user-is'},
                        {text:"can't talk, I'm on a mission!",goto:'end'}
                    ],
                        // 'before' hook runs before box shows up,
                        // box won't show up until calling next()
                        // 'name' in this case is 'object-name'
                    before:function(name,next){
                        bringHttpPacketToMe(name,next)
                    },
                        // 'after' hook runs when the user picks an option
                        // choice is either 'option1','option2', etc.
                    after:function(name,choice){
                        if(choice=="option3") sendHttpPacketBack(name)
                    }
                }
            ],
        }
    })

*/

class DialogueVR {
    constructor(script){
        this.showing = true
        this.parseScript(script)
        this.options = ['option1','option2','option3','option4']
        this.optMeshes = []
        this.spot // current position of box
        this.current // name of current object (ie. it's script)
    }

    // ------------------------------------------------------------ mesh methods

    drawBox(){
        let full_width = (innerWidth/innerHeight) * 0.6
        let half_width = (innerWidth/innerHeight) * 0.3
        let width = (innerWidth<1200) ? full_width : half_width
        let height = width / (600/110)
        this.createBox(width,height)
    }

    createBox(w,h){
        if(this.box && this.box.parent) this.box.parent.remove(this.box)
        let geo = new THREE.PlaneBufferGeometry(w,h,1)
        this.box = new THREE.Mesh(geo,this.materials[0])
        this.box.name = "dialogue"
        // remove any old option boxes
        this.optMeshes = []
        // create option boxes
        for (let i = 0; i < 4; i++) {
            let g = new THREE.PlaneBufferGeometry(w,h/3,1)
            let opt = new THREE.Mesh(g,this.materials[i+1])
            opt.name = `option${i+1}`
            this.optMeshes.push( opt )
            let first = -( h/2 + h/6 )
            opt.position.y = (i==0) ? first : first-(i*(h/3))
        }
    }

    createMaterials(){
        this.materials = []
        for (let i = 0; i < 5; i++) {
            let canvas = document.createElement('canvas')
            let ctx = canvas.getContext('2d')
            canvas.width =  600
            canvas.height = (i>0) ? 110/3 : 110
            ctx.fillStyle = "#000"
            ctx.fillRect(0,0,canvas.width,canvas.height)
            ctx.font = '25px Source_Code, monospace'
            ctx.textBaseline = 'top'
            let texture = new THREE.CanvasTexture( canvas )
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            let material = new THREE.MeshBasicMaterial({side:2, map:texture})
            this.materials.push(material)
        }
    }

    updateCanvas(dialogue){
        // reset
        this.materials.forEach(m=>{m.opacity=0})
        // main dialogue box
        let canvas = this.materials[0].map.image
        let ctx = canvas.getContext('2d')
        ctx.fillStyle = "#000"
        ctx.fillRect(0,0,canvas.width,canvas.height)
        ctx.fillStyle = "#fff"
        let text = dialogue.text
        for (let i = 0; i < text.length; i++) {
            let y = (i*30)+15
            ctx.fillText(text[i], 15,y)
        }
        this.materials[0].map.needsUpdate = true
        // options
        for (let i = 0; i < dialogue.options.length; i++) {
            let canvas = this.materials[i+1].map.image
            let ctx = canvas.getContext('2d')
            ctx.fillStyle = "#000"
            ctx.fillRect(0,0,canvas.width,canvas.height)
            ctx.fillStyle = "#fff"
            ctx.fillText("> "+dialogue.options[i].text, 15,7)
            this.materials[i+1].map.needsUpdate = true
        }
    }

    // -------------------------------------------------------- dialogue methods

    reset(name){
        while(this.box.children.length) this.box.remove(this.box.children[0])
        this.scene.remove( this.box )
    }

    placeDialogueBox(){
        if(!this.spot){
            this.scene.updateMatrixWorld()
            this.camera.updateMatrixWorld()
            let p = new THREE.Vector3()
            p.setFromMatrixPosition( this.camera.children[0].matrixWorld )
            this.box.position.set( p.x, p.y, p.z )
            let x = this.camera.position.x
            let z = this.camera.position.z
            let l = (this.camera.position.y==0) ?
                new THREE.Vector3(x,this.height,z) :
                new THREE.Vector3(x,this.camera.position.y,z)
            this.box.lookAt( l )
            this.spot = p
        } else {
            this.box.position.set( this.spot.x, this.spot.y, this.spot.z )
        }
    }

    parseScript(script){
        let checkForErrors = false // NOTE change to test for errors
        this.script = script
        this.status = {}
        for (let obj in script) {
            if( !(script[obj].hasOwnProperty('start')) )
                throw new Error('DialogueVR: each object in script needs a '+
                'their first dialogue to be called "start"')
            let status = { dialogue:"start", index:0 }
            this.status[obj] = status
            for(let d in script[obj]){
                script[obj][d].forEach((dialogue,i)=>{
                    if(checkForErrors){
                        if( !dialogue.text ) throw new Error(`DialogueVR: the `+
                        `${d} dialogue ${i} for ${obj} has no text array`)
                        if( dialogue.text.length > 3){
                            throw new Error(`DialogueVR: the ${d} dialogue `+
                            `${i} for ${obj} can only have 3 items in text`)
                        } else {
                            dialogue.text.forEach(txt=>{
                                if(txt.length>38) throw new Error(`DialogueVR:`+
                                `${d} in ${obj} has text that's too long`)
                            })
                        }
                        // make sure no more than 4 options
                        if( dialogue.options && dialogue.options.length > 4)
                            throw new Error(`DialogueVR: the ${d} dialogue `+
                            `${i} for ${obj} has too many options, max is 4.`)
                    }
                    // create default option if necessary
                    if( !dialogue.options && i!=script[obj][d].length-1){
                        let defaultOpt = {text:'[more]',goto:'next'}
                        this.script[obj][d][i].options = [ defaultOpt ]
                    } else if(!dialogue.options && i==script[obj][d].length-1){
                        let defaultOpt = {text:'[end]',goto:'end'}
                        this.script[obj][d][i].options = [ defaultOpt ]
                    }
                })
            }
        }
    }

    // ---------------------------------------------------------- public methods
    setup(config){
        if(!this.scene){
            this.camera = config.camera
            this.scene = config.scene
            this.renderer = config.renderer
            this.height = config.height || 1.6
            this.createMaterials()
            this.drawBox()
            window.addEventListener('resize',(e)=>{this.drawBox()})
        }
    }

    removeHighlight(name){
        let idx = this.options.indexOf(name)
        if(idx>=0){
            let d = this.status[this.current].dialogue
            let i = this.status[this.current].index
            let dialogue = this.script[this.current][d][i]
            this.updateCanvas(dialogue)
        }
    }

    highlight(name){
        let idx = this.options.indexOf(name)
        if(idx>=0){
            let d = this.status[this.current].dialogue
            let i = this.status[this.current].index
            let dialogue = this.script[this.current][d][i]
            this.updateCanvas(dialogue)
            let canvas = this.materials[idx+1].map.image
            let ctx = canvas.getContext('2d')
            ctx.fillStyle = "#000"
            ctx.fillRect(0,0,canvas.width,canvas.height)
            ctx.fillStyle = "#ff0"
            ctx.fillText("> "+dialogue.options[idx].text, 15,7)
            this.materials[idx+1].map.needsUpdate = true
        }
    }

    say(name){
        this.reset(name)
        // if name belongs to one of the script objects
        if(this.script.hasOwnProperty(name)){
            // null out spot if this is a new character from last dialogue
            if(this.current!==name) this.spot = null
            // update current object
            this.current = name
        }
        // if script object or option block ...
        if( this.options.includes(name) || this.script.hasOwnProperty(name)){
            let d = this.status[this.current].dialogue // dialogue objects array name
            let i = this.status[this.current].index // dialogue object index (in array)
            let o = this.script[this.current][d][i] // dialogue object

            if( this.script.hasOwnProperty(name) ){
                // draw new text to canvas
                this.updateCanvas(o)
                // add box to scene
                this.scene.add( this.box )
                for (let i = 0; i < o.options.length; i++) {
                    this.box.add( this.optMeshes[i] )
                    this.box.position.y = -100000 // hide it
                }
                // fire 'before' action
                if( typeof o.before == "function"){
                    o.before(this.current,()=>{
                        this.placeDialogueBox()
                    })
                } else {
                    this.placeDialogueBox()
                }

            } else if( this.options.includes(name) ){
                // fire appropriate action
                let dlgz = Object.keys( this.script[this.current] )
                let idx = this.options.indexOf(name)
                let opt = o.options[idx]
                if( opt.goto=="next"){
                    this.status[this.current].index++
                    this.say(this.current)

                } else if( opt.goto=="end"){
                    this.status[this.current].dialogue = 'start'
                    this.status[this.current].index = 0
                    this.spot = null

                } else if( dlgz.includes(opt.goto) ) {
                    this.status[this.current].dialogue = opt.goto
                    this.status[this.current].index = 0
                    this.say(this.current)

                } else {
                    throw new Error(`DialogueVR: ${opt.goto} is not a `+
                    `dialogue in ${this.current}'s script`)
                }
                // fire 'after' action
                if( typeof o.after == "function") o.after(this.current,name)
                if( opt.goto=="end") this.current = null
            }

        } else {
            console.log('tried to fire .say() on object absent from script')
        }
    }

}
