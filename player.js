/**
* @file Video player that attempts to accurately record as many details about the video interaction as possible. Including but not limited to...
* 1. Amount of time the video stayed in viewport
* 2. Skipped and replayed 'clips' (a group of starting and ending times making up a clip. NOTE: this is in whole seconds)
* 3. Amount of time the video played while muted
* 4. The clips (same format as 2) when the video was in the viewport
* And more
* @author Matthew Amstutz <silverpython25@gmail.com>
* @copyright Matthew Amstutz 2021
* @license MIT License
*/

// Initialize the players array and manager if they don't already exist
window.addEventListener('load', () => {
    window.playerManagerChannel = window.playerManagerChannel || new BroadcastChannel("playerManagers");
    window.playerManager = window.playerManager || new PlayerManager(channel=window.playerManagerChannel);
})
window.addEventListener('beforeunload', () => {
    window.playerManager.closeChannel();
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
        this.id = this.comms.generateId();
        this.channel = channel;
        this.channel.onmessage = (e) => {
            this.receive(e);
        };
        // Holds player ids, thumbnail src, elapsed time, and last known stats
        this.players = {};
        this.playing = [];
        this.stats;
        this.bindEvents();
    }

    collectVideoInfo() {
        // Collect all the information possible
        var data = {};
        for (let usedPlayer of this.players) {
            // produces {1: {'timeWatched': 2000, 'timeSeeked': 1000}, 2: {'progress': "50%", 'timeWatched': 10000}}
            data[usedPlayer.id] = usedPlayer.getStats();
        }
        return data;
    }

    createPlayer(id = null) {
        if (id === null) {
            // generate a new id
        }
    }

    getPlayer(playerId){
        if (this.players[playerId].object ?? "" !== ""){
            return this.players[playerId].object
        }
        else{
            throw new Error("ERROR: No player object was found with id "+playerId)
        }
    }

    // Channel handling
    closeChannel() {
        this.channel.close();
    }

    send(object) {
        // As there is only one manager per page,the event should fire
        // However, this needs tested to be 100% certain!

        object['manager'] = this.id;
        this.channel.postMessage(object);
    }


    /**
    * Example of incoming dictionary
    {
        "to": <0 or some manager id>,
        "from": <manager id>,
        "command": {
            "method": "cullPlayers",
            "args": [],
            "sendReturn": false,
        }
    }
    */

    /**
    * Handle a new message from the broadcast channel....Should this be 100% async?
    * @param {MessageEvent} event - The messageEvent fired by the manager broadcast channel
    * @returns {Integer} 0
    */
    receive(event) {
        const data = event.data;
        // Make sure it's for this (or all) manager(s)
        if (data.to == this.id || data.to == 0){
            // Receiving command execution request
            if (data?.command ?? "" !== ""){
                // Execute command and send response
                // This may cause an issue if some method doesn't take any args
                data.command.result = window.playerManager[data.command.method](...data.command.args);
                if (data.command.sendReturn){
                    data.to = data.from;
                    data.from = this.id;
                    console.log("DEBUG: Command "+data.command.method+" was executed by manager "+this.id+" with return"+ data.command.result +" as requested by manager "+data.from);
                    this.send(data);
                    return 0;
                }
                console.log("DEBUG: Command "+data.command.method+" was executed by manager "+this.id+" as requested by manager "+data.from);
            }
            else if (data?.starting ?? "" !== "") {
                // Stop any currently playing videos that don't have
                // the id of the player that's starting
                if (this.playing.length > 0){
                    for (let playerId of this.playing.length){
                        this.pauseVideo(playerId);
                    }
                }
            }
            else if (!message) {

            }
        }
        else{
            // Do nothing, the request isn't for this manager
            console.log("DEBUG: Message sent to manager "+data.to+" from manager "+data.from+". Manager "+this.id+" is ignoring it!");
        }
    }

    /**
    * Replace a players html with its thumbnail, dump all data related to it to its entry in this.players, then remove all references to it so it can be garbage collected
    * @param {VideoPlayer} player - The video player object to be replaced
    * @return No return
    */
    replaceWithThumbnail(player) {
        // Get the image from the player
        // Pause the player
        // Store the elapsed time (if it's less then the video length)
        // Destroy the player html
        // Replace the player with its thumbnail
    }

    injectPlayer(ogElem, src, videoId="", elapsed=0) {

        // Add a new key to this.players and run cullPlayers
        this.players[videoId] = {};
        this.cullPlayers();
        let player = new VideoPlayer(src, videoId);
        this.players[videoId] = {
            'object': player,
            'src': src,
            'ogElem': {},
            'id': videoId,
            'elapsed': elapsed,
            'added': new Date()
        }
        this.players[videoId].ogElem['id'] = ogElem.id;
        this.players[videoId].ogElem['tag'] = ogElem.tagName;
        this.players[videoId].ogElem['class'] = ogElem?.className ?? "";
        document.getElementById(ogElem.id).parentNode.innerHTML = player.getHtml();
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

    /**
    * Remove any players that are no longer needed.
    * NOTE: If a player is about to be started, it should be added to the players object. This method relies on that
    */
    cullPlayers() { // NOT DONE
        // Do we need to cull?
        if (Object.keys(this.players).length > this.maxPlayers){
            let mustCull = [];
            // Go through the players we have stored
            for (let player of this.players){
                const playerElem = document.getElementById(player.id);
                // Remove whatever isn't in the viewport
                if(!this.isInViewPort(playerElem)){
                    // Record info
                    const stats = player.getStats();
                    this.players[player.id]['stats'] = stats;
                    this.players[player.id]['elapsed'] = stats['elapsed'];
                    player.object = null;
                    // Destroy player html
                    this.replaceWithThumbnail(player);
                    continue;
                }
                // Record all videos that are in the viewport to check multiple windows
                mustCull.append(player);
            }
            // If we still have more than the max, remove the oldest ones
            if (mustCull.length > this.maxPlayers){
                // Sort in place then loop it
                for (let i; i++; i < mustCull.sort((a, b) => b.date - a.date).length){
                    if (mustCull.length > this.maxPlayers && mustCull[i].added < mustCull[i+1].added){
                        this.replaceWithThumbnail(mustCull[i].object);
                    }
                }
            }
        }
    }

    bindEvents() {
    }

    // Controls
    muteVideo(playerId) {
        const videoElem = this.getPlayer(playerId).videoElem;
        videoElem.muted = !video.muted;
    }

    alterVolume(playerId, direction){
        const videoElem = this.getPlayer(playerId).videoElem;
        var currentVolume = Math.floor(videoElem.volume * 10) / 10;
        if (direction === "+") {
            if (currentVolume < 1) {
                videoElem.volume += 0.1;
            } else {
                console.log("\n\nAttempted to go over max volume\n\n")
            }
        }
        else if (dir === "-") {
            if (currentVolume > 0) {
                videoElem.volume -= 0.1;
            }
        } else {
            throw new Error("Pass either + or - to alter the volume")
        }
    }

    playVideo(playerId) {
        const player = this.getPlayer(playerId);
        // Reassign the innerHtml of the play-pause element to be "Pause"
        player.playPauseBtnElem.innerHtml = "Pause";
        player.timer.start();
        player.videoElem.play();
        // Handle viewPort timer
        if (this.isInViewport(player.videoElem)) {
            player.times['viewPort']['started'] = player.timer.totalSeconds;
        }

        // Handle mute timer if it's muted when clicking play
        if (player.videoElem.muted) {
            player.times['muted']['started'] = player.timer.totalSeconds;
        }
        // Handle focus timer
    }

    pauseVideo(playerId)
    {
        const player = this.getPlayer(playerId);
        player.playPauseBtnElem.innerText = "Play";
        player.timer.stop();
        player.videoElem.pause();
        // Handle viewPort timer
        if (player.times['viewPort']['started'] > 0)
        {
            player.times['viewPort']['segments'].push({
                "startedAt": player.times['viewPort']['started'],
                "endedAt": player.timer.totalSeconds
            });
            player.times['viewPort']['started'] = 0;
        }
        // Handle mute timer
        if (player.times['muted']['started'] > 0)
        {
            player.times['muted']['segments'].push({
                "startedAt": player.times['muted']['started'],
                "endedAt": player.timer.totalSeconds
            });
            player.times['muted']['started'] = 0;
        }
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
class VideoPlayer {
    /** 
    * @param {String} src - The URL source of the video
    * @param {String} id - Auto generated or given player id
    */
    constructor(src, id, thumbnail="../defaultThumb.png") {
        this.thumbnail = thumbnail;
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
        this.videoElem = document.getElementById(this.id + "-video")
        this.progressElem = document.getElementById(this.id + "-progress");
        this.progressBarElem = document.getElementById(this.id + "-progress-bar");

        // Controls
        this.videoElem.controls = false;
        this.controlsElem = document.getElementById(this.id + "-video-controls")
        this.controlsElem.style.display = "block";

        // Containers
        this.playerContainer = document.getElementById(this.id + "-player-container")
        this.videoContainer = document.getElementById(this.id + "-video-container");

        // Buttons
        this.fullScreenBtnElem = document.getElementById(this.id + "-full-screen");
        this.playPauseBtnElem = document.getElementById(this.id + "-play-pause");
        this.stopElem = document.getElementById(this.id + "-stop");
        this.muteBtnElem = document.getElementById(this.id + "-mute");
        this.volUpElem = document.getElementById(this.id + "-vol-up");
        this.volDownElem = document.getElementById(this.id + "-vol-dwn");
        // If we can't play the video, remove the player container and tell the
        // user that we can't play it. Maybe give them a link to the youtube video
        if (!this.videoElem.canPlayType) {
            var failed = `<div id="unsupported-video">Unsupported video! You can find it <a class="text-blue-700" href="` + this.src + `">here</a></div>`
            this.playerContainer.parentNode.appendChild(failed);
            this.playerContainer.parentNode.removeChild(this.playerContainer);
        }
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
                <video id="`+ this.id + `-video" controls preload="metadata" poster="`+this.thumbnail+`">
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
                <li><button id="`+ this.id + `-vol-up" type="button" onclick='playerManager.alterVolume(`+ this.id +`, "+")' data-state="volup">Vol+</button></li></li>
                <li><button id="`+ this.id + `-vol-dwn" type="button" onclick='playerManager.alterVolume(`+ this.id +`, "-")' data-state="voldown">Vol-</button></li>
                <li><button id="`+ this.id + `-full-screen" type="button" data-state="go-fullscreen">Fullscreen</button></li>
            </ul>
        <!-- End player-container -->
        </div>
        `
        return html
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