/*
    Melody
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    this helper class handles all sorts of maths related to using/creating
    modes/scales and melodies. it extends the Note.js class

    -----------
       usage
    -----------

    // you can create a new Melody instance as show below, but there is also an
    // optional options object similar to the Note.js options object but with
    // the addition of a 'mode' property (to set the default mode)
    let mel = new Melody('C5','major') // if no args, default is ('A4','major')

    mel.mode // returns the current default mode, ex: 'major'

    // you can get the array of steps of any mode like this
    mel.modes.major // [ 2, 2, 1, 2, 2, 2, 1 ]

    // you can convert the current mode to it's degrees (steps from root)
    // you can also pass this method optional [mode,includeOctave]
    mel.getMode() // [ 0, 2, 4, 5, 7, 9, 11 ]

    // you can convert the current mode to it's note strings
    // you can also pass this method optional [mode,includeOctave,root]
    mel.getNoteMode() // [ "A4", "B4", "C#5", "D5", "E5", "F#5", "G#5" ]

    // you can convert the current mode to it's frequencies
    // you can also pass this method optional [mode,includeOctave,root]
    mel.getFreqMode() // [ 439.96, 493.84, 554.31, 587.27, 659.19, 739.92, 830.53 ]

    mel.modes // returns an array of all the modes
    mel.addMode(name,arrayOfSteps) // to add a new mode to the dictionary
    me.createMode([length],[crazy]) // where length is optional length of mode
    // and crazy is a boolean, if set to true the mode will be completly random
    // otherwise the steps will reflect the probability of the other modes


    // -------------------------------------------------------------------------
    // as the name implies, there is also a few methods for creating melodies
    // to be used with instances of the Sequencer.js class

    mel.createMelody() // creates a random melody in the current mode,
                       // optionally...
    mel.createMelody({
        bars:1,         // bars/measures
        res:r0,         // note resolution (see above)
        mode:'major',   // the current default mode
        range:1,        // octave range
        rest:0.5,       // how likely are rests (-1, none)
        oct:false       // include the root octave
    }})

    // this will return the degrees in steps from the root, with rests written
    // as null, for ex: [ 8, null, null, 5, 8, 0...]

    // if you want the melody returned as an array of notes you can use the
    // .createNote method, it takes the same optional options object as above
    mel.createNote() // [ "F5", null, null, "D5", "F5", "A4"...]

    // similar to both above methods there is also a .createFreqMelody
    mel.createFreqMelody() // [ 698.39, null, null, 587.27, 698.39, 439.96...]

    // the above methods will return a brand new melody each time, for this
    // reason if you ever need the same melody written in all three formats
    // you can use the .createMelodyObject method, which takes the same options
    // object as the above methods, with an additional "root" property, should
    // you want to change the root note (this is likely the most useful method)
    mel.createMelodyObject()
    // returns {
    //     root:"A4",
    //     mode:"minor",
    //     steps:[ 8, null, null, 5, 8, 0...],
    //     notes:[ "F5", null, null, "D5", "F5", "A4"...]
    //     freqs:[ 698.39, null, null, 587.27, 698.39, 439.96...]
    // }

*/
class Melody extends Note {
    constructor(params,mode){
        let opts
        if(mode){
            if(typeof params=="string" && typeof mode=="string"){
                opts = {root:params, mode:mode}
                super(opts)
            } else {
                throw new Error("Melody: when passing two arguments they should"+
                " both be strings, first the note (ex: 'A4') then the mode "+
                "(ex: 'major')")
            }
        } else {
            if(typeof params=="object"){
                opts = params
                if(!opts.mode) opts.mode = 'major'
                super(opts)
            } else if(typeof params=="undefined"){
                opts = {root:'A4',mode:'major'}
                super(opts)
            } else {
                throw new Error("Melody: expects either an options object as a "+
                "single argument, or a note string (ex: 'A4') followed by a "+
                "mode (ex: 'major') as the second argument")
            }
        }

        this._mode = opts.mode

        this.modes = {
            'major'                : [2, 2, 1, 2, 2, 2, 1],
            'minor'                : [2, 1, 2, 2, 1, 2, 2],
            'harmonic-minor'       : [2, 1, 2, 2, 1, 3, 1],
            'melodic-minor'        : [2, 1, 2, 2, 2, 2, 1],
            'major-pentatonic'     : [2, 2, 3, 2, 3],
            'minor-pentatonic'     : [3, 2, 2, 3, 2],
            'blues'                : [3, 2, 1, 1, 3, 2],
            'minor-blues'          : [2, 1, 2, 1, 1, 1, 2, 2],
            'major-blues'          : [2, 1, 1, 1, 1, 1, 2, 1, 2],
            'augmented'            : [2, 2, 2, 2, 2, 2],
            'diminished'           : [2, 1, 2, 1, 2, 1, 2, 1],
            'phrygiandominant'     : [1, 3, 1, 2, 1, 2, 2],
            'dorian'               : [2, 1, 2, 2, 2, 1, 2],
            'phrygian'             : [1, 2, 2, 2, 1, 2, 2],
            'lydian'               : [2, 2, 2, 1, 2, 2, 1],
            'mixolydian'           : [2, 2, 1, 2, 2, 1, 2],
            'locrian'              : [1, 2, 2, 1, 2, 2, 2],
            'jazz-melodic-minor'   : [2, 1, 2, 2, 2, 2, 1],
            'dorian-b2'            : [1, 2, 2, 2, 2, 1, 2],
            'lydian-augmented'     : [2, 2, 2, 2, 1, 2, 1],
            'lydian-b7'            : [2, 2, 2, 1, 2, 1, 2],
            'mixolydian-b13'       : [2, 2, 1, 2, 1, 2, 2],
            'locrian-#2'           : [2, 1, 2, 1, 2, 2, 2],
            'super-locrian'        : [1, 2, 1, 2, 2, 2, 2],
            'whole-half-diminished': [2, 1, 2, 1, 2, 1, 2, 1],
            'half-whole-diminished': [1, 2, 1, 2, 1, 2, 1, 2],
            'enigmatic'            : [1, 3, 2, 2, 2, 1, 1],
            'double-harmonic'      : [1, 3, 1, 2, 1, 3, 1],
            'hungarian-minor'      : [2, 1, 3, 1, 1, 3, 1],
            'persian'              : [1, 3, 1, 1, 2, 3, 1],
            'arabian'              : [2, 2, 1, 1, 2, 2, 2],
            'japanese'             : [1, 4, 2, 1, 4],
            'egyptian'             : [2, 3, 2, 3, 2],
            'hirajoshi'            : [2, 1, 4, 1, 4],
        }

        // aliases
        this.modes['natural-major']=this.modes['ionian']=this.modes['major']
        this.modes['natural-minor']=this.modes['aeolian']=this.modes['minor']

        let mArr = Object.keys(this.modes)
        if( !mArr.includes(opts.mode) ) throw new Error(`Melody: `+
        `${opts.mode} is not a valid mode, use one of the these: ${mArr}`)

    }

    get mode(){ return this._mode }
    set mode(v){
        let mArr = Object.keys(this.modes)
        if( !mArr.includes(v) ) throw new Error(`Melody: ${v} is not a valid `+
        `mode, use .addMode() to create a new one, otherwise try one of the `+
        `following: ${mArr}`)
        this._mode = v
    }

    // utils -------------------------------------------------------------------

    deg2step(degree,mode){
        let steps = 0 // how many steps from root is the given degree
        for (let i = 0; i < degree; i++) steps += mode[i]
        return steps
    }

    mode2steps(mode,includeOctave){
        let melody = []
        for (let degree = 0; degree < mode.length; degree++) {
            let steps = 0
            for (let s = 0; s < degree; s++) steps += mode[s]
            melody.push(steps)
        }
        if(includeOctave) melody.push(12)
        return melody
    }

    steps2mode(steps){
        let mode = []
        for (let i = 0; i < steps.length; i++) {
            let s = 0
            if(i>0) s = steps[i] - steps[i-1]
            mode.push(s)
        }
        return mode
    }

    // mode methods ------------------------------------------------------------

    getMode(mode,includeOctave){
        mode = mode || this._mode
        return this.mode2steps(this.modes[mode],includeOctave)
    }

    getNoteMode(mode,includeOctave,root){
        mode = mode || this._mode
        let tonic = root ? new Note({root:root}) : this
        let melody = this.mode2steps(this.modes[mode],includeOctave)
        let noteStr = tonic.note + tonic.octave
        let noteArr = Object.keys(tonic.note2freq)
        let rootIdx = noteArr.indexOf(noteStr)

        let notes = []
        for (let i = 0; i < melody.length; i++) {
            let idx = rootIdx + melody[i]
            notes.push( noteArr[idx] )
        }
        return notes
    }

    getFreqMode(mode,includeOctave,root){
        mode = mode || this._mode
        let notes = this.getNoteMode(mode,includeOctave,root)
        let freqs = []
        for (let i = 0; i < notes.length; i++) {
            freqs.push( this.note2freq[notes[i]] )
        }
        return freqs
    }

    addMode(name,modeArr){
        if(!name) throw new Error('Melody: every mode needs a name')
        if(!modeArr) throw new Error('Melody: every mode needs an array, for '+
        'ex here\'s the "major" mode\'s array:'+this.modes.major)
        this.modes[name] = modeArr
    }

    _getProbRanStep(chances,orderedChances){
        let o = orderedChances//.reverse()
        let r = Math.random()
        for (let i = 0; i < o.length; i++) {
            let a, b
            if( i==0 ){
                a = 0; b = chances[o[i+1]]
            } else if(i==o.length-1){
                a = chances[o[i]]; b = 1
            } else {
                a = chances[o[i]]; b = chances[o[i+1]]
            }

            if(a < r && r <= b){
                return Number(o[i])
            }
        }
    }

    createMode(length,crazy){
        length = length || 7
        let mode = []
        if(crazy){
            for (let i = 0; i < length; i++) {
                let ran = Math.round(Math.random()*8-4)
                mode.push(ran)
            }
        } else {
            let total = [] // collect all the steps in all the modes
            for(let i in this.modes) total = [...total,...this.modes[i]]
            let counts = {} // count how many occurrences of each step there are
            for (let i = 0; i < total.length; i++) {
                let num = total[i]
                counts[num] = counts[num] ? counts[num] + 1 : 1
            }
            let chances = {} // calculate the probability of each step
            for(let i in counts) chances[i] = counts[i]/total.length
            let o = [] // order steps by probability
            o = Object.keys(chances).sort((a,b)=>{return chances[a]-chances[b]})
            // create a new random (probability based) mode
            for (let i = 0; i < length; i++) {
                mode.push( this._getProbRanStep(chances,o) )
            }
        }
        return mode
    }

    // melody methods ----------------------------------------------------------
    /*
        these melodies are meant to be used with Sequencer.js
        which breaks down beats into sixteenth notes

           00-01-02-03-04-05-06-07-08-09-10-11-12-13-14-15- 16 discrete beats
        0: |--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|-- 16 sixteenth notes
        1: |-----|-----|-----|-----|-----|-----|-----|----- 8 eighth notes
        2: |-----------|-----------|-----------|----------- 4 quarter notes
           |-----------------------|----------------------- 2 half notes
           |----------------------------------------------- 1 whole note (bar)

        noteResolution (as defined in Sequencer): when set to 0 the Sequencer
        calls the scheduled functions on every 16th note. when set to 1 it will
        only play the 8th notes. when set to 2 it will play only quarter notes.
    */

    _scaleMode2Range(mode,range,includeOctave){
        let a = []
        for (let i = 0; i <range; i++) {
            if(i==range-1 && includeOctave)
                a = [...a,...this.getMode(mode,true).map(n=>n+i*12)]
            else
                a = [...a,...this.getMode(mode).map(n=>n+i*12)]
        }
        return a
    }

    createMelody(opts){
        opts = opts || {}
        let o = {
            bars:opts.bars || 1,            // bars/measures
            res:opts.res || 0,              // note resolution (see above)
            mode:opts.mode || this._mode,   // the current default mode
            range:opts.range || 1,          // octave range
            rest:opts.rest || 0.5,          // how likely are rests (-1, none)
            oct:opts.includeOctave || false // include the root octave
        }

        let melody = []
        for (let b = 0; b < o.bars; b++) {
            for (let i = 0; i < 16; i++) {
                // if noteResolution is 1, don't play non-8th 16th notes
                if ( (o.res==1) && (i%2) ) melody.push(null) // rest
                // if noteResolution is 2, don't play non-quarter 8th notes
                else if ( (o.res==2) && (i%4) ) melody.push(null) // rest
                // otherwise...
                else {
                    if( o.rest > Math.random() ) melody.push(null)
                    else {
                        let m = this._scaleMode2Range(o.mode,o.range,o.oct)
                        let s = m[Math.floor(Math.random()*m.length)]
                        melody.push(s)
                    }
                }
            }
        }
        return melody
    }

    createNoteMelody(opts){
        opts = opts || {}
        let tonic = opts.root ? new Note({root:opts.root}) : this
        let o = {
            bars:opts.bars || 1,            // bars/measures
            res:opts.res || 0,              // note resolution (see above)
            mode:opts.mode || this._mode,   // the current default mode
            range:opts.range || 1,          // octave range
            rest:opts.rest || 0.5,          // how likely are rests (-1, none)
            oct:opts.includeOctave || false // include the root octave
        }

        let melody = this.createMelody(o)
        let noteStr = tonic.note + tonic.octave
        let noteArr = Object.keys(tonic.note2freq)
        let rootIdx = noteArr.indexOf(noteStr)

        let notes = []
        for (let i = 0; i < melody.length; i++) {
            if(melody[i]){
                let idx = rootIdx + melody[i]
                notes.push( noteArr[idx] )
            } else {
                notes.push(null)
            }
        }
        return notes
    }

    createFreqMelody(opts){
        opts = opts || {}
        let notes = this.createNoteMelody(opts)
        let freqs = []
        for (let i = 0; i < notes.length; i++) {
            if(notes[i]) freqs.push( this.note2freq[notes[i]] )
            else freqs.push(null)
        }
        return freqs
    }

    createMelodyObject(opts){
        opts = opts || {}
        let tonic = opts.root ? new Note({root:opts.root}) : this
        let o = {
            bars:opts.bars || 1,            // bars/measures
            res:opts.res || 0,              // note resolution (see above)
            mode:opts.mode || this._mode,   // the current default mode
            range:opts.range || 1,          // octave range
            rest:opts.rest || 0.5,          // how likely are rests (-1, none)
            oct:opts.includeOctave || false // include the root octave
        }

        let melody = this.createMelody(o)
        let noteStr = tonic.note + tonic.octave
        let noteArr = Object.keys(tonic.note2freq)
        let rootIdx = noteArr.indexOf(noteStr)

        let notes = []
        for (let i = 0; i < melody.length; i++) {
            if(melody[i]!==null){
                let idx = rootIdx + melody[i]
                notes.push( noteArr[idx] )
            } else {
                notes.push(null)
            }
        }

        let freqs = []
        for (let i = 0; i < notes.length; i++) {
            if(notes[i]!==null) freqs.push( this.note2freq[notes[i]] )
            else freqs.push(null)
        }

        return {
            root:tonic.note+tonic.octave,
            mode:o.mode,
            steps:melody,
            notes:notes,
            freqs:freqs
        }
    }



}
