
Math.norm = function(value, min, max) {
    return (value - min) / (max - min)
}

Math.lerp = function(norm, min, max) {
    return (max - min) * norm + min
}

Math.clamp = function(value, min, max) {
    return Math.max(min, Math.min(max, value))
}

Math.map = function(value, sourceMin, sourceMax, destMin, destMax) {
    return this.lerp(this.norm(value, sourceMin, sourceMax), destMin, destMax)
}


function timeout(millis) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, millis)
    })
}

function after(times,func){
    return function() {
        if (--times < 1) return func.apply(this, arguments)
    }
}

class Loader {
    constructor(amount,onclick,onload){
        this.createCover()

        this.tally = 0
        this.total = amount + 1 // +1 for readyState call
        this._loaded = this.after(this.total,()=>{
            this.cover.removeChild(this.loadStatus)
            this.cover.appendChild(this.clickStart)
            // if we got to this level from previous level
            if(location.search.includes('lvlprog=true'))
                this.cover.style.display = "none"
            // run callbacks
            if(onload) onload()
            this.clickStart.addEventListener('click',()=>{
                if(onclick) onclick()
                this.cover.style.display = "none"
            })
        })

        let readyYet = setInterval(()=>{
            if(document.readyState === 'complete') {
                clearInterval(readyYet)
                this.loaded()
            }
        }, 100)
    }
    loaded(){
        this.tally++
        let val = Math.round((this.tally/this.total)*100)
        this.loadStatus.textContent = `Loading ${val}%`
        this._loaded()
    }
    after(times,func){
        return function() {
            if (--times < 1) return func.apply(this, arguments)
        }
    }
    createCover(){
        let css = {
            'box-sizing':'border-box',
            // 'font-family':'sans-serif',
            // 'font-size':'48px',
            'background':'#000',
            'color':'#fff',
            'text-align':'center',
            'width':'100%',
            'height':'100%',
            'position':'fixed',
            'top':'0px;',
            'left':'0px',
            'z-index':'1000',
            'display':'flex',
            'flex-direction':'column',
            'justify-content': 'space-around',
            'align-items': 'center'
        }
        this.cover = document.createElement('div')
        for(let prop in css) this.cover.style[prop] = css[prop]

        this.clickStart = document.createElement('div')
        this.clickStart.textContent = 'Click to Start'
        this.clickStart.style.cursor = "pointer"

        this.loadStatus = document.createElement('div')
        this.loadStatus.textContent = 'Loaded 0%'
        this.loadStatus.onclick = null
        this.loadStatus.style.cursor = "auto"

        this.cover.appendChild(this.loadStatus)
        document.body.appendChild(this.cover)
    }
}
