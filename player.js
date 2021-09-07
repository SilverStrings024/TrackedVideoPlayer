/**
* @file Video player that attempts to accurately record as many details about the video interaction as possible. Including but not limited to...
* 1. Amount of time the video stayed in viewport
* 2. Skipped and replayed 'clips' (a group of starting and ending times making up a clip. NOTE: this is in whole seconds)
* 3. Amount of time the video played while muted
* 4. The clips (same format as 2) when the video was in the viewport
* And more
* @author Matthew Amstutz <silverpython25@gmail.com>
* @copyright Matthew Amstutz 2021
*/

// Initialize the players array and manager if they don't already exist
window.onload(() => {
    globalThis.playerManager = globalThis.playerManager || new PlayerManager(channel = new BroadcastChannel("playerManager"));
})
window.onbeforeunload(() => {
    globalThis.playerManager.closeChannel();
})

/**
* TODO
*
** Put ViewPort tracking/checking in the manager instead of the player; record the mid point of the player in x/y and use
** the coords to determine if we need to remove the player.
*
** Generate a unique id on player creation
*
** Create method to dump stats and reinstate them on player destruction/reconstruction
*
** Implement broadcast channels to implement the next todo item
*
** Create handler that stops any currently playing video when the user wants to start a different one
*
** Implement "replaceWithThumbnail" to allow the ability to remove a rendered player, store its last position, then replace it with some thumbnail
** Note that, on click of the thumbnail that replaced the player, a new player is to be instantiated and started at the stored position
*
** Finish channel things
*
** Handle html injection
*/
class PlayerManager {

    // Require a channel
    constructor(channel) {
        this.channel = channel;
        this.channel.onmessage = this.receive(e);
        // Holds player ids, thumbnail src, elapsed time, and last known stats
        this.players = {};
        this.playing = [];
        this.stats;
        this.bindEvents();
    }

    collectVideoInfo() {
        // Collect all the information possible
        var data = {}
        for (let usedPlayer of this.players) {
            // produces {1: {'timeWatched': 2000, 'timeSeeked': 1000}, 2: {'progress': "50%", 'timeWatched': 10000}}
            data[usedPlayer.id] = usedPlayer.getStats();
        }
        return data
    }

    createPlayer(id = null) {
        if (id === null) {
            // generate a new id
        }
    }

    // Channel handling

    closeChannel() {
        this.channel.close();
    }

    send(message) {
        this.channel.postMessage(message);
    }

    receive(event) {
        const message = event.data
        if (message.indexOf("kill") !== -1) {
            // Kill whatever player
            const player = document.getElementById(message.split("-")[-1]);
            this.replaceWithThumbnail(player);
        }
        else if (message.indexOf('starting') !== -1) {
            // Stop any currently playing videos that don't have
            // the id of the player that's starting
        }
        else if (!message) {

        }

    }

    replaceWithThumbnail(player) {
        // Get the image from the player
        // Pause the player
        // Store the elapsed time (if it's less then the video length)
        // Destroy the player html
        // Replace the player with its thumbnail
    }

    injectVideo(parentElemId, src, videoId="") {
        // Add a new key to this.players and run cullPlayers;
        this.players[parentElemId] = {};
        this.cullPlayers();
        let player = new VideoPlayer(src=src, id=videoId);
        this.players[videoId] = {
            'object': player,
            'src': src,
            'parent': parentElemId,
            'id': videoId
        }
    }

    isInViewPort(playerElem) {
        var rect = playerElem.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    cullPlayers() {
        // Do we need to cull?
        if (Object(this.players).keys().length > this.maxPlayers){
            let mustCull = [];
            for (let player of this.players){
                const playerElem = document.getElementById(player.id);
                if(!this.isInViewPort(playerElem)){
                    player.object = null;
                    // Record info
                    // Destroy player html
                    // Remove reference to object
                    continue
                }
                mustCull.append(playerElem);

            }
            // If we still have more than the max, remove the oldest ones
        }
    }

    bindEvents() {
    }
}

/**
 * TODO
 *
 ** Put ViewPort tracking/checking in the manager instead of the player; record the mid point of the player in x/y and use
 ** the coords to determine if we need to remove the player.
 *
 ** Add thumbnail src with onclick event that replaces the thumbnail with the actual player then start the video right after replacing.
 *
 ** Remove all project specific code
 *
 ** Only increment time in viewport if midpoint of the video is in view
 *
 ** Implement PlayerManager to stop videos when starting a different one
 *
 ** Implement the ability to define a "sendBeacon" method for users
 *
 ** Remove segments that skip forward then back to where they were (essentially voiding the skip)
 * 
 ** Allow skipping ahead or back by 5 seconds via button or arrow key (don't forget to add the skip to the seeks Object)
 *
 ** Allow custom error message
 *
 ** Only record time in viewport only if the mid point of the video is in the viewport
 *
 * [OPTIONAL]
 ** Implement clip highlighting in the seek bar
 *
 ** Make volume buttons into a slider (NOTE: This could be useful for figuring out if your audience wants you to be louder)
 *
 ** Implement tracking for over amplification attempts (only needed if not using a slider for volume)
*/
export class VideoPlayer {
    /** 
    * @param {String} src - The URL source of the video
    * @param {String} id - Auto generated or given player id
    */
    constructor(src, id) {
        this.isInViewPort;
        this.completionPercentage;
        // Used to record where they "dropped the play head" from the start
        this.isFirstPlayClick = true;

        // HTML Elements
        this.playerContainer;
        this.videoContainer;
        this.video;
        this.controls;
        this.playPauseBtn;
        this.muteBtn;
        this.volUp;
        this.volDown;
        this.progress;
        this.progressBar;
        this.fullScreenBtn;

        this.src = src;
        this.id = id;
        this.coords;
        this.timer = new Timer();
        this.seeks = { "pos": [], "neg": [] };
        this.times = {
            // How long was the video in the viewport
            "viewPort": {
                // Total elapsed seconds on start
                "started": 0,
                "segments": []
            },
            // How long was the video muted
            'muted': {
                // Total elapsed seconds on start
                "started": 0,
                "segments": []
            },
            // How long was the video out of focus, playing and not muted
            'focus': {
                'started': 0,
                'segments': []
            }
        }
    }

    initialize() {
        // This assumes that the player html has already been injected into the page.
        this.video = document.getElementById(this.id + "-video")
        this.progress = document.getElementById(this.id + "-progress");
        this.progressBar = document.getElementById(this.id + "-progress-bar");

        // Controls
        this.video.controls = false;
        this.controls = document.getElementById(this.id + "-video-controls")
        this.controls.style.display = "block";

        // Containers
        this.playerContainer = document.getElementById(this.id + "-player-container")
        this.videoContainer = document.getElementById(this.id + "-video-container");

        // Buttons
        this.fullScreenBtn = document.getElementById(this.id + "-full-screen");
        this.playPauseBtn = document.getElementById(this.id + "-play-pause");
        this.stop = document.getElementById(this.id + "-stop");
        this.muteBtn = document.getElementById(this.id + "-mute");
        this.volUp = document.getElementById(this.id + "-vol-up");
        this.volDown = document.getElementById(this.id + "-vol-dwn");
        // If we can't play the video, remove the player container and tell the
        // user that we can't play it. Maybe give them a link to the youtube video
        if (!this.video.canPlayType) {
            var failed = `<div id="unsupported-video">Unsupported video! You can find it <a class="text-blue-700" href="` + this.src + `">here</a></div>`
            this.playerContainer.parentNode.appendChild(failed);
            this.playerContainer.parentNode.removeChild(this.playerContainer);
        }
        // Move on to binding all our events.
        this.bindEvents();
    }
    setFullscreenData(state) {
        this.playerContainer.setAttribute('data-fullscreen', !!state);
    }

    handleFullScreen() {
        if (this.isFullScreen()) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            setFullscreenData(false);
        }
        else {
            if (videoContainer.requestFullscreen) {
                videoContainer.requestFullscreen();
            } else if (videoContainer.mozRequestFullScreen) {
                videoContainer.mozRequestFullScreen();
            } else if (videoContainer.webkitRequestFullScreen) {
                videoContainer.webkitRequestFullScreen();
            } else if (videoContainer.msRequestFullscreen) {
                videoContainer.msRequestFullscreen();
            }
            setFullscreenData(true);
        }
    }

    alterVolume(direction) {
        var currentVolume = Math.floor(this.video.volume * 10) / 10;
        if (direction === "+") {
            if (currentVolume < 1) {
                this.video.volume += 0.1;
            } else {
                console.log("\n\nAttempted to go over max volume\n\n")
            }
        }
        else if (dir === "-") {
            if (currentVolume > 0) {
                this.video.volume -= 0.1;
            }
        } else {
            throw new Error("Pass either + or - to alter the volume")
        }
    }

    pauseVideo() {
        this.playPauseBtn.innerHtml = "Play";
        this.timer.stop();
        this.video.pause();
        // Handle viewPort timer
        if (this.times['viewPort']['started'] > 0) {
            this.times['viewPort']['segments'].push({
                "startedAt": this.times['viewPort']['started'],
                "endedAt": this.timer.totalSeconds
            });
            this.times['viewPort']['started'] = 0;
        }
        // Handle mute timer
        if (this.times['muted']['started'] > 0) {
            this.times['muted']['segments'].push({
                "startedAt": this.times['muted']['started'],
                "endedAt": this.timer.totalSeconds
            });
            this.times['muted']['started'] = 0;
        }
        // Handle focus timer
    }

    playVideo() {
        // Reassign the innerHtml of the play-pause element to be "Pause"
        this.playPauseBtn.innerHtml = "Pause";
        this.timer.start();
        this.video.play();
        // Handle viewPort timer
        if (this.videoInViewport()) {
            this.times['viewPort']['started'] = this.timer.totalSeconds;
        }

        // Handle mute timer
        if (this.video.muted) {
            this.times['muted']['started'] = this.timer.totalSeconds;
        }
        // Handle focus timer
    }

    muteVideo() {
        this.video.muted = !this.video.muted;
    }

    getStats() {
        // NOTE this does NOT account for if some one seeksforward then back to where they were
        // it might think they missed time but idk.
        const progress = Math.floor((this.timer.totalSeconds / this.video.duration) * 100)
        var stats = {
            "general": {
                'url': window.location.pathname,
                'totalTimeWatched': this.timer.totalSeconds,
                'formattedWatchTime': this.timer.getElapsed(),
                'progressPercentage': progress + "%",
                '': progress
            },
            'seek': {
                'timesSeeked': 0,
                'secondsSkipped': 0,
                // What gaps were skipped (120-350) translates to roughly (2:00-5:28)
                'clips': {
                    "skipped": [],
                    "replayed": []
                }
            },
            'viewPort': {
                "time": () => {
                    var timeInViewPort = 0;
                    for (var i; ++i; i < this.times['viewPort']['segments'].length) {
                        var currentEntry = this.times['viewPort']['segments'][i]
                        var difference = currentEntry['endedAt'] - currentEntry['startedAt']
                        timeInViewPort += difference
                    }
                    return timeInViewPort
                },
                "segmentsViewed": this.times['viewPort']['segments']
            },
            'mute': {
                "time": () => {
                    var timeMuted = 0;
                    for (var i; ++i; i < this.times['muted']['segments'].length) {
                        var currentEntry = this.times['muted']['segments'][i]
                        // 80 - 50 == 30 Sec
                        var difference = currentEntry['endedAt'] - currentEntry['startedAt']
                        timeMuted += difference
                    }
                    return timeMuted
                },
                "segmentsMuted": this.times['muted']['segments']
            },
        };


        // Handle seekInfo
        stats['timesSeeked'] = Object(this.seeks['pos']).keys().length + Object(this.seeks['neg']).keys().length;
        var posSeekTotal = 0;
        var negSeekTotal = 0;
        // Aggregate the positive seeks
        for (var timeDicts of this.seeks['pos']) {
            posSeekTotal += timeDicts['endedAt'] - timeDicts['startedAt'];
            stats['seekInfo']['timesSeeked'] += 1;
            // Only track forward skips, not backwards.
            stats['seekInfo']['clips']['skipped'].push({
                "startedAt": timeDicts['startedAt'],
                "endedAt": timeDicts['endedAt']
            });
        }
        // Aggregate the negative seeks
        for (var timeDicts of this.seeks['neg']) {
            negSeekTotal -= timeDicts['startedAt'] - timeDicts['endedAt']
            stats['seekInfo']['timesSeeked'] += 1
            stats['seekInfo']['clips']['replayed'].push({
                "startedAt": timeDicts['startedAt'],
                "endedAt": timeDicts['endedAt']
            });
        }
        // Record Total time skipped
        stats['seekInfo']['secondsSkipped'] = negSeekTotal + posSeekTotal
        // Record Total time replayed
        // Record Total time played

        return stats;
    }

    getHtml() {
        var html = `
        <div id="`+ this.id + `-player-container">
            <!-- Video -->
            <figure id="`+ this.id + `-video-container">
                <video id="`+ this.id + `-video" controls preload="metadata" poster="img/poster.jpg">
                    <source src="`+ this.src + `" type="video/mp4">
                </video>
            </figure>
            <!-- Controls -->
            <ul id="`+ this.id + `-video-controls" data-state="hidden">
                <li><button id="`+ this.id + `-play-pause" type="button" data-state="play">Play</button></li>
                <li><button id="`+ this.id + `-stop" type="button" data-state="stop">Stop</button></li>
                <li class="`+ this.id + `-progress">
                    <progress id="`+ this.id + `-progress" value="0" min="0">
                        <span id="`+ this.id + `-progress-bar"></span>
                    </progress>
                </li>
                <li><button id="`+ this.id + `-mute" type="button" data-state="mute">Mute/Unmute</button></li>
                <li><button id="`+ this.id + `-vol-up" type="button" data-state="volup">Vol+</button></li></li>
                <li><button id="`+ this.id + `-vol-dwn" type="button" data-state="voldown">Vol-</button></li>
                <li><button id="`+ this.id + `-full-screen" type="button" data-state="go-fullscreen">Fullscreen</button></li>
            </ul>
        <!-- End player-container -->
        </div>
        `
    }

    handleViewPortTracking() {
        var recordingStarted = this.times['viewPort']['started']
        if (this.video.playing) {
            // Is in view port and currently not recording time spent in it
            if (this.videoInViewport() && recordingStarted === 0) {
                this.times['viewPort']['started'] = this.timer.totalSeconds;
            }
            // Not in view port and we're currently recording time spent in it
            if (!this.videoInViewport() && recordingStarted > 0) {
                // Stop recording, push new sequence and set started to 0
                this.times['viewPort']['segments'].push({
                    "startedAt": started,
                    'endedAt': this.timer.totalSeconds
                });
                this.times['viewPort']['started'] = 0;
            }
        }
        // Not playing, shouldn't be recording but I guess it's a fallback now.
        else if (recordingStarted > 0) {
            this.times['viewPort']['segments'].push({
                "startedAt": recordingStarted,
                "endedAt": this.timer.totalSeconds
            });
            this.times['viewPort']['started'] = 0;
        }
    }

}



class Timer
{
    constructor()
    {
        this.runTimer;
        this.totalSeconds = 0;
        this.seconds = 0;
        this.minutes = 0;
        this.hours = 0;
        // If we get to this point, you may want to add an event listener to EVERYTHING
        // and if nothing is clicked, no scrolling, no mouse movement, you may want to log the person out
        this.days = 0;
    }

    start()
    {
        if (!this.isRunning)
        {
            this.isRunning = true;
            this.runTimer = setInterval(() => {
                // If we're paused, allow the interval to run
                    // Do we need to increment days? If we're here, something is seriously wrong
                    if (this.hours == 24)
                    {
                        this.hours = 0;
                        ++this.days;
                    }
                // Hours, maybe?
                    if (this.minutes == 60)
                    {
                        this.minutes = 0;
                        ++this.hours;
                    }
                // How about minutes?
                    if (this.seconds == 60)
                    {
                        this.seconds = 0;
                        ++this.minutes;
                    }
                    ++this.seconds;
                    ++this.totalSeconds;
                }, 1000
            );
        }
    }

    stop()
    {
        clearInterval(this.interval)
        return this.getElapsed()
    }

    /**
     * @returns Dictionary whose keys are times (hours, minutes, etc.) and keys are their values
     *          OR a string in the format of "5 Hours, 53 Minutes and 32 Seconds"
     */
    getElapsed(asString=true)
    {
        if (asString)
        {
            return this.hours+" Hours, "+this.minutes+" Minutes and "+this.seconds+" Seconds";
        }
        return {'days': this.days,'hours': this.hours, 'minutes': this.minutes, 'seconds': this.seconds}
    }

}