class Pxl {
    constructor(context) {
        this.c = context
        this.x = 0
        this.y = 0
        this.s = 10
    }
    update(x, y, s) {
        if (x) this.x = x
        if (y) this.y = y
        if (s) this.s = s
    }
    draw(o) {
        this.c.save()
        this.c.translate(this.x,this.y-this.s/2)
        this.c.rotate(Math.PI/4)
        this.c.fillStyle = `rgba(255,255,255,${o})`
        this.c.fillRect(0,0, this.s, this.s)
        this.c.restore()
    }
}

class PxlGrp {
    constructor(x,y, amount, size, ctx) {
        this.size = size // radius size
        this.pxls = []
        this.speed = Math.random()*2 + 0.5
        if(Math.random()<0.5) this.speed = -this.speed
        this.r = Math.random()*this.size
        this.ri = Math.random()*0.3
        this.tickOffset = Math.random()*10
        this.x = x
        this.y = y
        for (let i = 0; i < amount; i++) {
            this.pxls.push(new Pxl(ctx))
        }
    }
    update(tick) {
        tick = tick + this.tickOffset
        this.pxls.forEach((p, idx, arr) => {
            let i = tick - (idx * ((Math.PI * 2) / arr.length))
            let x = Math.sin(i * this.speed) * this.r
            let y = Math.cos(i * this.speed) * this.r
            let s = Math.map(x + y, -this.r*2, this.r*2, -this.size, this.size)
            s = Math.abs(s)
            p.update(x + this.x, y + this.y, s)
            let o = Math.map(s, -this.size, this.size, -1, 1)
            o = Math.abs(o)
            p.draw(o)
        })
        this.r += this.ri
        if(this.r > this.size*2 || this.r < -this.size*2) this.ri = -this.ri
    }
}

class PxlClouds {
    constructor(parent){
        this.parent = document.querySelector(parent)
        this.canvas = document.createElement('canvas')
        this.canvas.width = this.parent.offsetWidth
        this.canvas.height = this.parent.offsetHeight
        this.canvas.style.position = "absolute"
        let top = this.parent.offsetTop
        this.canvas.style.top = `${top}px`
        this.parent.appendChild(this.canvas)
        this.ctx = this.canvas.getContext('2d')

        this.tick = 0
        this.pxls = []

        let s = 50
        let x = Math.random()*innerWidth/4 + s
        let y = s*4
        this.setupCoud(s,x,y)

        s = 50
        s += Math.random()*20-10
        x = innerWidth*0.75
        y = Math.random()*this.parent.offsetHeight/4 + this.parent.offsetHeight/4
        this.setupCoud(s,x,y)

        s = 50
        s += Math.random()*20-10
        x = Math.random()*innerWidth/4 + s
        y = Math.random()*this.parent.offsetHeight/8 + this.parent.offsetHeight/2
        this.setupCoud(s,x,y)

        s = 50
        s += Math.random()*20-10
        x = innerWidth*0.75
        y = Math.random()*this.parent.offsetHeight/4 + this.parent.offsetHeight/2
        this.setupCoud(s,x,y)

        this.planesReady
        this.pCall = 0
        this.pIdx = 0
        this.planes = []
        this.px = this.canvas.width,
        this.py = Math.random()*this.canvas.height
        let planePaths = [
            'images/p-sprite-1.png', 'images/p-sprite-2.png',
            'images/p-sprite-3.png', 'images/p-sprite-4.png',
            'images/p-sprite-5.png'
        ]
        planePaths.forEach(path=>{
            let img = new Image()
            img.onload = ()=>{
                this.planes.push(img)
                if(this.planes.length == planePaths.length){
                    this.planesReady = true
                }
            }
            img.src = path
        })

    }
    setupCoud(s,x,y){
        let amt = Math.random()*15+5
        for(let i=0; i<amt; i++){
            let a = Math.floor(Math.random()*5) + 5
            let gx = x + (Math.random()*20-10)
            let gy = y + (Math.random()*20-10)
            this.pxls.push(  new PxlGrp(gx,gy,a,s,this.ctx) )
        }
    }
    drawPlane(){
        this.pCall++
        if(this.pCall>=5){
            this.pCall = 0
            this.pIdx++
            if(this.pIdx>=this.planes.length) this.pIdx = 0
        }

        let p = this.planes[ this.pIdx ]
        this.px-=3
        if(this.px < -267){
            this.px = this.canvas.width
            this.py = Math.random()*this.canvas.height
        }

        this.ctx.drawImage( p, this.px, this.py )
    }
    resize(){
        let top = this.parent.offsetTop
        this.canvas.style.top = `${top}px`
        this.canvas.width = this.parent.offsetWidth
        this.canvas.height = this.parent.offsetHeight
    }
    update(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        if(this.planesReady) this.drawPlane()
        this.pxls.forEach(pg=>pg.update(this.tick))
        this.tick += 1 / 60
    }
}

class PxlFade {
    constructor(parent,dir){
        this.parent = document.querySelector(parent)
        this.canvas = document.createElement('canvas')
        this.parent.appendChild(this.canvas)
        this.ctx = this.canvas.getContext('2d')
        this.dir = dir
        this.draw()
    }
    drawPxl(x,y,s){
        this.ctx.save()
        this.ctx.fillStyle = '#34C8F2'
        this.ctx.translate(x,y-s/2)
        this.ctx.rotate(Math.PI/4)
        this.ctx.fillRect(0,0,s,s)
        this.ctx.restore()
    }
    draw(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.canvas.width = this.parent.offsetWidth
        this.canvas.height = this.parent.offsetHeight
        let rows = 4
        let height = this.canvas.height/rows
        if(this.dir=="up"){
            for (let r = 0; r < rows+1; r++) {
                let siz = (r*5) + 10
                let top = r * height
                let amt = (r+1) * 100
                for (let i = 0; i < amt; i++) {
                    let x = Math.random()*this.canvas.width
                    let y = Math.random()*height + top
                    if(r==0) y += 10
                    this.drawPxl(x,y,siz)
                }
            }
        } else if(this.dir=="down"){
            let y = -2
            for (let r = rows; r >= 0; r--) {
                let siz = (r*5) + 10
                let top = y * height
                let amt = (r+1) * 100
                for (let i = 0; i < amt; i++) {
                    let x = Math.random()*this.canvas.width
                    let y = Math.random()*height + top
                    if(r==0) y -= 10
                    this.drawPxl(x,y,siz)
                }
                y++
            }
        }
    }
}
