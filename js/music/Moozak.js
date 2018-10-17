/*

    Moozak
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    this class is a base class for the individual music classes for each level.
    it's meant to be extended (not used on it's own) and assumes the extended
    class has a 'seq' property (which is an instance of Sequencer.js)

    requires the following dependencies from /libs:
    - StartAudioContext.js
    - Sequencer.js (required by sub-class)
    - Note.js
    - Melody.js
    - Chord.js

    -----------
       usage
    -----------

    // typically being used like this

    class Moozak_scene extends Moozak {
        constructor(){
            super()
            this.createInstrument()
            this.createMusic()
        }
        createInstrument(){
            // create some web audio nodes
        }
        playInstrument(note,time,duration){
            // play web audio notes
        }
        createMusic(){
            let self = this
            let m = 0 // measure
            let b = 0 // beat
            this.seq = new Sequencer( this.actx, {
                tempo: 180,
                eighth:function(time){
                    let t = (60/this.tempo)/2 // # of seconds between quarter notes

                    if(b==0) self.playInstrument('C#',time,t)

                    b = (++b%8); if(!b) m++ // inc measure && beat
                }
            })
        }
    }

    // ....

    const moozak = new Moozak_scene()
    moozak.toggle() // starts the sequencer
*/
class Moozak {
    constructor(){
        this.actx = new (window.AudioContext || window.webkitAudioContext)()

        this.mstr = this.actx.createDynamicsCompressor()
        this.mstr.threshold.value = -50
        this.mstr.knee.value = 40
        this.mstr.ratio.value = 12
        this.mstr.attack.value = 0
        this.mstr.release.value = 0.25
        this.mstr.connect( this.actx.destination )

        // set up event listeners to silence when not in focus
        window.addEventListener('focus',()=>{
            this.mstr.connect( this.actx.destination )
        })
        window.addEventListener('blur',()=>{
            this.mstr.disconnect()
        })

        // iOS workaround ----------------------
        StartAudioContext(this.actx, document.body)
    }

    get playing(){ return this.seq.isPlaying }
    set playing(v){ console.warn('nope, "playing" is read only') }

    get tempo(){ if(this.seq) return this.seq.tempo }
    set tempo(v){ if(this.seq) this.seq.tempo = v }

    createHarmonicField(root,mode,includeOctave){
        // create scale
        let scale = new Melody(root,mode).getNoteMode(null,includeOctave)
        // chord pattern for harmonic field
        let chs = ['maj7','min7','min7','maj7','7','min7','min7']
        if(includeOctave) chs.push('maj7')
        // depending on mode, scale might be shorter/longer than 7,8
        let arr = (chs.length>scale.length) ? scale : chs
        // create harmonic field (table of chords per degree in scale)
        let table = []
        for (let n = 0; n < arr.length; n++) {
            table.push( new Chord(scale[n],chs[n]) )
        }
        return table
    }

    chanceArr(percentage,length){
        let arr = []
        let l = length || 4
        for (let i = 0; i < l; i++) arr.push( Math.random() < percentage )
        return arr
    }

    after(times,func){
        return function() {
            if (--times < 1) return func.apply(this, arguments)
        }
    }

    // expecing this.seq to be an instanceof Sequencer.js

    toggle(){ if(this.seq) this.seq.toggle() }
    update(){ if(this.seq && this.seq.isPlaying) this.seq.update() }
}
