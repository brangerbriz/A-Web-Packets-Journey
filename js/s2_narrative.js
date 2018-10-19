
let interactions = 0

const narrative = {
    'dns-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Oh hi! Looks like we've got the same",
                    "IP address on our banner. You must be",
                    "coming from the same device as me :)"
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "You're that new packet right?"
                ],
                options:[
                    {text:"yes, how'd you know?",goto:'yes'},
                    {text:"psshh, I'm no noob!",goto:'no'}
                ]
            }
        ],
        'yes':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "I saw you looking all around back home",
                    "in our device. You looked pretty",
                    "confused back there (^_^)"
                ],
                options:[
                    {text:"ug, how embarassing",goto:'no'}
                ]
            }
        ],
        'no':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "No need to be embarrased! I think its",
                    "exciting to be exploring the Internet",
                    "for the first time!"
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "I guess that means this is your first",
                    "time flying over the electromagnetic",
                    "spectrum!"
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Flying through the air is my favorite",
                    "part! It's pretty much all cables",
                    "after this, so enjoy the ride!"
                ],
                after:function(){ interactions++ }
            }
        ]
    },
    'http-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Hello! I'm carrying an HTTP packet.",
                    "You wanna take a look?",
                ],
                options:[
                    {text:"what's an HTTP packet?",goto:'http'},
                    {text:"ok! show me",goto:'yes'},
                    {text:"that would be an invasion of privacy",goto:'no'}
                ]
            }
        ],
        'no':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "True, but if my user didn't want folks",
                    "snooping in on his traffic he shoulda",
                    "used HTTPS instead of HTTP ¯\\_(ツ)_/¯"
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "All the WiFi packets in this cafe are",
                    "literally traveling over the air. That",
                    "means anyone can listen to any of it."
                ],
                options:[
                    {text:"what's https?",goto:'https'},
                    {text:"hmmm,i guess.",goto:'yes'}
                ]
            }
        ],
        'http':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "the Hypertext Transfer Protocol, or",
                    "HTTP, packets carry web traffic, data",
                    "being sent to and from web servers."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "that could mean HTML files, JPGs, MP4s",
                    "or any other file on a website as",
                    "well as any data you post on a webpage"
                ],
                options:[
                    {text:"ok! show me",goto:'yes'},
                    {text:"that would be an invasion of privacy",goto:'no'}
                ]
            }
        ],
        'https':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "HTTPS is a protocol for exchaning web",
                    "traffic over the Interent just like",
                    "HTTP, but with one crucial differnece."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "HTTPS is encrypted, so if you tried to",
                    "read the data I was carrying it would",
                    "just look like nonsense."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Except for my user of course, he would",
                    "have a secret password on his browser",
                    "I'd establish with the server..."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "...but this server doesn't have any",
                    "end-to-end encryption set up, so it's",
                    "plain-text HTTP for him this time!"
                ],
                after:function(){ interactions++ }
            }
        ],
        'yes':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "POST / HTTP/1.1",
                    "Host: health-tips.com",
                    "Content-Type: application/x-www-form"
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Content-Length: 66",
                    "author=Nick&question=what_could_i_do_",
                    "to_stop_farting_all_the_time?"
                ],
                options:[
                    {text:"oh dear, that's embarassing!",goto:'embarrased'}
                ]
            }
        ],
        'embarrased':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "It sure is! Most users don't realize",
                    "that anything they do on a WiFi",
                    "network is floating through the air..."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "...and anyone on the same WiFi can see",
                    "it. Unless they're encrypting their",
                    "traffic of course, like with HTTPS."
                ],
                options:[
                    {text:"what's https?",goto:'https'},
                ]
            }
        ],
    },
    'ssh-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Hey there! I'm carrying an SSH packet.",
                    "My user is securly logged into another",
                    "computer over 'ssh'."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "You could try to take a look at my",
                    "payload, but because it's encrypted",
                    "it'll just look like gibberish to you."
                ],
                after:function(){ interactions++ }
            }
        ],
    },
    'irc-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Hey! I'm carrying an IRC packet, that",
                    "stands for Internet Relay Chat. It's",
                    "used by older chat apps."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Rare to see it these days, but my user",
                    "likes to kick it old-school (⌐■_■)"
                ],
                after:function(){ interactions++ }
            }
        ]
    },
    'voip-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "",
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "",
                ],
                after:function(){ interactions++ }
            }
        ]
    },
    'bt-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "",
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "",
                ],
                after:function(){ interactions++ }
            }
        ]
    },
    'ftp-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "",
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "",
                ],
                after:function(){ interactions++ }
            }
        ]
    },
    'imap-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "",
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "",
                ],
                after:function(){ interactions++ }
            }
        ]
    },
    'gateway-daemon':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Oh hello there!",
                ],
                before:function(name,next){
                    daemon.mesh.rotateX(-0.5)
                    daemon.swapPose(0)
                    next()
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Goodbye!",
                ],
                before:function(name,next){
                    daemon.swapPose(1)
                    next()
                }
            }
        ]
    }
}
