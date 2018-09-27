/*

    TrackCart
    -----------
    by Brannon Dorsey <bdorsey@brangerbriz.com> for brangerbriz.com
    GNU GPLv3 - https://www.gnu.org/licenses/gpl-3.0.txt
    2018

    -----------
       info
    -----------

    this class is used to move an object (or camera) along a given path
    references:
    - spline editor: https://threejs.org/examples/?q=spline#webgl_geometry_spline_editor
    - spline extrusion: https://threejs.org/examples/?q=spline#webgl_geometry_extrude_splines

    requires the following dependencies from /libs:
    - three.min.js
    - Tween.js

    -----------
       usage
    -----------
    let cart

    function timeout(millis) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, millis)
        })
    }

    function loop() {
        return cart.moveTo(Math.random(), 2000, true).then(loop)
    }

    //
    // in VRWorld setup
    //

    cart = new TrackCart(scene, [
        new THREE.Vector3(-100,100,100),
        new THREE.Vector3(-80,40,20),
        new THREE.Vector3(-35,2,5),
        new THREE.Vector3(3,0.58,5),
        new THREE.Vector3(35,2,5),
        new THREE.Vector3(80,40,20),
        new THREE.Vector3(100,100,100),
    ],true) // optionally visualize the path

    cart.mesh.add( some.mesh )

    // 1. wait 2 seconds
    // 2. place the camera on the front of the cart
    // 3. move the entire length of the track path in 8
    //    seconds using default Quadratic.InOut tweening
    // 4. wait 2 seconds
    // 5. move half way back in 2 seconds using Exponential easing
    // 6. wait 1 second
    // 7. move to random spots over 2 seconds in an infinite loop
    timeout(2000)
    .then(() => cart.addCamera(camera))
    .then(() => cart.moveTo(1.0, 8000, true))
    .then(() => timeout(2000))
    .then(() => cart.moveTo(0.5, 2000, TWEEN.Easing.Exponential.InOut))
    .then(() => timeout(1000))
    .then(loop)
    .catch(err => console.error(err))

    // .at(percent, callback[, repeat])
    cart.at(0.33, (percent, direction) => {
        console.log('at the 1/3rd part of the curve')
    }) // if the third "repeat" parameter is omitted or false
       // the event is only emitted the first time

    cart.at(0.66, (percent, direction) => {
        console.log('at the 2/3rd part of the curve')
    }, true) // <--- if the "repeat" param is true the callback
             // will fire everytime 0.66 is passed

    cart.at(0.99, (percent, direction) => {
        console.log('at the ~3/3rd part of the curve')
    }, 10) // <-- "repeat" param can also take a number of
           // times to repeat before the callback is unregistered

    timeout(6000)
    .then(() => console.log(`the current direction is ${cart.getDirection()}`))
    .then(() => {
        const p = cart.getPoint(0.5)
        console.log(`${x}, ${y}, ${z} lies exactly in the middle of the track`)
    })
    .then(() => {
        console.log(`here is the track path broken up in to 10 points:`)
        console.log(cart.getPoints(9))
    })

    //
    // in VRWorld draw loop
    //
    
    cart.update()

*/
class TrackCart {
    /**
     * @param  {THREE.scene} scene A THREE.js scene
     * @param  {THREE.Vector3[]} points An array of THREE.Vector3 objects used
     * to create a line path
     * @param  {boolean} [debug=false] An optional boolean indicating whether or
     * not to add visual line geometries to the scene which can be helpful to
     * visualize the path.
     * @throws Error if points array is not an array of THREE.Vector3 values
     * with at least length 2
     */
    constructor(scene, points, debug){

        /**
         * @property {THREE.Object3D} THREE.Object3D The TrackCart's mesh object.
         * The position and rotation of this mesh object are updated internally
         * with each call to update(). Child objects can be added to this mesh
         * directly to have them "travel" along with the TrackCart. The mesh's
         * position is set to the location of the first point during object construction.
         */
        this.mesh = new THREE.Object3D()
        /**
         * @property {THREE.Camera|null} null A camera that has been added to
         * the TrackCart's mesh and centered at it's origin using .addCamera().
         */
        this.camera = null
        this._tweening = false
        this._spline = null
        this._origCamPos = null
        this._origCamRot = null
        this._target = { percent: 0 }
        this._current = { percent: 0 }
        this._atCallbacks = new Map()

        this._tween = new TWEEN.Tween(this._current)
        this._tween.onUpdate(() => {

            // were any of the at(...) callbacks passed during the last update?
            this._atCallbacks.forEach((value, key) => {
                // debugger
                const dir = this.getDirection()
                let fire = false

                // if moving forward
                if (dir == 0) { // arrived
                   // not yet
                } else if (dir == 1) { // if moving forwards
                    if (this._current.percent >= key && value.flipFlop !== true) {
                        fire = true
                        value.flipFlop = true
                    }
                } else if (dir == -1) { // moving backwards
                    // console.log(this._currentPercent)
                    if (this._current.percent <= key && value.flipFlop !== false) {
                        fire = true
                        value.flipFlop = false
                    }
                }

                if (fire) {
                    value.callback(this._current.percent, dir)
                    if (value.repeat === false) this._atCallbacks.delete(key)
                    else if (typeof value.repeat === 'number') {
                        value.repeat = parseInt(value.repeat)
                        value.repeat--
                        if (value.repeat == 0) this._atCallbacks.delete(key)
                    }
                }
            })
        })

        this._setPoints(points)
        this.mesh.position.x = points[0].x
        this.mesh.position.y = points[0].y
        this.mesh.position.z = points[0].z
        scene.add(this.mesh)

        if (debug) {
            this._debugLineSmooth = createDebugLine(this._spline.getPoints(1000), 0x000000)
            scene.add(this._debugLineSmooth)

            this._debugLineSharp = createDebugLine(points, 0xff0000)
            scene.add(this._debugLineSharp)

            function createDebugLine(points, color) {
                let material = new THREE.LineBasicMaterial({
                    color: color,
                    linewidth: 5
                })
                let geometry = new THREE.Geometry()
                for(let i = 0; i < points.length; i++){
                    geometry.vertices.push(points[i])
                }
                return new THREE.Line(geometry, material)
            }
        }
    }

    /**
     * Add a THREE.js camera to the TrackCart. This method add's the camera
     * to the center of the TrackCart's mesh and sets it's y rotation to Math.PI.
     *
     * NOTE: This WILL MOVE THE CAMERA IN THE SCENE
     * @param  {Object} camera A THREE.js camera
     */
    addCamera(camera) {

        this._origCamPos = camera.position.clone()
        this._origCamRot = camera.rotation.clone()
        camera.position.set(0, 0, 0)
        // camera.position.set(0, 2, -10) // GOOD CAMERA POS FOR DEBUG!
        camera.rotation.y = Math.PI
        this.mesh.add(camera)
        this.camera = camera
    }
    /**
     * Remove a camera from the TrackCart's mesh and reset it's position
     * and rotation to wherever it was located before it was added to the
     * TrackCart with addCamera(camera).
     *
     * NOTE: This WILL MOVE THE CAMERA IN THE SCENE
     */
    removeCamera() {

        this.mesh.remove(this.camera)

        this.camera.position.x = this._origCamPos.x
        this.camera.position.y = this._origCamPos.y
        this.camera.position.z = this._origCamPos.z

        this.camera.rotation.x = this._origCamRot.x
        this.camera.rotation.y = this._origCamRot.y
        this.camera.rotation.z = this._origCamRot.z

        this.camera = null
        this._origCamPos = null
        this._origCamRot = null
    }

    /**
     * Rotate the TrackCart's mesh to face position.
     * Alias for TrackCart.mesh.lookAt(...)
     * @param  {THREE.Vector3} position A THREE.Vector3 to rotate the
     * TrackCart's mesh to look at
     */
    lookAt(position) {
        this.mesh.lookAt(position)
    }
    /**
     * Select a location on the track to start movement from with .moveTo().
     * NOTE: Cannot be called while cart is moving().
     * @param  {float} percent A location along the track path to start movement
     *  from, specified as a percentage. Values must be between 0.0 and 1.0 inclusive.
     * @throws An error if percent is not between 0.0 and 1.0 inclusive.
     * @throws An error if .moveTo() is in progress.
     */
    startFrom(percent) {
        this._errOnInvalidPercent(percent)
        if (this.moving()) {
            throw Error('startFrom() cannot be called while moveTo() is in progress.')
        }
        this._atCallbacks.forEach(val => val.flipFlop = null)
        this._current.percent = percent
    }

    // see here for a list of supported TWEEN.Easing functions:
    // https://tweenjs.github.io/tween.js/examples/03_graphs.html
    /**
     * Move to a location on the track path over a period of time. This method
     * starts moving the TrackCart immediately. The returned promise resolves upon
     * movement completion or is rejected if the movement is cancelled.
     * @param  {float} percent A location along the track to move to
     * @param  {number} time A value in milliseconds
     * @param  {boolean|TWEEN.Easing} [easing=TWEEN.Easing.Quadratic.InOut]
     * Indicates that easing should be during movement. Accepts a boolean or a
     * TWEEN.Easing object. See all TWEEN Easing functions here:
     * https://tweenjs.github.io/tween.js/examples/03_graphs.html
     * @returns {Promise} A promise that is fulfilled once the TrackCart
     * has arrived at the location specified by the percent parameter or rejected
     * if the moveTo() is cancelled with cancel()
     * @throws Rejects promise if percent is not between 0.0 and 1.0 inclusive.
     */
    moveTo(percent, time, easing) {
        return new Promise((resolve, reject) => {
            this._errOnInvalidPercent(percent)
            if (this.moving()) this.cancel() // cancel a current movement tween
            this._target.percent = percent
            this._tween.to({ percent }, time)
            if (easing === true) this._tween.easing(TWEEN.Easing.Quadratic.InOut)
            else if (typeof easing === 'function') this._tween.easing(easing)
            this._tween.onComplete(() => {
                this._tweening = false
                resolve()
            })
            this._tween._rejectBecauseCancel = reject
            this._tween.start()
            this._tweening = true
        })
    }

    // repeat value can be true, false, or a number of times to repeat. False by default
    /**
     * @param  {float} percent An approximate location along the path to fire
     * callback
     * @param  {atCallback} callback A callback function to fire when percent is
     * passed along the path.
     * @param  {boolean|number} [repeat=true]
     * @throws An error if percent is not between 0.0 and 1.0 inclusive
     * @throws An error if percent == 1.0 || percent == 0.0.
     * @throws An error if repeat is a number less than 2
     */
    at(percent, callback, repeat) {
        this._errOnInvalidPercent(percent)
        if (percent == 1 || percent == 0) {
            throw Error(
                '.at(...) doesn\'t work correctly with values 1.0 or 0.0. '+
                'Use the promise returned from .moveTo(0.0) or .moveTo(1.0) instead.'
            )
        }

        if (typeof repeat === 'number' && parseInt(repeat) < 1) {
            throw Error('If repeat param is a number type it must be greater than 1')
        }

        if (this._atCallbacks.has(percent)) {
            console.warn(`TrackCart.at(): overwriting existing ${percent} callback`)
        } else {
            this._atCallbacks.set(percent, {
                repeat: repeat || false,
                callback: callback,
                flipFlop: null // true == forward, false == backwards
            })
        }
    }

    /**
     * @callback TrackCart::atCallback
     * @param {float} percent The real percentage value of the TrackCart
     * allong it's current path. The percentage value specified to .at()
     * is only an approximate.
     * @param {number} direction The direction the TrackCart is traveling
     * along the path (1 == forward and -1 == backward).
     */

    /** Cancel the cart's current moveTo, causing the promise it returend to
     * be rejected.
     */
    cancel() {
        this._tween.stop()
        this._tweening = false
        if (typeof this._tween._rejectBecauseCancel == 'function') {
            this._tween._rejectBecauseCancel(Error('moveTo() event cancelled'))
            this._tween._rejectBecauseCancel = undefined
        }
    }

    /**
     * Check if the cart is currently moving as a result of a moveTo() call
     * @returns {boolean} True if the cart is moving
     */
    moving() {
        return this._tweening
    }

    /** Update's the position and rotation of the TrackCart's mesh
    */
    update(){
        const pos = this._spline.getPoint(this._current.percent)
        this.mesh.position.x = pos.x
        this.mesh.position.y = pos.y
        this.mesh.position.z = pos.z

        if (this._current.percent < 1) {
            const d = 0.0001 // delta, or sensitivity (think d in derivative equation)
            this.lookAt(this._spline.getPoint(Math.min(1, this._current.percent + d)))
        }
    }

    /** Get the current direction being traveled along the path as specified by
     * .moveTo()
     * @returns {boolean} 1 == forward, 0 == still, -1 == backward
     */
    getDirection() {
       if (this._current.percent === this._target.percent) return 0
       else if (this._current.percent < this._target.percent) return 1
       else return -1
    }

    /**
     * @param  {float} percent The location along the track path of the point
     * specified as a percentage
     * @returns {THREE.Vector3} The point along the track path specified by percent
     * @throws Error if percent is not between 0.0 and 1.0 inclusive
     */
    getPoint(percent) {
        this._errOnInvalidPercent(percent)
        return this._spline.getPoint(percent)
    }

    /** Get an array of THREE.Vector3 points that lie evenly along the track path
     * @param  {number} numDivisions The number of lines to subdivide the track \
     * path into (NOTE: will return numDivisions + 1 points)
     * @returns {THREE.Vector3[]} An array of THREE.Vector3 objects with length
     *  equal to numDivisions + 1
     */
    getPoints(numDivisions) {
        return this._spline.getPoints(numDivisions)
    }

    _isPointsArray(points) {
        return points &&
               points.constructor === Array &&
               points.length > 1 &&
               points[0] instanceof THREE.Vector3
    }

    _setPoints(points) {
        if (!this._isPointsArray(points)) {
            throw Error('points parameter must be an array of at least two THREE.Vector3 values')
        }
        this._spline = new THREE.SplineCurve3(points)
    }

    _errOnInvalidPercent(percent) {
        if (typeof percent === 'undefined' || percent < 0.0 || percent > 1.0) {
            throw Error('percent parameter must be a value between 0.0 and 1.0 inclusive, not ', percent)
        }
    }
}
