/*
    Note
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    this helper class handles all sorts of maths related to converting notes to
    frequencies and vice-versa

    -----------
       usage
    -----------

    // initiate w/the default root note at A4(440Hz) tuned w/equal temperment
    let note = new Note()

    // or specify a different root note string
    note = new Note('D#5')

    // or instantiate with an options object to adjust tuning
    // as well as assign root note in Hz (frequency) rather than a note string
    note = new Note({
        tuning:'just',  // tune w/just intonation (instead of default 'equal')
        root:261.6'     // set root note to C4 (in just intonation it's 261.6Hz)
                        // this could also be written as a note string, ex: 'C4'
    })

    note.root // read-only, returns { note:'C', octave:4, freq:261.6 }
    note.freq // returns 261.6, this can also be set to a new value
    note.note // returns 'C', this can also be set to a new value
    note.octave // returns 4, this can also be set to a new value
    note.tuning // returns 'just', this can also e set to a new value
    note.step(4) // returns the {freq,note} 4 steps/keys beyond the root note


    // there are also a couple of useful dictionary objects, these
    // these are automatically re-calculated if/when the tuning is changed
    note.note2freq // pass a note string as a key && returns the frequency
    note.freq2note // pass a frequency as a key && returns note string


    // there are also a few general utility methods

    // justStep is similar to .step(), except you can pass a custom root note
    // as a frequency and it always returns the value based on just intonation
    note.justStep( rootFrquency, steps )

    // equalStep is like justStep but returns the new value in equal temperment
    note.equalStep( rootFrquency, steps )

    // this method takes a note string and optional tuning paramter and returns
    // the corresponding frequency value
    note.getFreqFromNote( noteString, tuning )

    // the inverse of above, except it always assumes the internally set tuning
    // you have to manually change note.tuning first if necessary
    note.getNoteFromFreq( frequency )

*/
class Note {
    constructor(params){
        let opts
        if(typeof params=='string') opts = {root:params}
        else if(typeof params=='object') opts = params
        else if(typeof params=='undefined') opts = {}
        else throw new Error('Note: constructor requires either an options '+
        'object or a ntoe string, ex: A, A#, C5, D#6, etc.')

        // TODO more tunings? meantone? pythogorus? others?
        // - http://pages.mtu.edu/~suits/scales.html
        // - https://www.albany.edu/piporg-l/tmprment.html
        this.tunings = ['equal','just']
        if(opts.tuning && !this.tunings.includes(opts.tuning)){
            throw new Error(`Note: ${params.tuning} is not a valid tuning.`+
            `choose from ${this.tunings}`)
        }
        this._tuning = opts.tuning || 'equal' // default of modern western music


        this.notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
        this.note2freq = this._createNote2FreqDict()
        this.freq2note = this._createFreq2NoteDict()
        if(opts.root){
            if(typeof opts.root == 'number') this._setFreq(opts.root)
            else if(typeof opts.root == 'string') this._setNote(opts.root)
        } else {
            this._root = { note:'A', octave:4, freq:440 }
        }
    }

    _getNoteIndex(note,octave){
        return this.notes.indexOf(note) + (octave*12)
    }

    _getFreqArray(){
        let arr = Object.keys(this.freq2note)
        return arr.sort((a,b)=>Number(a)-Number(b))
    }

    _getFreqIndex(freq){
        let index = this._getFreqArray().indexOf(freq)
        // let index = this.notes.indexOf(this._parseNoteStr(note).note)
        return index
    }

    _parseNoteStr(noteStr,calledBy){
        let note, octave
        let arr = noteStr.split('')
        if( !isNaN(Number(arr[arr.length-1])) ){ // ends w/number?

            let noteStrArr = (noteStr.length==3) ?
                [noteStr.substr(0,2),noteStr.substr(2)] :
                [noteStr.substr(0,1),noteStr.substr(1)]

            note = noteStrArr[0]
            octave = Number(noteStrArr[1])

        } else {
            note = noteStr
        }

        if( !this.notes.includes(note) )
            throw new Error(`Note.${calledBy}: ${note} is not a valid note, `+
            `try one of these: ${this.notes}`)

        return { note:note, octave:octave }
    }

    _setOctave(octave){
        let note = this._root.note
        let ni = this.notes.indexOf(note) + (octave*12)
        let arr = this._getFreqArray()
        this._root = {
            note:note,
            octave:octave,
            freq:arr[ni]
        }
    }

    _setNote(note){
        let n = this._parseNoteStr(note,'_setNote')
        let octave = n.octave ? n.octave :
            (this._root) ? this._root.octave : 4
        this._root = {
            note:n.note, octave:Number(octave), freq:this.note2freq[n.note+octave]
        }
    }

    _setFreq(freq){
        let approx = this.getNoteFromFreq(freq)
        let n = this._parseNoteStr(approx.note,'_setFreq')
        if(approx.off.cents !== 0)
            console.warn(`root frequency is set to ${freq}, but note that it `+
            `is ${approx.off.cents} cents off from a proper ${approx.note}`)
        this._root = { note:n.note, octave:n.octave, freq:freq }
    }

    _createNote2FreqDict(){
        let C0 = 16.35
        let dict = {}
        let step
        switch(this.tuning){
            case 'just': step = this.justStep; break;
            case 'equal': step = this.equalStep; break;
        }
        for (let i = 0; i < 10; i++) {
            for (let n = 0; n < this.notes.length; n++) {
                let note = this.notes[n] + i
                let s = this._getNoteIndex(this.notes[n],i)
                dict[note] = step(C0,s)
            }
        }
        return dict
    }

    _createFreq2NoteDict(){
        let dict = {}
        for(let note in this.note2freq ){
            let key = String(this.note2freq[note])
            dict[key] = note
        }
        return dict
    }

    _centsOffFromPitch( freq, ideal ) {
        return Math.floor( 1200 * Math.log( freq / ideal)/Math.log(2) )
    }


    // -------------------------------------------------------------------------
    // ---------------------------------------------------------- public methods

    step(val){
        let num = val || 0
        let rootIdx = this._getNoteIndex(this._root.note,this._root.octave)
        let freqs = this._getFreqArray()
        let i = rootIdx + num
        if(i < 0 ){
            console.warn(`Note.step(${num}) takes you bellow range by ${i}`+
            `rounding up to A0`)
            i = 0
        } else if(i > freqs.length-1){
            console.warn(`Note.step(${num}) takes you beyond range by `+
            `${i-freqs.length-1}, rounding down to G#10`)
        }

        return {
            freq:freqs[i],
            note:this.freq2note[String(freqs[i])]
        }
    }


    get root() { return this._root }
    set root(v){
        throw new Error('Note: root is a read-only property, try setting '+
        'the freq, note or octave properties instead')
    }

    get freq() { return this._root.freq }
    set freq(v){
        let freqs = this._getFreqArray()
        if(v > freqs[freqs.length-1]) throw new Error('Note: freq out of range')
        else if(v < freqs[0]) throw new Error('Note: freq bellow range')
        else this._setFreq(v)
    }

    get note() { return this._root.note }
    set note(v){ this._setNote(v) }

    get octave() { return this._root.octave }
    set octave(v){
        if(v < 0 ) throw new Error('Note: octave bellow range')
        else if(v > 9) throw new Error('Note: octave out of range')
        else this._setOctave(v)
    }

    get tuning(){ return this._tuning }
    set tuning(v){
        if(!this.tunings.includes(v)){
            throw new Error(`Note: ${v} is not a valid tuning.`+
            `choose from ${this.tunings}`)
        } else this._tuning = v
        this.note2freq = this._createNote2FreqDict()
        this.freq2note = this._createFreq2NoteDict()
    }



    // ---------------- general util methods -----------------------------------

    justStep( rootFreq, steps ){
        let ratios = [
            1,      // unison ( 1/1 )       // C
            25/24,  // minor second         // C#
            9/8,    // major second         // D
            6/5,    // minor third          // D#
            5/4,    // major third          // E
            4/3,    // fourth               // F
            45/32,  // diminished fifth     // F#
            3/2,    // fifth                // G
            8/5,    // minor sixth          // G#
            5/3,    // major sixth          // A
            9/5,    // minor seventh        // A#
            15/8,   // major seventh        // B
        ]

        if(steps >= ratios.length){
            let octaveShift = Math.floor( steps / ratios.length )
            rootFreq = rootFreq * Math.pow(2,octaveShift)
        }

        let r = steps % ratios.length
        let freq = rootFreq * ratios[r]
        return Math.round(freq*100)/100
    }

    equalStep( rootFreq, steps ){
        // formula: http://pages.mtu.edu/~suits/NoteFreqCalcs.html
        let tr2 = Math.pow(2, 1/12) // the twelth root of 2
        let rnd = rootFreq * Math.pow(tr2,steps)
        return Math.round(rnd*100)/100
    }

    getFreqFromNote(note,tuning){
        if(typeof note !== 'string')
            throw new Error('Note.getFreqFromNote: requires a note string')

        let n = this._parseNoteStr(note,'getFreqFromNote')
        let C0 = 16.35
        let tu = tuning ? tuning : this.tuning
        let oc = n.octave ? n.octave : this.octave
        let ni = this._getNoteIndex(n.note,oc)

        if(tu=='equal') return this.equalStep(C0,ni)
        else if(tu=='just') return this.justStep(C0,ni)
    }

    getNoteFromFreq(freq){ // assuming whatever internally set tuning
        let arr = this._getFreqArray()
        let closest = arr.sort((a,b)=>{
            return Math.abs(freq - Number(a)) - Math.abs(freq - Number(b))
        })[0]
        let note = this.freq2note[String(closest)]
        let cents = this._centsOffFromPitch(freq,closest)
        return {
            note:note,
            off:{
                target:closest,
                cents:cents,
                hz:freq-Number(closest)
            }
         }
    }
}
