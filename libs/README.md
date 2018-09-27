# NFO

This folder contains all the third party libraries (ie. the code we didn't write), including:

## Three.js
By far the most important dependency in this project is the amazing open-source [three.js](https://threejs.org/). We are forever indebted to [Mr.doob](https://github.com/mrdoob), [AlteredQualia](https://github.com/alteredq) && the other 1000+ contributors of this fantastic library. Many of the other dependencies in this folder (like the various controls and loaders) are also a part of the larger three.js ecosystem. It should be noted that one of these extra modules, `WebVR-edited.js` has (as the name implies) been edited by us to be a bit more aesthetically cohesive with the rest of the project.

## Tween.js
Another one of our favorite libraries is the infinitely useful [Tween.js](https://github.com/tweenjs/tween.js), this is used throughout the project to control various animations.

## DRACO
We're using [DRACO](https://google.github.io/draco/), a 3D compression library to compress all the 3D assets in this game (rather than sending massive objs in every scene)

## webvr-polyfill.js
This [polyfill](https://github.com/immersive-web/webvr-polyfill) by Google, is used for the Google Cardboard version of the game.

## StartAudioContext.js
On iOS you can't start a WebAudio API context without an excplicit user action, the [StartAudioContext.js](https://github.com/tambien/StartAudioContext) is a simple utility for handling this by the talented [Yotam Mann](https://yotammann.info/) (the brain's behind [Tone.js](https://tonejs.github.io/), a library we would have loved to use on this project if not for performance issues on slower devices)

## ToonMaterial.js
This is a slightly modified version of a [shader](http://www.realtimerendering.com/erich/udacity/exercises/unit3_toon_solution3.html) by Eric Haines, originally produced for a Udacity course online (at least that's what it seems, we stumbled upon this via duckduckgo)
