/*
    adsr()
    -----------
    by Nick Briz <nbriz@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    this is a helper function that applies an ADSR (attack, decay, sustain,
    release) envelope to any WebAudio API AudioParm, for more info on ADSR
    check out: https://www.wikiaudio.org/adsr-envelope/

    -----------
       usage
    -----------

    adsr({
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

function adsr(o){
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
    param.linearRampToValueAtTime(peak, time+a)
    param.linearRampToValueAtTime(val, time+a+d)
    param.linearRampToValueAtTime(val, time+a+d+s)
    param.linearRampToValueAtTime(initVal, time+a+d+s+r)
}
