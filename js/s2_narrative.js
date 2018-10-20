
let interactions = {
    names:[],
    count:0,
    push:function(name){
        if(!this.names.includes(name)){
            this.count++
            this.names.push(name)
        }
    },
    readyToProgress:function(){
        if( this.names.includes('http-plane') && this.count > 3 ){
            return true
        } else {
            return false
        }
    }
}

function stopSelectingDaemon(){
    let idx = world.rayparams.names.indexOf('gateway-daemon')
    world.rayparams.names.splice(idx, 1)
}

const narrative = {
    'imap-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Oh hi! I'm carrying an IMAP packet, or",
                    "Internet Message Access Protocol, it's",
                    "what email apps use to communicate."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Oh! It looks like we've got the same",
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
                    {text:"ug, how embarrassing",goto:'no'}
                ]
            }
        ],
        'no':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "No need to be embarrassed! I think its",
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
                    "part! It's pretty much all cables in",
                    "tubes after this, so enjoy the ride!"
                ],
                after:function(name){ interactions.push(name) }
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
                    "HTTPS is a protocol for exchanging web",
                    "traffic over the Interent just like",
                    "HTTP, but with one crucial difference."
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
                after:function(name){ interactions.push(name) }
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
                    {text:"oh dear, that's embarrassing!",goto:'embarrased'}
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
                    "What are you looking at!? The data I'm",
                    "carrying is encrypted, so you couldn't",
                    "read it if you tried."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "I'm carrying an SSH packet, my user is",
                    "securely logged into another computer",
                    "over the SSH protocol."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Only his computer has the keys to",
                    "decrypt the communication. So there's",
                    "nothing to see here."

                ],
                after:function(name){ interactions.push(name) }
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
                after:function(name){ interactions.push(name) }
            }
        ]
    },
    'bc-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Hey there! I've got a bitcoin packet,",
                    "a bitcoin transaction of 0.0253456 BTC",
                    "to be specific."
                ],
                options:[
                    {text:"but isn't bitcoin anonymous?",goto:'anon'},
                ]
            }
        ],
        'anon':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "sort of, my user has a bitcoin wallet",
                    "with the address 3Mws...jEf5, and is",
                    "sending that 0.02 BTC to another user"
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "the recipient's address is 14oJ...ZFN2",
                    "so long as no one knows who controls",
                    "those wallets, then they're anonymous."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "So I've got no idea who this recipient",
                    "is, but I'll give you a clue about who",
                    "owns the sender address 3Mws...jEf5"
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "It's gotta be someone in this cafe,",
                    "otherwise I wouldn't be flying along",
                    "side you on our way to the router ;)"
                ],
                after:function(name){ interactions.push(name) }
            }
        ]
    },
    'bt-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Howdy! I've got a bittorrent packet.",
                    "It contains a tiny piece of a larger",
                    "file my user is sharing with others."
                ],
                options:[
                    {text:"cool! bittorrent is great!",goto:'great'},
                    {text:"wait, isn't that illegal?",goto:'illegal'},
                ]
            }
        ],
        'great':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "It sure is! It's my user's favorite",
                    "way to share large files! This way she",
                    "doesn't waste space on her cloud drive"
                ],
                after:function(name){ interactions.push(name) }
            }
        ],
        'illegal':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Of course not! The entire point of the",
                    "Internet is to connect computers so",
                    "that they can exchange data."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "And bittorrent is a great way to send",
                    "really large files or popular files.",
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "That's because the more people sharing",
                    "pieces of the same file, the faster it",
                    "can get pieced together by other users"
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Now, if someone shares a file that",
                    "doesn't belong to them, that could be",
                    "considered illegal."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "But you don't need bittorrent to share",
                    "something that isn't yours >:)"
                ],
                after:function(name){ interactions.push(name) }
            }
        ]
    },
    'ftp-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Oh no! Please don't look at the FTP",
                    "packet i'm carrying for my user (>_<)"
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "what's the use, everyone who looks at ",
                    "me can see it's not encrypted, might",
                    "as well show you too: PASS pizza1234"
                ],
                options:[
                    {text:"wait, is that a password?",goto:'pw'}
                ]
            }
        ],
        'pw':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "I'm ashamed to say that it is. My user",
                    "is logging onto his FTP server right",
                    "now, and everyone in the cafe can see."
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "I wish he'd start using SFTP, which is",
                    "encrypted... alas, he doesn't know",
                    "any better :("
                ],
                after:function(name){ interactions.push(name) }
            }
        ]
    },
    'dns-plane':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Hey DNS buddy! Looks like you and I",
                    "are both carrying DNS packets! Mine is",
                    "for duckduckgo.com, what's yours for?"
                ],
                options:[
                    {text:"Mine's for socialmedia.com",goto:'site'},
                    {text:"That's private!",goto:'private'}
                ]
            }
        ],
        'site':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Oh very cool! I guess that means we",
                    "both might end up at the same TLD",
                    "server, see ya there!"
                ],
                after:function(name){ interactions.push(name) }
            }
        ],
        'private':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "You might want it to be, but there is",
                    "no encryption on DNS requests, they're",
                    "out in the open for everyone to see!"
                ]
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Well, for now at least. Some users are",
                    "working on a new protocol, DNS over ",
                    "HTTPS. The Internet's always changing!"
                ],
                after:function(name){ interactions.push(name) }
            }
        ]
    },
    'gateway-daemon':{
        'start':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Welcome to the Gateway! I'm the daemon",
                    "in charge of managing all the packets",
                    "going in and out of this cafe."
                ],
                before:function(name,next){
                    stopSelectingDaemon()
                    daemon.swapPose(2)
                    daemon.float()
                    next()
                },
                after:function(){
                    daemon.swapPose(5)
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "This router you see behind me creates",
                    "a wireless access point for all the",
                    "users in the cafe to connect to."
                ],
                after:function(){
                    daemon.swapPose(2)
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Beyond this gateway lies the rest of",
                    "the Internet, please present me with",
                    "your destination IP address."
                ],
                options:[
                    {text:"It's 192.168.0.68",goto:'local'},
                    {text:"I don't have one",goto:'none'}
                ]
            }
        ],
        'local':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "That's not your destination IP address",
                    "that's your local IP address."
                ],
                before:function(name,next){
                    daemon.swapPose(6)
                    next()
                },
                after:function(){
                    daemon.swapPose(1)
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "I would know, I assigned that address",
                    "to your device when your user first",
                    "connected to this access point."
                ],
                options:[
                    {text:"oh, I don't know then.",goto:'none'}
                ]
            }
        ],
        'none':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "hmm, let me take a look at the payload",
                    "you are carrying..."
                ],
                before:function(name,next){
                    daemon.swapPose(0)
                    next()
                },
                after:function(){
                    daemon.swapPose(2)
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "...Ah! it appears you are carrying a",
                    "DNS request for socialmedia.com. You",
                    "must be early on in your journey."
                ],
                before:function(name,next){
                    daemon.checkPacket(2000)
                    setTimeout(next,2000)
                },
                after:function(){
                    daemon.swapPose(3)
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Not a problem, I will send you to the",
                    "ISP, they provide this cafe with",
                    "Internet access. But be warned!!!"
                ],
                after:function(){
                    daemon.swapPose(6)
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "The ISP for this cafe is owned by a",
                    "big cable company. Those never seem to",
                    "have the best intentions."
                ],
                after:function(){
                    daemon.swapPose(5)
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "They've been known to take advantage",
                    "of packets like yourself. When you",
                    "arrive head to their DNS Server."
                ],
                options:[
                    {text:"What's that?",goto:'dns'},
                    {text:"ok, got it!",goto:'gotit'}
                ],
                after:function(){
                    daemon.swapPose(2)
                }
            }
        ],
        'dns':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "DNS servers contain records for domain",
                    "names. The daemon there should be able",
                    "to find your destintion IP."
                ],
                after:function(){
                    daemon.swapPose(4)
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "Assuming of course they have a record",
                    "for socialmedia.com, which is where",
                    "you need to go."
                ],
                after:function(){
                    daemon.swapPose(3)
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "If the DNS daemon at the ISP doesn't",
                    "find the record you need, they'll know",
                    "where you can find it."
                ],
                options:[
                    {text:"ok, got it!",goto:'gotit'}
                ],
                after:function(){
                    daemon.swapPose(2)
                }
            }
        ],
        'gotit':[
            {
                text:[
                //  "--------------------------------------" length of 38 chars
                    "One last thing, take my IP address",
                    "with you to replace the local IP you",
                    "have been using in this cafe."
                ],
                after:function(){
                    daemon.swapPose(1)
                }
            },{
                text:[
                //  "--------------------------------------" length of 38 chars
                    "It's 73.211.67.245, you'll need it to",
                    "find your way back here once you have",
                    "resolved this DNS request. Good luck!"
                ],
                after:function(){
                    daemon.swapPose(6)
                    elevator.riseUp(()=>gotoScene(3))
                }
            }
        ]
    }
}
