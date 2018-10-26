class Moozak_scene2 extends Moozak {
    constructor(){
        super()

        this.createPianoSample()
        this.createStrumSamples()
        this.createPanoBass()
        this.createVibeBass()
        this.createLeadOsc()

        this.createMusic()
    }

    createVibeBass(buffer){
        let rev = this.actx.createConvolver()
        rev.buffer = AudioUtils.impulseBuffer( this.actx, 3, 2 )
        rev.connect( this.mstr )

        let dist = this.actx.createWaveShaper()
        dist.curve = AudioUtils.distortionCurve(5)
        dist.connect( rev)

        const pan = this.actx.createChannelMerger()
        pan.connect( dist )

        const bassL = this.actx.createGain()
        bassL.connect( pan, 0, 0 )

        const bassR = this.actx.createGain()
        bassR.connect( pan, 0, 1 )
        bassR.gain.value = 0

        const trem = this.actx.createOscillator()
        trem.frequency.value = 2
        trem.connect( bassL.gain )
        trem.connect( bassR.gain )
        trem.start()

        let gn = this.actx.createGain()
        gn.gain.value = 0
        gn.connect( bassL )
        gn.connect( bassR )
        let osc = this.actx.createOscillator()
        osc.type = 'square'
        osc.connect( gn )
        osc.start()

        this.vibeBass = { osc:osc, gain:gn }
    }

    playVibeBass(note,time,dur){
        this.vibeBass.osc.frequency.value = (typeof note=="number") ?
            note : new Note(note).freq
        AudioUtils.adsr({
            param:this.vibeBass.gain.gain,
            startTime:time, value:0.15,
            a:dur*0.2, d:dur*0.1, s:dur*0.5, r:dur*0.2
        })
    }

    createPanoBass(){
        let dist = this.actx.createWaveShaper()
        dist.curve = AudioUtils.distortionCurve(5)
        dist.connect( this.mstr )

        const pan = this.actx.createChannelMerger()
        pan.connect( dist )

        const bassL = this.actx.createGain()
        bassL.connect( pan, 0, 0 )
        bassL.gain.value = 0

        const bassR = this.actx.createGain()
        bassR.connect( pan, 0, 1 )
        bassR.gain.value = 0

        let osc1 = this.actx.createOscillator()
        osc1.type = 'square'
        osc1.connect( bassL )
        osc1.start()

        let osc2 = this.actx.createOscillator()
        osc2.type = 'square'
        osc2.connect( bassR )
        osc2.start()

        this.panoBass = [
            { osc:osc1, gain:bassL },
            { osc:osc2, gain:bassR },
        ]
    }

    playPanoBass(note,time,dur,side){
        this.panoBass[side].osc.frequency.value = (typeof note=="number") ?
            note : new Note(note).freq
        AudioUtils.adsr({
            param:this.panoBass[side].gain.gain,
            startTime:time, value:0.25,
            a:dur*0.2, d:dur*0.1, s:dur*0.5, r:dur*0.2
        })
    }

    createLeadOsc(){
        let gn = this.actx.createGain()
        gn.gain.value = 0
        gn.connect( this.mstr )

        let osc = this.actx.createOscillator()
        osc.type = 'square'
        osc.connect( gn )
        osc.start()

        this.leadOsc = { osc:osc, gain:gn }
    }

    playLeadOsc(note,time,dur){
        this.leadOsc.osc.frequency.value = (typeof note=="number") ?
            note : new Note(note).freq
        time = time || this.actx.currentTime
        dur = dur || 0.25
        AudioUtils.adsr({
            param:this.leadOsc.gain.gain,
            startTime:time, value:0.1,
            a:dur*0.02, r:dur*0.8
        })
    }

    createPianoSample(){
        this.pianoBuffer

        this.pRevB = this.actx.createConvolver()
        this.pRevB.buffer = AudioUtils.impulseBuffer( this.actx, 2, 1, true )
        this.pRevB.connect( this.mstr )

        this.pRevF = this.actx.createConvolver()
        this.pRevF.buffer = AudioUtils.impulseBuffer( this.actx, 1, 2 )
        this.pRevF.connect( this.mstr )

        AudioUtils.loadBuffer({
            audioContext: this.actx,
            file:'../samples/piano-riff.mp3'
        },(buffer)=>{
            this.pianoBuffer = buffer
        })
    }

    playPianoSample(time,off,dur,quick){
        let gn = this.actx.createGain()
        gn.connect( this.mstr)
        let gn1 = this.actx.createGain()
        gn1.connect( this.pRevF )
        let gn2 = this.actx.createGain()
        gn2.connect( this.pRevB )
        gn2.gain.value = 0.2

        let src = this.actx.createBufferSource()
        src.buffer = this.pianoBuffer
        if(quick){
            gn.gain.value = quick
            src.connect(gn)
            src.start(time,off,0.1)
        } else {
            src.connect(gn1)
            src.connect(gn2)
            src.start(time,off,dur)
        }
    }

    createStrumSamples(){
        const pan = this.actx.createChannelMerger()
        pan.connect( this.mstr )

        this.strumL = this.actx.createGain()
        this.strumL.connect( pan, 0, 0 )

        this.strumR = this.actx.createGain()
        this.strumR.connect( pan, 0, 1 )

        this.mutedStrumBuffers = []
        this.mutedStrumPaths = [
            '../samples/strum-up.mp3',
            '../samples/strum-down.mp3'
        ]
        this.mutedStrumPaths.forEach((path,i)=>{
            AudioUtils.loadBuffer({
                audioContext: this.actx,
                file:path
            },(buffer)=>{
                this.mutedStrumBuffers[i] = buffer
            })
        })
    }

    playStrum(time,idx,side){
        let gn = this.actx.createGain()
        if(side=='left') gn.connect( this.strumL )
        else if(side=='right') gn.connect( this.strumR )
        else gn.connect( this.mstr )
        // gn.gain.value = 1.5
        let src = this.actx.createBufferSource()
        src.buffer = this.mutedStrumBuffers[idx]
        src.connect(gn)
        src.start(time)
    }

    createMusic(){
        let self = this
        this.m = 0 // measure
        let b = 0 // beat 0-12

        this.layers = 0

        let m0 = new Melody('C#3','natural-minor')
        let m1 = new Melody('C#4','natural-minor')
        let m2 = new Melody('C#5','natural-minor')

        let scale = [
            ...m0.getFreqMode(),
            ...m1.getFreqMode(),
            ...m2.getFreqMode()
        ]

        let pMap = { // piano sample offset map
            'C#4':[1.1, 0.1 ],
            'F#4':[1.5, 0.6 ],
            'G4':[0.1, 0.6 ],
            'G#4':[2.85, 0.6]
        }

        let lead = [18, 20, 18, 17, 16, 14, 15, 16, 17, 18, 14]
        let vibLine = [11,10,9,7,8,7,8,9]
        let bassLine = [0,1,2,4,3,4,2,1,0,1,2,3,4,5,6,7]
        let bCnt = 0

        this.seq = new Sequencer( this.actx, {
            tempo: 160,
            eighth:function(time){
                let t = (60/this.tempo)/2 // # of seconds between quarter notes
                // movements ...............
                if( b==0 && self.m==8 ){
                    self.layers = 1
                    if(self.callbacks &&  self.callbacks[0]) self.callbacks[0]()
                }
                if( b==0 && self.m==24 ){
                    self.layers = 2
                    if(self.callbacks && self.callbacks[1]) self.callbacks[1]()
                }
                if( b==0 && self.m==32 ) self.layers = 3

                // rhythm piano ---------------------
                if(b==0 && self.m%4==0) self.playPianoSample(time,...pMap['F#4'])
                if(b==0 && self.m%4==1) self.playPianoSample(time,...pMap['G4'])
                if(b==0 && self.m%4==2) self.playPianoSample(time,...pMap['G#4'])
                if(b==0 && self.m%4==3) self.playPianoSample(time,...pMap['G4'])

                // piano accents -------------------
                if(self.layers >=0 ){
                    if(self.m%3==2){
                        if(b==6) self.playPianoSample(time,...pMap['F#4'],0.2)
                        if(b==7) self.playPianoSample(time,...pMap['F#4'],0.3)
                        if(b==8) self.playPianoSample(time,...pMap['F#4'],0.4)
                        if(b==9) self.playPianoSample(time,...pMap['F#4'],0.5)
                        if(b==10) self.playPianoSample(time,...pMap['F#4'],0.6)
                        if(b==11) self.playPianoSample(time,...pMap['F#4'],0.7)
                    } else if(self.m%3==1){
                        if(b==6) self.playPianoSample(time,...pMap['G4'],0.7)
                        if(b==7) self.playPianoSample(time,...pMap['G4'],0.6)
                        if(b==8) self.playPianoSample(time,...pMap['G4'],0.5)
                        if(b==9) self.playPianoSample(time,...pMap['G4'],0.4)
                        if(b==10) self.playPianoSample(time,...pMap['G4'],0.3)
                        if(b==11) self.playPianoSample(time,...pMap['G4'],0.2)
                    } else if(self.m%3==0){
                        if(b==6) self.playPianoSample(time,...pMap['G4'],0.2)
                        if(b==7) self.playPianoSample(time,...pMap['C#4'],0.4)
                        if(b==8) self.playPianoSample(time,...pMap['G4'],0.7)
                        if(b==9) self.playPianoSample(time,...pMap['C#4'],0.7)
                        if(b==10) self.playPianoSample(time,...pMap['G4'],0.4)
                        if(b==11) self.playPianoSample(time,...pMap['C#4'],0.2)
                    }
                }

                // callback hook
                if( b>=6 ){ if(self.hooks && self.hooks[0]) self.hooks[0]() }

                // strum rhythm ---------------------
                if(b%3==0) self.playStrum(time,0)
                if(self.m%4==3){
                    if(b==7) self.playStrum(time,1,'left')
                    if(b==8) self.playStrum(time,1,'right')
                    if(b==10) self.playStrum(time,1,'left')
                    if(b==11) self.playStrum(time,1,'right')

                } else if(self.m%4==1){
                    if(b==11) self.playStrum(time,1,'left')
                }


                // bass lines ---------------------
                if( self.layers>=1 && (b==0||b==6) ){
                    let n = scale[ vibLine[self.m%vibLine.length] ]
                    self.playVibeBass(n,time,t*4)
                }

                if(b%3==0 && self.layers>=2){
                    let n = scale[ bassLine[bCnt] ]
                    let s = (bCnt%2==0) ? 0 : 1
                    self.playPanoBass(n,time,t*2,s)
                    bCnt++; if(bCnt>=bassLine.length) bCnt=0
                }
                // callback hook
                if( b%3==0 && (self.layers>=2 || self.layers==-1) ){
                    if(self.hooks && self.hooks[1]) self.hooks[1]()
                }


                // lead melody ---------------------
                if(self.layers>=3){
                    if(self.m%4==0){
                         if(b==0) self.playLeadOsc(scale[lead[0]],time,t*4)
                         if(b==9) self.playLeadOsc(scale[lead[1]],time,t*3)
                    } else if(self.m%4==1){
                        if(b==0) self.playLeadOsc(scale[lead[2]],time,t*4)
                        if(b==9) self.playLeadOsc(scale[lead[3]],time,t*2)
                    } else if(self.m%4==2){
                        if(b==0) self.playLeadOsc(scale[lead[4]],time,t*4)
                        if(b==6) self.playLeadOsc(scale[lead[1]],time,t/2)
                        if(b==7) self.playLeadOsc(scale[lead[0]],time,t/2)
                        if(b==8) self.playLeadOsc(scale[lead[5]],time,t/2)
                        if(b==9) self.playLeadOsc(scale[lead[6]],time,t/2)
                        if(b==10) self.playLeadOsc(scale[lead[7]],time,t/2)
                        if(b==11) self.playLeadOsc(scale[lead[8]],time,t/2)
                    } else if(self.m%4==3){
                        if(b==0) self.playLeadOsc(scale[lead[9]],time,t*3)
                        if(b==3) self.playLeadOsc(scale[lead[10]],time,t*4)
                    }
                    // callback hook
                    if(self.hooks && self.hooks[2]){
                        if(self.m%4<=1 && (b==0||b==9) ) self.hooks[2]()
                        else if(self.m%4==2 && (b==0||b>=6)) self.hooks[2]()
                        else if(self.m%4==3 && (b==0||b==3)) self.hooks[2]()
                    }
                }

                b = (++b%12); if(!b) self.m++ // inc 12th beat && measure
            }
        })
    }

}
