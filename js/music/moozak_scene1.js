class Moozak_scene1 {
    constructor(){
        this.actx = new (window.AudioContext || window.webkitAudioContext)()
        this.interacting = false
        this.tempo = 70

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

        // create instruments ------------------
        this.createBass()
        this.createSynths()
        // algorithmic composition -------------
        this.createMusic()
        // iOS workaround ----------------------
        StartAudioContext(this.actx, document.body)
    }

    get playing(){ return this.seq.isPlaying }
    set playing(v){ console.warn('nope, "playing" is read only') }

    createSynths(){
        this.leftSynths = []
        this.rightSynths = []
        this.midSynths = []
        this.filters = []

        // create oscillators
        let amount = 4
        for (let i = 0; i < amount; i++) {
            this.leftSynths.push({
                osc:this.actx.createOscillator(),
                lvl:this.actx.createGain()
            })
            this.rightSynths.push({
                osc:this.actx.createOscillator(),
                lvl:this.actx.createGain()
            })
            this.midSynths.push({
                osc:this.actx.createOscillator(),
                lvl:this.actx.createGain()
            })
        }

        // create effects
        for (let i = 0; i < 3; i++) {
            const rev = this.actx.createConvolver()
            rev.buffer = this.algoReverb(2,1)
            const bqf = this.actx.createBiquadFilter()
            bqf.type = 'lowshelf'
            bqf.frequency.value = 495
            bqf.gain.value = -10
            if(i<2){
                const pan = this.actx.createChannelMerger()
                bqf.connect( rev )
                if(i==0) rev.connect( pan, 0, 0 ) // 0 = left
                else rev.connect( pan, 0, 1 ) // 1 = right
                pan.connect( this.mstr )
            } else { // 2 = mid
                bqf.connect( rev )
                rev.connect( this.mstr )
            }
            this.filters.push( bqf )
        }

        // connect everything
        this.leftOut = this.actx.createGain()
        this.leftOut.gain.value = 0
        this.leftOut.connect( this.filters[0] )

        this.rightOut = this.actx.createGain()
        this.rightOut.gain.value = 0
        this.rightOut.connect( this.filters[1] )

        this.midOut = this.actx.createGain()
        this.midOut.gain.value = 0
        this.midOut.connect( this.filters[2] )

        for (let n = 0; n < amount; n++) {
            this.leftSynths[n].lvl.gain.value = 1/amount
            this.leftSynths[n].lvl.connect( this.leftOut )
            this.leftSynths[n].osc.connect( this.leftSynths[n].lvl )
            this.leftSynths[n].osc.start()

            this.rightSynths[n].lvl.gain.value = 1/amount
            this.rightSynths[n].lvl.connect( this.rightOut )
            this.rightSynths[n].osc.connect( this.rightSynths[n].lvl )
            this.rightSynths[n].osc.start()

            this.midSynths[n].lvl.gain.value = 1/amount
            this.midSynths[n].lvl.connect( this.midOut )
            this.midSynths[n].osc.connect( this.midSynths[n].lvl )
            this.midSynths[n].osc.start()
        }

    }

    createBass(){
        this.bassOut = this.actx.createGain()
        this.bassOut.gain.value = 0

        const rev = this.actx.createConvolver()
        rev.buffer = this.algoReverb( 5, 3 )

        const bqf = this.actx.createBiquadFilter()
        bqf.type = 'lowpass'
        bqf.frequency.value = 1000

        this.bass = this.actx.createOscillator()
        this.bass.type = 'square'
        this.bass.start()

        this.bass.connect( bqf )
        bqf.connect( rev )
        rev.connect( this.bassOut )
        this.bassOut.connect( this.mstr )
    }

    algoReverb( seconds, decay, reverse ){
        let rate = this.actx.sampleRate
        let length = rate * seconds
        let impulse = this.actx.createBuffer(2, length, rate)
        let impulseL = impulse.getChannelData(0)
        let impulseR = impulse.getChannelData(1)
        let n, i
        for (i = 0; i < length; i++) {
            n = (reverse) ? length-i : i
            impulseL[i] = (Math.random()*2 - 1) * Math.pow( 1 - n/length, decay)
            impulseR[i] = (Math.random()*2 - 1) * Math.pow( 1 - n/length, decay)
        }
        return impulse
    }

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

    playSynth(whichSynth, freqArr, dur, time){
        let synth = (whichSynth=='left') ? this.leftSynths :
            (whichSynth=='right') ? this.rightSynths : this.midSynths
        let output = (whichSynth=='left') ? this.leftOut :
            (whichSynth=='right') ? this.rightOut : this.midOut
        // set new frequencies
        for (let n = 0; n < synth.length; n++) {
            let freq = freqArr[n]
            synth[n].osc.frequency.value = freq
        }
        // trigger adsr envelope
        adsr({
            param:output.gain,
            startTime:time, value:[0.5,0.25],
            a:dur*0.06, d:dur*0.7, s:dur*0.04, r:dur*0.2
        })
    }

    playMidSynth( m, hf2, dur, time){
        let c // pick chord based on measure
        if(m%2==0) c = hf2[3].getFreqChord()
        else c = hf2[0].getFreqChord()
        // 50% chance to trigger each of the 4 mid synths
        let play = this.chanceArr(0.5)
        let total = play.filter(b=>b).length
        this.midSynths.forEach((synth,i)=>{
            synth.osc.frequency.value = c[i] // update frequency
            if( play[i] ) synth.lvl.gain.value = 1/total // set gain
            else synth.lvl.gain.value = 0 // silence
        })
        // trigger adsr envelope
        adsr({
            param:this.midOut.gain,
            startTime:time, value:[1,0.75],
            a:dur*0.2, d:dur*0.1, s:dur*0.4, r:dur*0.2
        })
    }

    playPannedSynth( b, c, dur, time, root ){
        // pick left/right based on even/odd beat number
        let synths = (b%4==0) ? this.leftSynths : this.rightSynths
        let output = (b%4==0) ? this.leftOut : this.rightOut
        // 50% chance each of 4 notes is played
        let play = this.chanceArr(0.5)
        if(root) play[0] = true // always play root note
        let total = play.filter(b=>b).length
        synths.forEach((synth,i)=>{
            synth.osc.frequency.value = c[i] // update frequency
            if( play[i] ) synth.lvl.gain.value = 1/total // set gain
            else synth.lvl.gain.value = 0 // silence
        })
        // trigger adsr envelope
        adsr({
            param:output.gain,
            startTime:time, value:[2.5,2],
            a:dur*0.06, d:dur*0.7, s:dur*0.04, r:dur*0.2
        })
    }

    playBass( note, dur, time ){
        this.bass.frequency.value = note
        adsr({
            param:this.bassOut.gain,
            startTime:time, value:[0.05,0.025],
            a:dur*0.3, d:dur*0, s:dur*0, r:dur*0.7
        })
    }

    createMusic(){
        let self = this
        let hf = this.createHarmonicField('G3','melodic-minor')
        let hf2 = this.createHarmonicField('G4','melodic-minor')
        let bn = new Melody('G2','melodic-minor').getFreqMode(null,true)
        let n = 0 // bass note index
        let m = 0 // measure
        let b = 0 // beat

        this.seq = new Sequencer( this.actx, {
            tempo: this.tempo,
            eighth:function(time){
                let t = (60/this.tempo)/2 // # of seconds between quarter notes

                // bass .......
                let bassNotes = [3,0,3,0,1,0,5,4,1,6,3,7]
                if(b==0){
                    let note = bn[ bassNotes[n] ]
                    let dur = t * 8
                    self.playBass( note, dur, time )
                    n++; if(n>=bassNotes.length) n = 0
                }

                // synths .....
                let c // pick chord, 1st or 4th degree
                if(m%2==0) c = hf[3].getFreqChord()
                else c = hf[0].getFreqChord()

                // play chords
                if(b==0){// first beat of measure
                    self.playPannedSynth( b, c, t, time, true )
                } else if(b%2==0){
                    // even number beats
                    self.playPannedSynth( b, c, t, time )
                    // if interacting && 25% chance
                    if(Math.random()>0.75 && self.interacting){
                        self.playMidSynth( m, hf2, t, time)
                    }
                } else if(Math.random()>0.5 && self.interacting){
                    // odd number beats &&...
                    // ...if interacting && 50% chance
                    self.playMidSynth( m, hf2, t, time)
                }

                b = (++b%8); if(!b) m++ // inc measure && beat
            }
        })
    }

    toggle(){ this.seq.toggle() }
    update(){ if(this.seq.isPlaying) this.seq.update() }
}
