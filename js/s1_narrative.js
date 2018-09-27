function sendHttpPacketBack(name){
    let mesh = world.scene.getChildByName(name)
    mesh.lookAt(new THREE.Vector3(0,15,-13))
    let rot = {x:mesh.rotation.x,y:mesh.rotation.y,z:mesh.rotation.z}
    mesh.lookAt(world.camera.position)
    new TWEEN.Tween(mesh.rotation).to(rot, 500)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onComplete(()=>{
        new TWEEN.Tween(mesh.position).to({z:-3}, 1500)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(()=>{ mesh.lookAt(new THREE.Vector3(0,15,-13)) })
        .start()
    }).start()
}

function bringHttpPacketToMe(name,next){
    let mesh = world.scene.getChildByName(name)
    if(mesh.position.z==-1){
        next()
        return
    }
    mesh.lookAt(world.camera.position)
    let rot = {x:mesh.rotation.x,y:mesh.rotation.y,z:mesh.rotation.z}
    mesh.lookAt(new THREE.Vector3(0,15,-13))
    new TWEEN.Tween(mesh.rotation).to(rot, 500)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onComplete(()=>{
        new TWEEN.Tween(mesh.position).to({z:-1}, 1500)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(()=>{
            let p = world.camera.position.clone()
            if(p.y==0) p.y = 1.6
            mesh.lookAt(p)
        })
        .onComplete(()=>{ next() }).start()
    }).start()
}

function takePlayer2Plane(){
    world.rayparams.names = [] // no more talking to characters
    let checkBoarding = setInterval(()=>{
        console.log('waiting...',plane.mesh.children.length)
        if(plane.mesh.children.length==2){
            clearInterval(checkBoarding)
            console.log('READY TO BOARD')
            // prepare camera && camera object (to offset position)
            let cam = world.scene.getChildByName('camera')
            let camObj = new THREE.Object3D()
            camObj.position.set(0,-1.2,-0.4)
            // remove daemon from scene && add to cart
            daemon.mesh.parent.remove( daemon.mesh )
            daemon.pushMesh.scale.set(0.15,0.15,0.15)
            dcart.mesh.add( daemon.pushMesh )
            // move cart/daemon to user
            dcart.moveTo(0.5, 2000, TWEEN.Easing.Quadratic.InOut)
            .then(()=>{ // move player to daemon cart
                world.scene.remove( cam )
                camObj.add( cam )
                dcart.mesh.add( camObj )
            })
            .then(()=>dcart.moveTo(1, 2000,TWEEN.Easing.Quadratic.InOut))
            .then(()=>{
                // move player to plane cart
                dcart.mesh.remove( camObj )
                cart.mesh.add( camObj )
                // move daemon back to scene
                dcart.mesh.remove( daemon.pushMesh )
                daemon.mesh.position.set(2,1.5,5)
                daemon.mesh.rotation.y = Math.PI/2
                world.scene.add( daemon.mesh )
            })
            .then(()=>cart.moveTo(1.0, 8000, TWEEN.Easing.Cubic.In))
            .catch(err => console.error(err))
            setTimeout(()=>{ location='part2.html' },12000)
        }
    },500)
}

const narrative = {
    'packet1':{
        'start':[
            {
                text:[
                    "Oh, hello there! I didn't notice",
                    "another packet standing behind us :)"
                ],
                options:[
                    {text:"what's a packet?",goto:'packet-is'},
                    {text:"what were you looking at?",goto:'user-is'},
                    {text:"can't talk, I'm on a mission!",goto:'end'}
                ],
                before:function(name,next){ bringHttpPacketToMe(name,next) },
                after:function(name,choice){
                    if(choice=="option3") sendHttpPacketBack(name)
                }
            }
        ],
        'packet-is':[
            {
                text:[
                    "You don't know?! You must be a new ",
                    "packet, how exciting!"
                ]
            },
            {
                text:[
                    "You and I, we're TCP/IP packets, we're",
                    "like tiny envelopes for the Internet."
                ]
            },
            {
                text:[
                    "Except instead of carrying letters we",
                    "carry bits of data for apps that need",
                    "to send stuff over the Internet."
                ]

            },
            {
                text:[
                    "I'm carrying HTTP data, for the User's",
                    "browser. Back there, Vint is carrying",
                    "IMAP data, for the User's email."
                ],
                options:[
                    {text:"what am I carrying?",goto:'my-payload'},
                    {text:"who's the User?",goto:'user-is'}
                ]
            }
        ],
        'my-payload':[
            {
                text:[
                    "Hmmm, looks like your payload is a DNS",
                    "request, maybe from the browser or one",
                    "of the User's social media apps."
                ]
            },
            {
                text:[
                    "You better hurry, there's nothing the",
                    "User hates more than slow Internet!",
                    "Turn around and get going!"
                ],
                options:[
                    {text:"who's this User you keep mentioning?",goto:'user-is'},
                    {text:"ok, I gotta go, thanks!",goto:'end'}
                ],
                after:function(name,choice){
                    if(choice=="option2") sendHttpPacketBack(name)
                }
            }
        ],
        'user-is':[
            {
                text:[
                    "The User! Our creator, she lives up",
                    "there in the sky, on the other side of",
                    "the screen. We exist to serve her!"
                ],
            },
            {
                text:[
                    "All the packets coming and going are",
                    "making requests for her or bringing",
                    "back responses from the Internet."
                ]
            },
            {
                text:[
                    "Speaking of which, you're a packet and",
                    "you're wasting precious milliseconds!",
                    "Turn around and get going!"
                ],
                after:function(name,choice){ sendHttpPacketBack(name) }
            }
        ],
    },
    'network-manager-daemon':{
        'start':[
            {
                text:[
                    "Hello dear. I imagine you might be a ",
                    "little disoriented right now. I can",
                    "help with that. :)"
                ],
                options:[
                    {text:"Who are you?",goto:'next'},
                    {text:"No Thanks",goto:'end'}
                ]
            },
            {
                text:[
                    "I'm the Network Manager Daemon, and my",
                    "job is to make sure all you packets",
                    "get to where you need to go."
                ],
                options:[
                    {text:"What do you mean 'you packets'?",goto:'you-packet'},
                    {text:"What's a daemon?",goto:'a-daemon'},
                    {text:"Where do I need to go?",goto:'where-to-go'}
                ]
            }
        ],
        'you-packet':[
            {
                text:[
                        "That's a perfectly reasonable question",
                        "for a brand new TCP/IP packet like",
                        "yourself :)",
                ]
            },
            {
                text:[
                    "When the User is on an app that uses",
                    "the Internet it creates small packages",
                    "each carrying a little bit of data.",
                ]
            },
            {
                text:[
                    "The type of data you're carrying is a",
                    "DNS request. Looks like the User has",
                    "launched a new networked app",
                ]
            },
            {
                text:[
                    "The app wants to send data to a site",
                    "called 'socialmedia.com' but we don't",
                    "know where on the Internet that is.",
                ]
            },
            {
                text:[
                    "That's where you come in. Take the",
                    "DNS request to the Domain Server which",
                    "lists all the IP addresses for .com's",
                ]
            },
            {
                text:[
                    "Then bring back the DNS response with",
                    "the IP address for the socialmedia.com",
                    "server.",
                ]
            },
            {
                text:[
                    "Once we have that IP address we can",
                    "make the HTTP requests needed to get",
                    "the rest of the data the User wants.",
                ],
                options:[
                    {text:"What's an IP address?",goto:'an-ip'},
                    {text:"What's a daemon?",goto:'a-daemon'},
                    {text:"Who's the User?",goto:'the-user'},
                    {text:"So where do I go then?",goto:'where-to-go'}
                ]
            }
        ],
        'the-user':[
            {
                text:[
                    "Just turn around and see for yourself.",
                    "We're inside her device, She lives out",
                    "there, on the other side of the screen"
                ],
                options:[
                    {text:"What's a daemon?",goto:'a-daemon'},
                    {text:"What's a packet?",goto:'you-packet'},
                    {text:"So where do I go then?",goto:'where-to-go'}
                ]
            }
        ],
        'a-daemon':[
            {
                text:[

                    "a daemon is a program that runs in the",
                    "background, behind all the other apps,",
                    "quietly getting random tasks done"
                ],
                options:[
                    {text:"What's a packet?",goto:'you-packet'},
                    {text:"So where do I go then?",goto:'where-to-go'}
                ]
            }
        ],
        'an-ip':[
            {
                text:[
                    "An IP address is just a number which",
                    "we network daemons use to find devices",
                    "connected to the Internet."
                ]
            },
            {
                text:[
                    "The Internet is made up of lots of",
                    "devices all connected to each other",
                    "all over the world."
                ],
                options:[
                    {text:"What's a daemon?",goto:'a-daemon'},
                    {text:"So where do I go then?",goto:'where-to-go'}
                ]
            }
        ],
        'where-to-go':[
            {
                text:[
                    "You need to find the IP address for",
                    "the website socialmedia.com as the app",
                    "the User has on requested."
                ]
            },
            {
                text:[
                    "You need to take one of these planes",
                    "and fly through the air over WiFi to",
                    "reach the Daemon at the Gateway."
                ],
                options:[
                    {text:"what's that number on the plane?",goto:'plane-number'},
                    {text:"who's the Daemon at the Gateway?",goto:'daemon-at-the-gateway'}
                ],
                after:function(){
                    // make sure packet from line doesn't mount next plane
                    looping = false
                }
            }
        ],
        'plane-number':[
            {
                text:[
                    "That's our local IP address. We're",
                    "inside the User's device which is",
                    "connected to a WiFi network."
                ]
            },
            {
                text:[
                    "every device on the WiFi Network has",
                    "a local IP address assigned to us by",
                    "the Daemon at the Gateway."
                ]
            },
            {
                text:[
                    "I send packets to that Daemon and he",
                    "sends them on their way to where ever",
                    "they need to go on the Internet"
                ],
                options:[
                    {text:"What's a packet?",goto:'you-packet'},
                    {text:"who's the Daemon at the Gateway?",goto:'daemon-at-the-gateway'}
                ]
            }
        ],
        'daemon-at-the-gateway':[
            {
                text:[
                    "He's the one who gives every device on",
                    "the WiFi network their local IP",
                    "address."
                ]
            },
            {
                text:[
                    "He lives inside the Gateway, a special",
                    "kind of device called a router which",
                    "connects us to the rest of the Net."
                ]
            },
            {
                text:[
                    "Speaking of which, we've taken up too",
                    "many milliseconds, there's nothing the",
                    "User hates more than slow Internet!"
                ]
            },
            {
                text:[
                    "We need to send you on your way! To",
                    "the Daemon at the Gateway, bring back",
                    "that DNS response as quick as you can!"
                ],
                after:function(name,choice){
                    takePlayer2Plane()
                }
            }
        ],
    }
}
