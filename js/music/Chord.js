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
    chords. it extends the Note.js class

    -----------
       usage
    -----------

    // you can create a new Chord instance as show below, but there is also an
    // optional options object similar to the Note.js options object but with
    // the addition of a 'chord' property (to set the default mode)
    let ch = new Chord('C#5','min') // if no args, default is ('A4','maj')


    ch.chord // returns the current set chord, ex: 'maj'

    // you can get the array of steps which follow the root of any chord like so
    ch.chords.maj // [ 4, 3 ]

    // you can get the chord in degress like so
    ch.getChord() // [ 0, 4, 7 ]

    // you can get that array as note strings like so
    ch.getNoteChord() // [ "A4", "C#5", "E5" ]

    // you can also get it as frequencies like so
    ch.getFreqChord() // [ 439.96, 554.31, 659.19  ]

    // all three methods above take a few optional arguments:
    let root = "A4", chord = "min7", inverted = 1
    ch.getChord(chord,inverted)
    ch.getNoteChord(root,chord,inverted)
    ch.getFreqChord(root,chord,inverted)
    // 'root', to get the chord of a diff root from the one set
    // 'chord', to get a different chord from the one set internally
    // 'inverted', to get the inverted version of the chord (1,2,3)

    // you can also add custom chords like so
    ch.addChord('name',[2,2])

*/
class Chord extends Note {
    constructor(params,chord){
        let opts
        if(chord){
            if(typeof params=="string" && typeof chord=="string"){
                opts = {root:params, chord:chord}
                super(opts)
            } else {
                throw new Error("Chord: when passing two arguments they should"+
                " both be strings, first the note (ex: 'A4') then the chord "+
                "(ex: 'maj')")
            }
        } else {
            if(typeof params=="object"){
                opts = params
                if(!opts.chord) opts.chord = 'maj'
                super(opts)
            } else if(typeof params=="undefined"){
                opts = {root:'A4',chord:'maj'}
                super(opts)
            } else {
                throw new Error("Chord: expects either an options object as a "+
                "single argument, or a note string (ex: 'A4') followed by a "+
                "chord (ex: 'maj') as the second argument")
            }
        }

        this._chord = opts.chord

        this.chords = {
            "maj"     : [4, 3],
            "min"     : [3, 4],
            "dim"     : [3, 3],
            "7"       : [4, 3, 3],
            "min7"    : [3, 4, 3 ],
            "maj7"    : [4, 3, 4],
            "sus4"    : [5, 2],
            "7sus4"   : [5, 2, 3],
            "6"       : [4, 3, 2],
            "min6"    : [3, 4, 2],
            "aug"     : [4, 4],
            "7-5"     : [4, 2, 4],
            "7+5"     : [4, 4, 2],
            "min7-5"  : [3, 3, 4],
            "min/maj7": [3, 4, 4],
            "maj7+5"  : [4, 4, 3],
            "maj7-5"  : [4, 2, 5],
            "9"       : [4, 3, 3, -8],
            "min9"    : [3, 4, 3, -8],
            "maj9"    : [4, 3, 4, -9],
            "7+9"     : [4, 3, 3, -7],
            "7-9"     : [4, 3, 3, -9],
            "7+9-5"   : [4, 2, 4, -7],
            "6/9"     : [4, 3, 2, -7],
            "9+5"     : [4, 4, 2, -8],
            "9-5"     : [4, 2, 4, -8],
            "min9-5"  : [3, 3, 4, -8],
            "11"      : [4, 3, 3, -8, 3],
            "min11"   : [3, 4, 3, -8, 3],
            "11-9"    : [4, 3, 3, -9, 4],
            "13"      : [4, 3, 3, -8, 3, 4],
            "min13"   : [3, 4, 3, -8, 3, 4],
            "maj13"   : [4, 3, 4, -9, 3, 4],
            "add9"    : [4, 3, -5],
            "minadd9" : [3, 4, -5],
            "sus2"    : [2, 5],
            "5"       : [7]
        }

        let cArr = Object.keys(this.chords)
        if( !cArr.includes(opts.chord) ) throw new Error(`Chord: `+
        `${opts.chord} is not a valid chord, use one of the these: ${cArr}`)
    }

    get chord(){ return this._chord }
    set chord(v){
        let cArr = Object.keys(this.chords)
        if( !cArr.includes(v) ) throw new Error(`Chord: ${v} is not a valid `+
        `chord, use .addChord() to create a new one, otherwise try one of the `+
        `following: ${cArr}`)
        this._chord = v
    }

    // utils -------------------------------------------------------------------

    chord2stepsFromRoot(chord,inverted){
        let ch
        if(typeof inverted=="number"){
            // see http://www.simplifyingtheory.com/chord-inversions/
            switch (inverted) {
                case 1: ch = [2]; break; // replace root w/third degree
                case 2: ch = [4]; break; // replace root w/fifth degree
                case 3: ch = [6]; break; // replace root w/seventh degree
                default: ch = [0]; // otherwise keep root as first degree
            }
        } else {
            ch = [0]
        }
        for (let degree = 0; degree < chord.length; degree++) {
            let steps = 0
            for (let s = 0; s <= degree; s++) steps += chord[s]
            ch.push(steps)
        }
        return ch
    }

    // -------------------------------------------------------------------------

    getChord(chord,inverted){
        chord = chord || this._chord
        return this.chord2stepsFromRoot(this.chords[chord],inverted)
    }

    getNoteChord(chord,root,inverted){
        chord = chord || this._chord
        let tonic = root ? new Note({root:root}) : this
        let ch = this.chord2stepsFromRoot(this.chords[chord],inverted)
        let noteStr = tonic.note + tonic.octave
        let noteArr = Object.keys(tonic.note2freq)
        let rootIdx = noteArr.indexOf(noteStr)

        let notes = []
        for (let i = 0; i < ch.length; i++) {
            let idx = rootIdx + ch[i]
            notes.push( noteArr[idx] )
        }
        return notes
    }

    getFreqChord(chord,root,inverted){
        chord = chord || this._chord
        let notes = this.getNoteChord(chord,root,inverted)
        let freqs = []
        for (let i = 0; i < notes.length; i++) {
            freqs.push( this.note2freq[notes[i]] )
        }
        return freqs
    }

    addChord(name,chordArr){
        if(!name) throw new Error('Chord: every chord needs a name')
        if(!chordArr) throw new Error('Chord: every chord needs an array, for '+
        'ex here\'s the "major" chord\'s array:'+this.chord.maj)
        this.chords[name] = chordArr
    }

}
