function planeLoop(){
    if(looping){
        return cart.moveTo(0.5, 8000, TWEEN.Easing.Cubic.Out)
        .then(()=>plane.animTurnAround())
        .then(()=>plane.animHopOff())
        .then(()=>line.removeFront())
        .then((type)=>plane.animReadyToBoard(type))
        .then(()=>plane.animBow())
        .then(()=>plane.animBoard())
        .then(()=>line.moveUpLine())
        .then(()=>cart.moveTo(1.0, 8000, TWEEN.Easing.Cubic.In))
        .then(()=>cart.startFrom(0.0))
        .then(()=>planeLoop())
        .catch(err => console.error(err))
    } else {
        return cart.moveTo(0.5, 8000, TWEEN.Easing.Cubic.Out)
        .then(()=>plane.animTurnAround())
        .then(()=>plane.animHopOff())
        .then(()=>{ plane.mesh.remove(plane.pilot) })
        .catch(err => console.error(err))
    }
}

// -----------------------------------------------------------------------------
// ------------------------------------------------------------- packets in line
// -----------------------------------------------------------------------------

class LinePackets {
    constructor(total,scene,plane){
        this.plane = plane
        this.scene = scene
        this.line = []
        this.moving = false
        for (let i = 0; i < total; i++) this._spawn(i)
    }

    _spawn(num){
        let types = ['dns','http','bc','ftp','imap','ssh','bt', 'irc']
        let i = num + 2 // +2 b/c packet 0-3 are starring at user
        let front = new THREE.Vector3(2.75,0.48,2) // front of the line
        let packet = new Packet({
            name:`packet${i}`,
            bounce:true,
            lights:true,
            type:types[Math.floor(Math.random()*types.length)]
        },(mesh)=>{
            mesh.scale.x = mesh.scale.y = mesh.scale.z = 0
            this.scene.add(mesh)
            let p = front.clone()
            p.z = p.z - (num*0.8)
            mesh.position.set(p.x,p.y,p.z)
            new TWEEN.Tween(mesh.scale).to({x:1,y:1,z:1}, 250)
            .easing(TWEEN.Easing.Quadratic.InOut).start()
        })

        packet.looking_ahead = false
        packet.looking_up = false
        packet.turning_up = false
        this.line.push(packet)
    }

    _after(times,func){
        return function() {
            if (--times < 1) return func.apply(this, arguments)
        }
    }

    _lookUp(packet,vec){
        packet.turning_up = true
        packet.mesh.lookAt(vec)
        let spot = {
            x:packet.mesh.rotation.x,
            y:packet.mesh.rotation.y,
            z:packet.mesh.rotation.z
        }
        packet.mesh.lookAt({x:0,y:0,z:0})
        new TWEEN.Tween(packet.mesh.rotation).to(spot, 250)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(()=>{
            packet.looking_up = true
            packet.looking_ahead = false
        }).start()
    }

    _lookAhead(packet){
        new TWEEN.Tween(packet.mesh.rotation)
        .to({x:0,y:0,z:0}, 250)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(()=>{
            packet.looking_ahead = true
            packet.looking_up = false
            packet.turning_up = false
        }).start()
    }

    _moveUp(packet,callback){
        let z = packet.mesh.position.z + 0.8
        new TWEEN.Tween(packet.mesh.position).to({z:z}, 500)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(()=>{ callback() }).start()
    }

    moveUpLine(){
        return new Promise((resolve,reject)=>{
            let done = this._after(this.line.length,()=>{ resolve() })
            this.line.forEach((p,i)=>{ this._moveUp(p,done) })
            // create new packet
            this._spawn(this.line.length)
        })
    }

    removeFront(){
        return new Promise((resolve,reject)=>{
            let t = this.line[0].type
            this.scene.remove(this.line[0].mesh)
            this.line.shift()
            resolve(t)
        })
    }

    update(vec){
        if( !this.moving && vec.x==3 && vec.y==0.58 && vec.z==5 ){
            // this.moving = true
            // this.move()
        } else if(vec.x < 91 && vec.x > -91){
            this.line.forEach((p,i)=>{
                if(!p.looking_up && !p.turning_up) this._lookUp(p,vec)
                else if(p.looking_up ) p.mesh.lookAt(vec)
            })
        } else {
            this.line.forEach(p=>{
                if(!p.looking_ahead) this._lookAhead(p)
            })
        }
    }
}

// -----------------------------------------------------------------------------
// ------------------------------------------------------- circuit + environment
// -----------------------------------------------------------------------------

class Spark {
    constructor(x,y,z,light,intensity,color){
        let i = intensity || 0.1
        let c = color || '#ff0'
        let g = new THREE.SphereBufferGeometry( 0.1, 4, 4 )
        let m = new THREE.MeshBasicMaterial({color:c})
        this.mesh = new THREE.Mesh( g, m )
        this.mesh.position.set(x,y,z)
        if(light){
            this.light = new THREE.PointLight('#fff', i, i*1000 )
            this.mesh.add(this.light)
        }
        this.spd = new THREE.Vector3(
            Math.random()+0.75,Math.random()+0.75,Math.random()+0.75
        )
        this.off = new THREE.Vector3(x,y,z)
        this.sz = new THREE.Vector3(
            Math.random()*3,Math.random()*3,Math.random()*3
        )
    }
    update(tick){
        let x = Math.sin(tick*this.spd.x) * this.sz.x + this.off.x
        let y = Math.cos(tick*this.spd.y) * this.sz.y + this.off.y
        let z = Math.sin(tick*this.spd.z) * this.sz.z + this.off.z
        this.mesh.rotation.set(
            Math.sin(tick), Math.cos(tick), Math.sin(tick)
        )
        this.mesh.position.set(x,y,z)
    }
}

function createSparks(sparks){
    let container = new THREE.Object3D()
    // non-spotlight sparks
    for (let i = 0; i < 50; i++) {
        let x = Math.random()*20-10
        let y = Math.random()*20
        let z = Math.random()*10-1
        let spark = new Spark(x,y,z,false)
        sparks.push(spark)
        container.add(spark.mesh)
    }
    // spotlight sparks
    let sls = [[0,7,-5],[-2,5,-5],[2,5,-5]]
    for (let i = 0; i < sls.length; i++) {
        let p = sls[i], int = sls[i][3] || 0.1
        let s = new Spark(p[0],p[1],p[2],int)
        sparks.push(s)
        container.add(s.mesh)
    }
    return container
}

function createCircuitFloor(){
    let floorGeo = new THREE.PlaneBufferGeometry(10,10,2)
    let tx = new THREE.TextureLoader().load('../images/cir_wb.png')
    let floorMat = new THREE.MeshPhongMaterial({
        side:2,shininess:500,specular:0xffffff,
        map:tx, alphaMap:tx, alphaTest: 0.9
    })
    tx.magFilter = THREE.LinearFilter
    tx.minFilter = THREE.LinearFilter
    let floor = new THREE.Mesh(floorGeo,floorMat)
    floor.rotation.x = Math.PI/2
    return floor
}

function createPole(){
    let g1 = new THREE.CylinderBufferGeometry( 0.03, 0.03, 2, 32 )
    let m1 = new THREE.MeshLambertMaterial({color:0xfdfdfd})
    let cylinder = new THREE.Mesh( g1, m1 )
    cylinder.position.set(0,1,0)
    let g2 = new THREE.SphereBufferGeometry( 0.1, 4, 4 )
    let m2 = new THREE.MeshBasicMaterial({color:0xffff00})
    let sphere = new THREE.Mesh( g2, m2 )
    sphere.position.set(0,2,0)
    let mesh = new THREE.Object3D()
    mesh.add(cylinder)
    mesh.add(sphere)
    return mesh
}

function createRunway(){
    let points = [
        new THREE.Vector3(-35,0,5),
        new THREE.Vector3(-30,0,5),
        new THREE.Vector3(-25,0,5),
        new THREE.Vector3(-20,0,5),
        new THREE.Vector3(-15,0,5),
        new THREE.Vector3(-10,0,5),
        new THREE.Vector3(-5,0,5),
        new THREE.Vector3(5,0,5),
        new THREE.Vector3(10,0,5),
        new THREE.Vector3(15,0,5),
        new THREE.Vector3(20,0,5),
        new THREE.Vector3(25,0,5),
        new THREE.Vector3(30,0,5),
        new THREE.Vector3(35,0,5)
    ]
    let runway = new THREE.Object3D()
    for (let i = 0; i < points.length; i++) {
        let p = points[i]
        let p1 = createPole()
        let p2 = createPole()
        p1.position.set(p.x,p.y,p.z-3)
        p2.position.set(p.x,p.y,p.z+3)
        runway.add(p1)
        runway.add(p2)
    }
    return runway
}


// -----------------------------------------------------------------------------
// -------------------------------------------------- the-user ( room + screen )
// -----------------------------------------------------------------------------

function loadUser(callback){
    let txBody = new THREE.TextureLoader().load('../images/user_body.png')
    let txHair = new THREE.TextureLoader().load('../images/user_hair.jpg')
    let body = new THREE.MeshLambertMaterial({side:2, map:txBody})
    let hair = new THREE.MeshLambertMaterial({side:2, map:txHair})

    THREE.DRACOLoader.setDecoderPath( '../libs/loaders/draco/' )
    let loader = new THREE.DRACOLoader()
    loader.load( `../models/drcs/user-body.drc`, (geometry)=>{
        let object = new THREE.Mesh(geometry,body)
            object.name = 'the-user'

        loader.load( `../models/drcs/user-hair.drc`, (geohair)=>{
            object.add( new THREE.Mesh(geohair,hair) )
            if(callback) callback( object )
        },null,(err)=>{ console.log(err)})

    },null,(err)=>{ console.log(err)})
}

function createUserRoom(bgClr){
    THREE.DRACOLoader.setDecoderPath( '../libs/loaders/draco/' )
    let loader = new THREE.DRACOLoader()
    let room = new THREE.Object3D()
    let geo = new THREE.PlaneBufferGeometry(60,50,2)
    let mat = new THREE.MeshLambertMaterial({side:2})
    let mat1 = new THREE.MeshLambertMaterial({side:2,color:'#ccc'})
    let mat2 = new THREE.MeshLambertMaterial({side:2,color:'#aaa'})

    let wall = new THREE.Mesh(geo,mat)
    wall.position.z = -30
    room.add(wall)

    geo = new THREE.PlaneBufferGeometry(60,76.8,2)
    let ceiling = new THREE.Mesh(geo,mat)
    ceiling.position.set(0,25,8.4)
    ceiling.rotation.x = Math.PI/2
    room.add(ceiling)

    // scene blockers ------------------
    mat = new THREE.MeshBasicMaterial({side:2,color:bgClr})
    let ceilBlock = new THREE.Mesh(geo,mat)
    ceilBlock.position.set(0,26,8.4)
    ceilBlock.rotation.x = Math.PI/2
    room.add(ceilBlock)

    function makeBlockers(left){ // side blockers
        let x = left ? -29.95 : 29.95
        let g, m = new THREE.MeshBasicMaterial({
            side:2, color: bgClr//'#0ff'
        })
        g = new THREE.PlaneBufferGeometry(76.8,40,2)
        const blockerTop = new THREE.Mesh(g,m)
        blockerTop.position.set(x,45,8.4)
        blockerTop.rotation.y = Math.PI/2
        room.add(blockerTop)
        g = new THREE.PlaneBufferGeometry(30,50,2)
        const blockerBack = new THREE.Mesh(g,m)
        blockerBack.position.set(x,0,-45)
        blockerBack.rotation.y = Math.PI/2
        room.add(blockerBack)
    }

    makeBlockers(true)
    makeBlockers(false)

    // load scene objects ------------------

    loader.load(`../models/drcs/s1_fan.drc`, (geometry)=>{
        const obj = new THREE.Mesh(geometry,
              new THREE.MeshBasicMaterial({color:'#888'}))
        obj.name = 'fan'
        obj.position.y = 15
        obj.position.x = 5
        obj.scale.x = obj.scale.y = obj.scale.z = 0.05
        room.add(obj)
    })
    loader.load(`../models/drcs/s1_door.drc`, (geometry)=>{
        const obj = new THREE.Mesh(geometry,mat1)
        obj.name = 'door'
        obj.position.set(9,-18,-29.5)
        obj.scale.x = obj.scale.y = obj.scale.z = 0.1
        room.add(obj)
    })
    loader.load(`../models/drcs/s1_window.drc`, (geometry)=>{
        const obj = new THREE.Mesh(geometry,mat2)
        obj.name = 'window'
        obj.rotation.y = Math.PI/2
        obj.scale.x = obj.scale.z = 30
        obj.scale.y = 35
        obj.position.set(-13,3,-30)
        room.add(obj)
    })

    room.position.set(0,15,-30)
    return room
}

function createGlassFrame(bgClr){

    let b = 27.8 // side border size
    let p = {w:4.5, h:8} // pane dimensions
    let s = {w:b, h:p.h} // left/right side panel dimensions
    let o = {w:p.w+b*2, h:40} // top/bottom panel dimensions

    let glass = new THREE.Object3D()

    let g = new THREE.PlaneBufferGeometry(p.w,p.h,2)
    let m = new THREE.MeshPhongMaterial({
        side:2,shininess:500,specular:0xffffff,
        transparent:true,opacity:0
    })

    let pane = new THREE.Mesh(g,m)
    pane.castShadow = true
    pane.receiveShadow = true
    glass.add(pane)

    m = new THREE.MeshPhongMaterial({
        side:2,shininess:500,specular:0xffffff,
        transparent:true, opacity:0.5
    })
    const pane2 = new THREE.Mesh(g,m)
    pane2.position.set(0,0,-0.05)
    glass.add(pane2)


    m = new THREE.MeshBasicMaterial({
        side:2,color:bgClr
    })

    g = new THREE.PlaneBufferGeometry(s.w,s.h,2)
    let fLeft = new THREE.Mesh(g,m)
    fLeft.position.set(-(s.w/2+p.w/2),0,0)
    glass.add(fLeft)
    let fRight = new THREE.Mesh(g,m)
    fRight.position.set((s.w/2+p.w/2),0,0)
    glass.add(fRight)

    g = new THREE.PlaneBufferGeometry(o.w,o.h,2)
    let fTop = new THREE.Mesh(g,m)
    fTop.position.set(0,-(p.h/2+o.h/2),0)
    glass.add(fTop)
    let fBottom = new THREE.Mesh(g,m)
    fBottom.position.set(0,(p.h/2+o.h/2),0)
    glass.add(fBottom)

    // scene blockers

    function makeBlockers(left){
        let x = left ? -(s.w+p.w/2)+0.05 : (s.w+p.w/2)
        let outerClr = bgClr // '#f00'
        let innerClr = '#fff' //'#f0f'
        let mt = ['MeshLambertMaterial','MeshBasicMaterial']
        let m, g = new THREE.PlaneBufferGeometry(b*2.2,b*3,2)
        m = (left) ? new THREE[mt[0]]({side:2,color:innerClr}) :
                     new THREE[mt[1]]({side:2,color:outerClr})
        let blocker1 = new THREE.Mesh(g,m)
        blocker1.rotation.y = Math.PI/2
        blocker1.position.set(x,0,-b*1.1)
        glass.add(blocker1)
        m = (left) ? new THREE[mt[1]]({side:2,color:outerClr}) :
                     new THREE[mt[0]]({side:2,color:innerClr})
        let blocker2 = new THREE.Mesh(g,m)
        blocker2.rotation.y = Math.PI/2
        blocker2.position.set(x-0.05,0,-b*1.1)
        glass.add(blocker2)
    }

    makeBlockers(true)
    makeBlockers(false)


    // icons

    function roundedRect( ctx, x, y, width, height, radius ) {
        ctx.moveTo( x, y + radius )
        ctx.lineTo( x, y + height - radius )
        ctx.quadraticCurveTo( x, y + height, x + radius, y + height )
        ctx.lineTo( x + width - radius, y + height )
        ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius )
        ctx.lineTo( x + width, y + radius )
        ctx.quadraticCurveTo( x + width, y, x + width - radius, y )
        ctx.lineTo( x + radius, y )
        ctx.quadraticCurveTo( x, y, x, y + radius )
    }

    let icoMat = new THREE.MeshPhongMaterial({
        color:0xffffff, side:2, opacity:0.625, transparent:true,
        shininess:500,specular:0xffffff,
    })

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
            let w = 0.6
            let h = w
            let r = 0.15

            let x = -1.85 + (i*1.025)
            if(j==3 && (i==0||i==1)) r = w = h = 0

            if(j==4) j=6
            let y = 3 - (j*1.12)

            let iconShape = new THREE.Shape()
            roundedRect(iconShape, x, y, w, h, r )
            let iconGeo = new THREE.ShapeBufferGeometry( iconShape )
            let icon = new THREE.Mesh( iconGeo, icoMat)
            icon.position.set(0,0,0.01)
            glass.add(icon)
        }
    }

    glass.position.set(0,8,-7.5)
    glass.rotation.set(0.65,0,0)
    return glass
}
