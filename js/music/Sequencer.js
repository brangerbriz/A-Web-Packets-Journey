/*
    Sequencer
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    The Web Audio API exposes access to the audio subsystemâ€™s hardware clock
    ( the â€œaudio clockâ€ via .currentTime ). This is used for precisely scheduling
    parameters and events, much more precise than the JavaScript clock ( ie.
    Date.now(), setTimeout() ). However, once scheduled audio parameters and
    events can not be modified ( ex. you canâ€™t change the tempo or pitch when
    something has already been scheduled... even if it hasn't started playing ).

    To solve this problem this helper class schedules AudioContext events just
    before you need them played by calling an update() method in an external JS
    clock loop ( setInterval(), requestAnimationFrame() ). It takes an
    AudioContext and a parameters object as arguments and creates a musical
    sequencer. It's based on Chris Wilsonâ€™s article, A Tale of Two Clocks:
    http://www.html5rocks.com/en/tutorials/audio/scheduling

    00-01-02-03-04-05-06-07-08-09-10-11-12-13-14-15- 16 discrete beats
    |--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|-- 16 sixteenth notes
    |-----|-----|-----|-----|-----|-----|-----|----- 8 eighth notes
    |-----------|-----------|-----------|----------- 4 quarter notes
    |-----------------------|----------------------- 2 half notes
    |----------------------------------------------- 1 whole note (bar/measure)


    -----------
       usage
    -----------
    const seq = new Sequencer( audioContext, {
        tempo: 140,            // optional, the beats per minute
        bars:4,                // optional, the amount of measures in the loop
        autoplay: true,        // optional, default is false
        scheduleAheadTime:0.1, // optional, see description below
        noteResolution:0,      // optional, see description below
        multitrack:true,       // optional, see description below
        whole: fn,             // optional, function to call every whole note
        half: fn,              // optional, function to call every half note
        quarter: fn,           // optional, function to call every quarter note
        eigth: fn,             // optional, function to call every eigth note
        sixteenth: fn          // optional, function to call every sixteenth
    })

    scheduleAheadTime: this is how far ahead (in seconds) to schedule the next
    beat. It's set to 0.1 by default but can be adjusted to find a sweeter spot.
    The smaller the quicker (better/tighter) the sequencer responds to changes
    (ex: updates to the .tempo property or calls to .toggle() ), but also the
    buggier and more demanding on resources.

    noteResolution: when set to 0 the Sequencer calls the scheduled functions on
    every 16th note. when set to 1 it will only play the 8th notes. when set to
    2 it will play only quarter notes.

    multitrack: when set to true it will play all the appropriate scheduled
    functions, when set to false it only plays the function of the least
    frequent timeing. So for ex: if you have a function schedule to fire every
    "whole" note and another for every "quarter" and multitrack is false, then
    it will play the quarter function only on beats 2, 3 and 4, exclusively
    playing the whole function on beat 1.

    toggle(): this public method is used to toggle the sequencer on/off. If
    called like .toggle('pause') then it pauses and picks up agian wherever it
    last left off in the sequece. If called without "pause" then it stops the
    sequence and picks back up at the beggining

    update(): this needs to be called in your own loop, conditionally checking for
    the play status, otherwise the sequencer doesn't play, for example:

    function loop(){
        requestAnimationFrame(loop)
        if(seq.isPlaying) seq.update()
    }

*/
class Sequencer {
    constructor(audioContext, params){
        // NOTE: WTF this throws an error in iOS >_< 
        // if( !(audioContext instanceof AudioContext) ){
        //     throw new Error('Sequencer: constructor requires you pass'+
        //     ' an AudioContext as it\'s first argument')
        // } else if( !params ){
        //     throw new Error('Sequencer: is pretty much useless without a'+
        //     ' parameters object as the second argument')
        // }

        this.ctx = audioContext

        this.isPlaying = (params.autoplay) ? params.autoplay : false
        this.tempo = (params.tempo) ? params.tempo : 120
        this.bars = (params.bars) ? params.bars : 1

        this.scheduleAheadTime = (params.scheduleAheadTime) ? // How far ahead
            params.scheduleAheadTime : 0.1 // to schedule, see link above.
        this.noteResolution     = (params.noteResolution) ? // 0, 1 or 2
            params.noteResolution : 0 // see _scheduleNote() for how its used.
        this.multitrack = (params.multitrack) ? // Whether or not to play more
            params.multitrack : true            // than one sample each beat.

        this.currentBar = 0
        this.current16thNote = 0 // last scheduled note
        this.nextNoteTime = 0.0 // when the next note is due (in ctx time)

        // scheduling functions
        if(params.whole) this.whole = params.whole
        if(params.half) this.half = params.half
        if(params.quarter) this.quarter = params.quarter
        if(params.eighth) this.eighth = params.eighth
        if(params.sixteenth) this.sixteenth = params.sixteenth
    }

    _scheduleNote(bn, t){
        // bn = beat number (current16thNote), t = scheduled time
        // if noteResolution is 1, don't play non-8th 16th notes
        if ( (this.noteResolution==1) && (bn%2) ) return
        // if noteResolution is 2, don't play non-quarter 8th notes
        if ( (this.noteResolution==2) && (bn%4) ) return
        // otherwise call the previously defined scheduling functions
        if(this.multitrack){ // schedule all appropriate functions
            if (bn === 0 && this.whole) this.whole(t)
            if (bn % 8 === 0&& this.half) this.half(t)
            if (bn % 4 === 0 && this.quarter) this.quarter(t)
            if (bn % 2 === 0 && this.eighth) this.eighth(t)
            if (this.sixteenth) this.sixteenth(t)
        } else { // schedule only one of the functions
            if (bn === 0 && this.whole ) this.whole(t)
            else if (bn % 8 === 0 && this.half) this.half(t)
            else if (bn % 4 === 0 && this.quarter) this.quarter(t)
            else if (bn % 2 === 0 && this.eighth) this.eighth(t)
            else if (typeof this.sixteenth) this.sixteenth(t)
        }
    }

    _nextNote(){
        let secondsPerBeat = 60.0 / this.tempo
        // Add beat length to last beat time
        this.nextNoteTime += 0.25 * secondsPerBeat
        // Advance the beat number...
        this.current16thNote++
        if(this.current16thNote == 16){ //...loop back to start
            this.current16thNote = 0
            this.currentBar++
            if(this.currentBar == this.bars) this.currentBar = 0
        }
    }

    update(){
        /*
        "This function just gets the current audio hardware time, and compares it
        against the time for the next note in the sequence - most of the time in
        this precise scenario this will do nothing (as there are no metronome
        â€œnotesâ€ waiting to be scheduled, but when it succeeds it will schedule
        that note using the Web Audio API, and advance to the next note."
                                                                  --Chris Wilson
        */
        while(this.nextNoteTime < this.ctx.currentTime+this.scheduleAheadTime){
            this._scheduleNote( this.current16thNote, this.nextNoteTime )
            this._nextNote()
        }
    }

    toggle( type ){
        this.isPlaying = !this.isPlaying
        if (this.isPlaying) { // start playing
            // if not 'paused' reset to beggining of sequence
            if(type!=="pause") this.current16thNote = 0
            this.nextNoteTime = this.ctx.currentTime
            this.update() // kick off scheduling
        }
    }
}
