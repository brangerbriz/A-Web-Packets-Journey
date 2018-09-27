/*
    Chorus
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    a simple chorus effect for the WebAudio API

    -----------
       usage
    -----------

    // assuming 'actx' is an instanceof AudioContext
    const ch  = new Chorus( actx,{
        delayTime: 0.3, // optional config object
        depth: 0.002,
        speed: 3.5,
        amount: 0.5
    })

    // assuming 'src' is some WebAudio source node
    src.connect( ch.input )
    ch.connect( actx.destination )

*/
class Chorus {
    constructor( audioContext, config ){
        this.ctx = audioContext
        this.input = new GainNode(this.ctx)
        this.output = new GainNode(this.ctx)

        let params = (config) ? config : {}
        this._delayTime = params.delayTime || 0.03
        this._depth = params.depth || 0.002 // cgain's gain
        this._speed = params.speed || 3.5 // osc's frequency
        this._amount = params.amount || 0.5

        // fx nodes
        this.dry = new GainNode(this.ctx, {gain:1-this._amount})
        this.wet = new GainNode(this.ctx, {gain:this._amount})
        this.delay = new DelayNode(this.ctx,
            {maxDelayTime:2, delayTime:this._delayTime})
        this.cgain = new GainNode(this.ctx, {gain:this._depth})
        this.osc = new OscillatorNode(this.ctx, {frequency:this._speed})
        this.osc.start(0)

        // routing
        /*
            input ---------→ dry ---→ output
             \                ∝        ↑
              `--→ delay --→ wet ------'
                    ↑[time]
                  cgain
                    ↑
                   osc
        */
        this.input.connect(this.dry)
        this.input.connect(this.delay)
        this.delay.connect(this.wet)
        this.cgain.connect(this.delay.delayTime)
        this.osc.connect(this.cgain)
        this.dry.connect(this.output)
        this.wet.connect(this.output)
    }

    connect(){ this.output.connect(...arguments) }
    disconnect(){ this.output.disconnect(...arguments) }

    get speed(){ return this._speed }
    set speed(v){
        if(this.osc)
            this.osc.frequency.setValueAtTime(v,this.ctx.currentTime)
        this._speed = v
    }

    get delayTime(){ return this._delayTime }
    set delayTime(v){
        if(this.delay)
            this.delay.delayTime.setValueAtTime(v,this.ctx.currentTime)
        this._delayTime = v
    }

    get depth(){ return this._depth }
    set depth(v){
        if(this.cgain)
            this.cgain.gain.setValueAtTime(v,this.ctx.currentTime)
        this._depth = v
    }

    get amount(){ return this._amount }
    set amount(v){
        if(this.wet && this.dry){
            this.wet.gain.setValueAtTime(v,this.ctx.currentTime)
            this.dry.gain.setValueAtTime(1-v,this.ctx.currentTime)
        }
        this._amount = v
    }
}
