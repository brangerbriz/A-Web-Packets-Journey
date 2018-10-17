/*
    AudioUtils
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    a collection of static functions with various WebAudio utilities:

    AudioUtils.adsr()
    AudioUtils.distortionCurve()
    AudioUtils.impulseBuffer()
    AudioUtils.whiteNoiseBuffer()
    AudioUtils.pinkNoiseBuffer()
    AudioUtils.brownNoiseBuffer()
    AudioUtils.sineWaveBuffer()
    AudioUtils.squareWaveBuffer()
    AudioUtils.sawtoothWaveBuffer()
    AudioUtils.loadBuffer()
    AudioUtils.soundFontBuffer()
    AudioUtils.detuneSoundFont()
    AudioUtils.noteFromPitch()
    AudioUtils.frequencyFromNoteNumber()
    AudioUtils.centsOffFromPitch()
    AudioUtils.getPitch()
    AudioUtils.createPitchAnalyzer()


*/
class AudioUtils {
    /*
        -----------
           info
        -----------

        this is a helper function that applies an ADSR (attack, decay, sustain,
        release) envelope to any WebAudio API AudioParm, for more info on ADSR
        check out: https://www.wikiaudio.org/adsr-envelope/

        -----------
           usage
        -----------

        AudioUtils.adsr({
            param: gnode.gain,  // required, the AudioParam to apply the adsr to
            value: [ 1, 0.75 ], // required, the peak value and the sustained value
                                // you can also pass a single number value for both
            startTime: 0,       // optional, when to start the adsr envelope
            a:0.2,              // optional, how long the attack should last
            d:0.1,              // optional, how long the decay should last
            s:0.4,              // optional, how long the sustain should last
            r:0.2               // optional, how long the release should last
        })

    */
    static adsr(o) {
        let param, initVal, peak, val

        if(typeof o == "undefined"){
            throw new Error('adsr: requires an options object. '+
            '[view source code for more info]')
        } else if( !(o.param instanceof AudioParam) ){
            throw new Error('adsr: requires an options object with a '+
            '"param" property with an AudioParam as it\'s value '+
            '[view source code for more info]')
        } else if( typeof o.value == "undefined" ){
            throw new Error('adsr: requires an options object with a '+
            '"value" property with either a number or Array of numbers '+
            'as it\'s value [view source code for more info]')
        } else {
            param = o.param
            initVal = o.param.value
        }

        if( o.value instanceof Array ){
            if( o.value.length < 2 ){
                throw new Error('adsr: when passing an array as the "value" param '+
                'it requires at least 2 values, first the peak value, then the '+
                'decayed value [view source code for more info]')
            } else {
                peak = o.value[0]
                val = o.value[1]
            }
        } else if(typeof o.value == "number"){
            peak = val = o.value
        } else {
            throw new Error('adsr: the "value" param should either be a number or '+
            'an Array with two numbers [view source code for more info]')
        }

        let time = o.startTime || 0
        let a = o.a || 0
        let d = o.d || 0
        let s = o.s || 0
        let r = o.r || 0

        /*
                    peak
                    /\   val  val
                   /| \__|____|
                  / |    |    |\
                 /  |    |    | \
           init /a  |d   |s   |r \ init

           <----------time------------>
        */
        param.setValueAtTime(initVal, time)
        if(o.a) param.linearRampToValueAtTime(peak, time+a)
        if(o.d) param.linearRampToValueAtTime(val, time+a+d)
        if(o.s) param.linearRampToValueAtTime(val, time+a+d+s)
        if(o.r) param.linearRampToValueAtTime(initVal, time+a+d+s+r)
    }

    /*
        -----------
           info
        -----------

        the WaveShaperNode is an audio processing module used to create
        distortion. It uses a curve to apply a wave shaping distortion to a
        signal. This creates a simple/basic curve. for other curves checkout:
        https://github.com/Theodeus/tuna/blob/master/tuna.js#L1288
        https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode

        -----------
           usage
        -----------

        let distortion = audioCtx.createWaveShaper()
        distortion.curve = AudioUtils.distortionCurve(400)
        distortion.oversample = '4x'
    */
    static distortionCurve(amount,rate) {
        let k = typeof amount === 'number' ? amount : 50
        let n_samples = rate || 44100
        let curve = new Float32Array(n_samples)
        let deg = Math.PI / 180
        let i = 0
        let x
        for ( ; i < n_samples; ++i ) {
            x = i * 2 / n_samples - 1
            curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) )
        }
        return curve
    }

    /*
        -----------
           info
        -----------

        creates an impulse buffer from scratch algorithmically (rather than
        loading one from a sound file) to be used with a ConvolverNode. it
        borrows code from Nick Thompson's simple-reverb repo:
        https://github.com/web-audio-components/simple-reverb
        https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode

        -----------
           usage
        -----------

        let rev = actx.createConvolver()
        rev.buffer = AudioUtils.impulseBuffer( actx, 3, 2, true )

    */
    static impulseBuffer( ctx, s, d, r ){
        let actx = ctx
        let seconds = s || 1
        let decay = d || 0.5
        let reverse = r || false

        let rate = actx.sampleRate
        let length = rate * seconds
        let impulse = actx.createBuffer(2, length, rate)
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

    /*
        -----------
           info
        -----------

        creates an audio buffer of white noise

        -----------
           usage
        -----------

        let src = actx.createBufferSource()
        src.buffer = AudioUtils.whiteNoiseBuffer(actx)
        src.connect( actx.destination )
        src.start()

    */
    static whiteNoiseBuffer( audioContext ){
        let ctx = audioContext
        let whiteBuffer = ctx.createBuffer(2, ctx.sampleRate*1, ctx.sampleRate)

        for (let ch=0; ch<whiteBuffer.numberOfChannels; ch++) {
            let samples = whiteBuffer.getChannelData(ch)
            for (let s=0; s<whiteBuffer.length; s++) {
                samples[s] = Math.random()*2-1
            }
        }

        return whiteBuffer
    }
    /*
        -----------
           info
        -----------

        creates an audio buffer of pink noise

        -----------
           usage
        -----------

        let src = actx.createBufferSource()
        src.buffer = AudioUtils.pinkNoiseBuffer(actx)
        src.connect( actx.destination )
        src.start()
    */
    static pinkNoiseBuffer( config ){
        let ctx = config.audioContext
        let pinkBuffer = ctx.createBuffer(2, ctx.sampleRate*1, ctx.sampleRate)

        for (let ch=0; ch<pinkBuffer.numberOfChannels; ch++) {
            let b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0
            let samples = pinkBuffer.getChannelData(ch)
            for (let s = 0; s<pinkBuffer.length; s++) {
                white = Math.random() * 2 - 1
                b0 = 0.99886 * b0 + white * 0.0555179
                b1 = 0.99332 * b1 + white * 0.0750759
                b2 = 0.96900 * b2 + white * 0.1538520
                b3 = 0.86650 * b3 + white * 0.3104856
                b4 = 0.55000 * b4 + white * 0.5329522
                b5 = -0.7616 * b5 - white * 0.0168980
                samples[s] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
                samples[s] *= 0.11 // (roughly) compensate for gain
                b6 = white * 0.115926
            }
        }

        return pinkNoiseBuffer
    }
    /*
        -----------
           info
        -----------

        creates an audio buffer of brown noise

        -----------
           usage
        -----------

        let src = actx.createBufferSource()
        src.buffer = AudioUtils.brownNoiseBuffer(actx)
        src.connect( actx.destination )
        src.start()
    */
    static brownNoiseBuffer( config ){
        let ctx = config.audioContext
        let brownBuffer = ctx.createBuffer(2, ctx.sampleRate*1, ctx.sampleRate)

        for (let ch=0; ch<brownBuffer.numberOfChannels; ch++) {
            let samples = brownBuffer.getChannelData(ch)
            let lastOut = 0.0
            for (s = 0; s<brownBuffer.length; s++) {
                white = Math.random() * 2 - 1
                samples[s] = (lastOut + (0.02 * white)) / 1.02
                lastOut = samples[s]
                samples[s] *= 3.5 // (roughly) compensate for gain
            }
        }

        return brownBuffer
    }
    /*
        -----------
           info
        -----------

        creates an audio buffer of a sine wave

        -----------
           usage
        -----------

        let src = actx.createBufferSource()
        src.buffer = AudioUtils.sineWaveBuffer(actx)
        src.connect( actx.destination )
        src.start()
    */
    static sineWaveBuffer( config ){
        let ctx = config.audioContext
        let sineBuffer = ctx.createBuffer(2, ctx.sampleRate*1, ctx.sampleRate)
        /*
            the formula for creating a sine wave is sin(freq*2*PI*t), where
            freq is the particular frequency in Hz and t is the point in time,
            essentially the index of a sample, a deeper explination can be
            found in this pdf: http://www-math.bgsu.edu/%7Ezirbel/sound/Trigonometric%20functions%20and%20sound.pdf
        */
        for (let ch = 0; ch < sineBuffer.numberOfChannels; ch++) {
            let samples = sineBuffer.getChannelData(ch)

            for (let s = 0; s < sineBuffer.length; s++){
                // 440 is the frequency in Hz of a standard A4 note,
                // for more info on the how/why check out this post
                // on Signals and Sine Waves in the WebAudio API
                let scalar = (440 * 2 * Math.PI) / sineBuffer.sampleRate
                samples[s] = Math.sin(s*scalar)
            }
        }

        return sineBuffer
    }
    /*
        -----------
           info
        -----------

        creates an audio buffer of a sqare wave

        -----------
           usage
        -----------

        let src = actx.createBufferSource()
        src.buffer = AudioUtils.squareWaveBuffer(actx)
        src.connect( actx.destination )
        src.start()
    */
    static squareWaveBuffer( config ){
        let ctx = config.audioContext
        let squareBuffer = ctx.createBuffer(2, ctx.sampleRate*1, ctx.sampleRate)

        for (let ch = 0; ch < squareBuffer.numberOfChannels; ch++) {
            let samples = squareBuffer.getChannelData(ch)

            for (let s = 0; s < squareBuffer.length; s++){
                let scalar = (440 * 2 * Math.PI) / squareBuffer.sampleRate
                let sin = Math.sin(s*scalar)
                // w/a little more code we can convert this square wave into a square wave
                if(sin>0) samples[s] = 1
                else samples[s] =  -1
            }
        }

        return squareBuffer
    }
    /*
        -----------
           info
        -----------

        creates an audio buffer of a sawtooth wave

        -----------
           usage
        -----------

        let src = actx.createBufferSource()
        src.buffer = AudioUtils.sawtoothWaveBuffer(actx)
        src.connect( actx.destination )
        src.start()
    */
    static sawtoothWaveBuffer( config ){
        let ctx = config.audioContext
        let sawtoothBuffer = ctx.createBuffer(2, ctx.sampleRate*1, ctx.sampleRate)

        for (let ch = 0; ch < sineBuffer.numberOfChannels; ch++) {
            let samples = sineBuffer.getChannelData(ch)

            for (let s = 0; s < sineBuffer.length; s++){
                let scalar = (440 * 2 * Math.PI) / sineBuffer.sampleRate
                let sin = Math.sin(s*scalar)
                // divide the sample rate by the frequency to get the amount of
                // samples that are in a single period of the sine wave...
                let period = sineBuffer.sampleRate / 440
                // ...use modulus for some clock logic, converting the index
                // values of each sample to their place in the period...
                let idx = s%period
                // ...then map that idx value to it's value in the -1 to 1 range
                samples[s] = (idx*2/period) -1
            }
        }

        return sawtoothBuffer
    }

    /*
        -----------
           info
        -----------

        loads an audio buffer using fetch (fallback to XMLHttpRequest)
        https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
        https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
        https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest

        -----------
           usage
        -----------

        let src = actx.createBufferSource()
            src.connect( actx.destination )

        AudioUtils.loadBuffer({
            audioContext: actx,         // required audioContext instance
            file:'path/to/audio.mp3',   // required path to audio file
        },(buffer)=>{               // required callback
            src = buffer
            src.start()
        })

    */
    static loadBuffer(config,callback){
        let ctx = config.audioContext
        if(typeof fetch == "function"){

            fetch(config.file)
            .then(res => res.arrayBuffer() )
            .then(data => {
                // use the AudioContext's decodeAudioData method to decode
                // the audio data contained in the buffer
                ctx.decodeAudioData(data, (buffer)=>{ callback(buffer) })
            }).catch(err => { console.error(err) })

        } else {

            let req = new XMLHttpRequest()
            req.open('get', config.file, true)
            req.responseType = 'arraybuffer'
            req.onload = function() {
                // use the AudioContext's decodeAudioData method to decode
                // the audio data contained in the buffer
                ctx.decodeAudioData(req.response, function(buffer){
                    callback(buffer)
                })
            }
            req.onerror = function(err){ console.error(err) }
            req.send()
        }
    }

    /*
        -----------
           info
        -----------

        loads an audio buffer from a soundFont (base64 data), for example from
        the js files in the 'sound-fonts' folder, files scraped from this site:
        https://surikov.github.io/webaudiofontdata/sound/ as part of the
        webaudiofont repo by Srgy Surkv: https://github.com/surikov/webaudiofont

        -----------
           usage
        -----------
        let src = actx.createBufferSource()
            src.connect( actx.destination )

        // soundFont object should look something like this:
        let sfont = {
            zones:[
                { sampleRate:44100, sample:'[base64string]' },
                { sampleRate:44100, sample:'[base64string]' },
                { sampleRate:44100, sample:'[base64string]' }
            ]
        }
        // or something like this:
        sfong = {
            zones:[
                { sampleRate:22050, file:'[base64string]' },
                { sampleRate:22050, file:'[base64string]' },
                { sampleRate:22050, file:'[base64string]' }
            ]
        }

        AudioUtils.soundFontBuffer({
            audioContext: actx,         // required audioContext instance
            soundFont:sfont,            // required sound font object
        },(buffer)=>{                   // required callback
            src.buffer = buffer
            src.start()
        })
    */
    static soundFontBuffer(config,callback){
        let actx = config.audioContext
        let fontObj = config.soundFont
        let z = config.index ? config.index : 0
        let zone = fontObj.zones[z]

        if(zone.file){
            let data = zone.file
            let sampleRate = zone.sampleRate
            let arraybuffer = new ArrayBuffer(data.length)
            let view = new Uint8Array(arraybuffer)
            let b, decoded = atob(data)
            for (let i = 0; i < decoded.length; i++) {
                b = decoded.charCodeAt(i)
                view[i] = b
            }
            actx.decodeAudioData( arraybuffer, (buffer)=>{ callback(buffer) })
        } else {
            let decoded = atob(zone.sample)
            let buffer = actx.createBuffer(1, decoded.length/2, zone.sampleRate)
            let float32Array = buffer.getChannelData(0)
            let b1, b2, n
            for (let i = 0; i < decoded.length/2; i++) {
                b1 = decoded.charCodeAt(i * 2)
                b2 = decoded.charCodeAt(i * 2 + 1)
                if (b1 < 0) b1 = 256 + b1
                if (b2 < 0) b2 = 256 + b2
                n = b2 * 256 + b1
                if (n >= 65536 / 2) n = n - 65536
                float32Array[i] = n / 65536.0
            }
            callback(buffer)
        }
    }
    /*
        -----------
           info
        -----------

        because the AudioBufferSourceNode's detune property isn't implemented in
        all browsers, this is a way of detuning an AudioBufferSourceNode with a
        buffer created by this.soundFontBuffer by adjusting it's playbackRate

        -----------
           usage
        -----------
        let src = actx.createBufferSource()
            src.connect( actx.destination )

        AudioUtils.soundFontBuffer({
            audioContext: actx,
            soundFont: sfont,
        },(buffer)=>{
            src.buffer = buffer
            src.playbackRate.value = AudioUtils.detuneSoundFont({
                audioContext: actx,
                zone: sfont.zones[0],
                note: 60 // C5
            })
            src.start()
        })
    */
    static detuneSoundFont(config){
        let actx = config.audioContext
        let z = config.zone // zone object from a soundFont object
        let n = config.note // 0-120 note key number
        let baseDetune = z.originalPitch - 100.0 * z.coarseTune - z.fineTune
        return 1.0 * Math.pow(2, (100.0 * n - baseDetune) / 1200.0)
    }

    /*

        -----------
           info
        -----------

        these are functions for calculating the frequency in Hz of a sound sample
        from a WebAudio AnalyserNode. as well as a few other helper functions.
        this is 100% Chris Wilson's work: https://github.com/cwilso/PitchDetect

        see the createPitchAnalyzer function below for usage example

    */
    static noteFromPitch( freq ) {
        let noteNum = 12 * (Math.log( freq / 440 )/Math.log(2) )
        return Math.round( noteNum ) + 69
    }

    static frequencyFromNoteNumber( note ) {
        return 440 * Math.pow(2,(note-69)/12)
    }

    static centsOffFromPitch( freq, note ) {
        return Math.floor(
            1200 * Math.log( freq / this.frequencyFromNoteNumber( note ))/Math.log(2)
        )
    }

    static getPitch(fft,sampleRate){

        const bufferLength = fft.frequencyBinCount
        const dataArray = new Float32Array(bufferLength)

        const SIZE = dataArray.length
        const MAX_SAMPLES = Math.floor(SIZE/2)
        const MIN_SAMPLES = 0

        let best_offset = -1
        let best_correlation = 0
        let correlations = new Array(MAX_SAMPLES)
        let foundGoodCorrelation = false
        let rms = 0

        fft.getFloatTimeDomainData( dataArray )

        for (let i=0;i<SIZE;i++) {
            let val = dataArray[i]
            rms += val*val
        }
        rms = Math.sqrt(rms/SIZE);
        if (rms<0.01) // not enough signal
            return -1

        let lastCorrelation=1
        for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
            let correlation = 0

            for (let j=0; j<MAX_SAMPLES; j++) {
                correlation += Math.abs((dataArray[j])-(dataArray[j+offset]))
            }
            correlation = 1 - (correlation/MAX_SAMPLES)
            // store it, for the tweaking we need to do below.
            correlations[offset] = correlation;

            if ((correlation>0.9) && (correlation > lastCorrelation)) {
                foundGoodCorrelation = true
                if (correlation > best_correlation) {
                    best_correlation = correlation
                    best_offset = offset
                }
            } else if (foundGoodCorrelation) {
            // short-circuit - we found a good correlation, then a bad one, so we'd
            // just be seeing copies from here. Now we need to tweak the offset - by
            // interpolating between the values to the left and right of the
            // best offset, and shifting it a bit.  This is complex, and HACKY in
            // this code (happy to take PRs!) - we need to do a curve fit on
            // correlations[] around best_offset in order to better determine
            // precise (anti-aliased) offset. we know best_offset >=1, since
            // foundGoodCorrelation cannot go to true until the second pass
            // (offset=1), and we can't drop into this clause until the following
            // pass (else if).
                let shift = (correlations[best_offset+1] -
                    correlations[best_offset-1])/correlations[best_offset]
                return sampleRate/(best_offset+(8*shift))
            }
            lastCorrelation = correlation
        }
        if (best_correlation > 0.01) {
            return sampleRate/best_offset
        }
        return -1
    }

    /*

        -----------
           info
        -----------

        this uses the pitch functions above to analyze a given AudioNode on a
        loop which returns pitch information.

        -----------
           usage
        -----------

        let analyser = AudioUtils.createPitchAnalyzer({
            audioContext:actx,  // required AudioContxt instance
            source:src,         // required AudioNode to analyze
            frameRate: 12,      // optional frame rate of analysing loop
            limit: 10           // optional limit analysing loop inervals
        },(data)=>{             // required callback loop
            console.log(data)
        })

    */
    static createPitchAnalyzer( config, callback ){
        let notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
        let actx = config.audioContext
        let src = config.source
        let fr = config.frameRate || 12 // 12fps
        let max = config.limit || Infinity
        let cnt = 0
        let fft = actx.createAnalyser()
        src.connect(fft)

        let self = this
        function loop(){
            if(cnt < max) setTimeout(loop,1000/fr)
            // pass fft and sample-rate to getPitch in Hz
            let pitch = self.getPitch(fft, actx.sampleRate)
            // convert pitch to note int 0-11
            let note = self.noteFromPitch( pitch )
            let noteStr = notes[note%12] + (Math.floor(note/12)-1)
            // calculate how detuned it is in cents
            let detune = self.centsOffFromPitch( pitch, note )
            callback({
                pitch:pitch,
                note:{ number:note, string:noteStr },
                detune:detune
            })
            cnt++
        } loop()
    }

}
