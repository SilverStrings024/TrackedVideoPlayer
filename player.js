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

import { Timer } from './timers';

/**
* TODO
*
*/
class PlayerManager{

    constructor(){
        this.stats;
        // Holds ids of each rendered player
        this.players = globalThis.players || [];
    }

    collectVideoInfo()
    {
        // Collect all the information possible
        var data = {}
        for ( let usedPlayer of globalThis.usedPlayers)
        {
            // produces {1: {'timeWatched': 2000, 'timeSeeked': 1000}, 2: {'progress': "50%", 'timeWatched': 10000}}
            data[usedPlayer.id] = usedPlayer.getStats()
        }
        return data
    }
}

/**
 * TODO
 *
 *
 ** Remove all project specific code
 *
 ** Only increment time in viewport if midpoint of the video is in view
 *
 ** Implement PlayerManager to stop videos when starting a different one
 *
 ** Implement the ability to define a "sendBeacon" method for users
 *
 ** Remove segments that skip forward then back to where they were
 * 
 ** Allow skipping ahead or back by 5 seconds via button or arrow key (don't forget to add the skip to the seeks Object)
 *
 ** Make volume buttons into a slider
 *
 ** Allow custom error message
 *
 ** Only record time in viewport only if the mid point of the video is in the viewport
 *
 * [OPTIONAL]
 ** Implement clip highlighting in the seek bar
 *
 ** Implement tracking for over amplification attempts (only needed if not using a slider for volume)
*/
export class VideoPlayer
{
    /** 
    * @param {String} src - The URL source of the video
    * @param {String} id - Auto generated or given player id
    */
    constructor(src, id)
    {
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
        this.timer = new Timer();
        this.seeks = {"pos": [], "neg": []};
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

            }
        }
    }

    initialize()
    {
        // This assumes that the player html has already been injected into the page.
        this.video = document.getElementById(this.id+"-video")
        this.progress = document.getElementById(this.id+"-progress");
        this.progressBar = document.getElementById(this.id+"-progress-bar");

        // Controls
        this.video.controls = false;
        this.controls = document.getElementById(this.id+"-video-controls")
        this.controls.style.display = "block";

        // Containers
        this.playerContainer = document.getElementById(this.id+"-player-container")
        this.videoContainer = document.getElementById(this.id+"-video-container");

        // Buttons
        this.fullScreenBtn = document.getElementById(this.id+"-full-screen");
        this.playPauseBtn = document.getElementById(this.id+"-play-pause");
        this.stop = document.getElementById(this.id+"-stop");
        this.muteBtn = document.getElementById(this.id+"-mute");
        this.volUp = document.getElementById(this.id+"-vol-up");
        this.volDown = document.getElementById(this.id+"-vol-dwn");
        // If we can't play the video, remove the player container and tell the
        // user that we can't play it. Maybe give them a link to the youtube video
        if (!this.video.canPlayType)
        {
            var failed = `<div id="unsupported-video">Unsupported video! You can find it <a class="text-blue-700" href="`+ this.src +`">here</a></div>`
            this.playerContainer.parentNode.appendChild(failed);
            this.playerContainer.parentNode.removeChild(this.playerContainer);
        }
        // Move on to binding all our events.
        this.bindEvents();
    }
    setFullscreenData(state) {
        this.playerContainer.setAttribute('data-fullscreen', !!state);
    }

    videoInViewport() {
        var elementHeight = element.offsetHeight;
        var elementWidth = element.offsetWidth;
        var bounding = element.getBoundingClientRect();
        if (
            bounding.top >= -elementHeight
            && bounding.left >= -elementWidth
            && bounding.right <= (window.innerWidth || document.documentElement.clientWidth) + elementWidth
            && bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) + elementHeight
            ){ return true; }
        return false;
    }

    handleFullScreen()
    {
        if (this.isFullScreen()) {
            if (document.exitFullscreen){
                document.exitFullscreen();
            }else if (document.mozCancelFullScreen){
                document.mozCancelFullScreen();
            }else if (document.webkitCancelFullScreen){
                document.webkitCancelFullScreen();
            }else if (document.msExitFullscreen){
                document.msExitFullscreen();
            }
            setFullscreenData(false);
         }
         else {
            if (videoContainer.requestFullscreen){
                videoContainer.requestFullscreen();
            }else if (videoContainer.mozRequestFullScreen){
                videoContainer.mozRequestFullScreen();
            }else if (videoContainer.webkitRequestFullScreen){
                videoContainer.webkitRequestFullScreen();
            }else if (videoContainer.msRequestFullscreen){
                videoContainer.msRequestFullscreen();
            }
            setFullscreenData(true);
         }
      }

    alterVolume(direction)
    {
        var currentVolume = Math.floor(this.video.volume * 10) / 10;
        if (direction === "+"){
            if (currentVolume < 1){
                this.video.volume += 0.1;
            }else{
                console.log("\n\nAttempted to go over max volume\n\n")
            }
        }
        else if (dir === "-"){
            if (currentVolume > 0){
                this.video.volume -= 0.1;
            }
        } else {
            throw new Error("Pass either + or - to alter the volume")
        }
    }

    pauseVideo()
    {
        this.playPauseBtn.innerHtml = "Play";
        this.timer.stop();
        this.video.pause();
        // Handle viewPort timer
        if (this.times['viewPort']['started'] > 0)
        {
            this.times['viewPort']['segments'].push({
                "startedAt": this.times['viewPort']['started'],
                "endedAt": this.timer.totalSeconds
            });
            this.times['viewPort']['started'] = 0;
        }
        // Handle mute timer
        if (this.times['muted']['started'] > 0)
        {
            this.times['muted']['segments'].push({
                "startedAt": this.times['muted']['started'],
                "endedAt": this.timer.totalSeconds
            });
            this.times['muted']['started'] = 0;
        }
        // Handle focus timer
    }

    playVideo()
    {
        // Reassign the innerHtml of the play-pause element to be "Pause"
        this.playPauseBtn.innerHtml = "Pause";
        this.timer.start();
        this.video.play();
        // Handle viewPort timer
        if (this.videoInViewport())
        {
            this.times['viewPort']['started'] = this.timer.totalSeconds;
        }

        // Handle mute timer
        if (this.video.muted)
        {
            this.times['muted']['started'] = this.timer.totalSeconds;
        }
        // Handle focus timer
    }

    muteVideo()
    {
        this.video.muted = !this.video.muted;
    }

    getStats()
    {
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
                    for (var i; ++i; i < this.times['viewPort']['segments'].length)
                    {
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
                    for (var i; ++i; i < this.times['muted']['segments'].length)
                    {
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
        for (var timeDicts of this.seeks['pos'])
        {
            posSeekTotal += timeDicts['endedAt'] - timeDicts['startedAt'];
            stats['seekInfo']['timesSeeked'] += 1;
            // Only track forward skips, not backwards.
            stats['seekInfo']['clips']['skipped'].push({
                "startedAt": timeDicts['startedAt'],
                "endedAt": timeDicts['endedAt'] 
            });
        }
        // Aggregate the negative seeks
        for (var timeDicts of this.seeks['neg'])
        {
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

    getHtml()
    {
        var html = `
        <div id="`+this.id+`-player-container">
            <!-- Video -->
            <figure id="`+ this.id + `-video-container">
                <video id="`+ this.id + `-video" controls preload="metadata" poster="img/poster.jpg">
                    <source src="`+ this.src +`" type="video/mp4">
                </video>
                <figcaption>&copy; Breakthrough Harvest PCG. Ottawa, Ohio | <a href="https://breakthroughharvest.com">breakthroughharvest.com</a></figcaption>
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

    /**
    * Bind all the events we need
    * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
    * @param {ParamDataTypeHere} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
    * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
    */
    bindEvents()
    {
        // Handle leaving the page
        window.onbeforeunload = function() {
            var csrfToken = document.getElementById("avcrftfsi").value;
            const analyticsUrl = "/analytics/record_video_stats/";
            var csrfData = {'csrfmiddlewaretoken': csrfToken, 'data': this.collectVideoInfo()}
            const data = JSON.stringify(csrfData);
            // We can use navigator.sendBeacon()
            if(getBrowser() != "IE")
            {
                if (info !== null || undefined || {})
                {
                    navigator.sendBeacon(
                        url=analyticsUrl,
                        data=data
                    );
                }
            }else{
                $.ajaxSetup({
                    beforeSend: function(xhr)
                    {
                        xhr.setRequestHeader('Csrf-Token', csrfToken);
                    }
                });
                $.ajax({
                    url: analyticsUrl,
                    data: data,
                    method: "POST",
                    success : function(){
                        console.log("")
                    },
                    error : function(){
                        console.log("Apparently there was an error...")
                    }
                });
            }
        }

        // Handle Play/Pause events
        this.playPauseBtn.addEventListener('click', function(e) {
            if (this.video.paused || this.video.ended){
                this.playVideo();
            } else {
                this.pauseVideo();
            }
        });
        // Handle the progress bar
        this.video.addEventListener('timeupdate', () => {
            if (!this.progress.getAttribute('max'))
            {
                this.progress.setAttribute('max', this.video.duration);
                this.progress.value = this.video.currentTime;
                this.progressBar.style.width = Math.floor((this.video.currentTime / this.video.duration) * 100) + "%";
            }
        });
        // Handle seeking

           //////////////////////////////////////////////////////////////////////////////////////////////////////
          //// WARNING: THIS DOES NOT ACCOUNT FOR DRAGGING THE PROGRESS BAR. Keep an eye on that as it may  ////
         ////                      cause an obscene amount of entries in the array!!!                      ////
        //////////////////////////////////////////////////////////////////////////////////////////////////////

        this.progress.addEventListener('click', function(e) {
            var rect = this.getBoundingClientRect();
            var pos = (e.pageX - rect.left) / this.offsetWidth;
            var seeked = {};
            // translates to [[5368, 75212]]
            seeked[this.video.currentTime] = pos;
            if (pos < 0)
            {
                this.seeks['neg'].push(seeked);
            }
            if (pos > 0)
            {
                this.seeks['pos'].push(seeked);
            }
            this.video.currentTime = pos * this.video.duration;
        })
        // Handle Fullscreen
        var fullScreenEnabled = !!(document.fullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled || document.webkitSupportsFullscreen || document.webkitFullscreenEnabled || document.createElement('video').webkitRequestFullScreen);
        if (!fullScreenEnabled){
            this.fullScreenBtn.style.display = "none";
        }
        this.fullScreenBtn.addEventListener('click', () => {
            this.handleFullScreen();
        })
        this.isFullScreen = function() {
            // document.requestFullscreen might be wrong. it used to be document.fullscreen
            return !!(document.requestFullscreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement);
         }
         document.addEventListener('fullscreenchange', function(e) {
            // document.requestFullscreen might be wrong. it used to be document.fullscreen
            setFullscreenData(!!(document.requestFullscreen || document.fullscreenElement));
         });
         document.addEventListener('webkitfullscreenchange', function() {
            setFullscreenData(!!document.webkitIsFullScreen);
         });
         document.addEventListener('mozfullscreenchange', function() {
            setFullscreenData(!!document.mozFullScreen);
         });
         document.addEventListener('msfullscreenchange', function() {
            setFullscreenData(!!document.msFullscreenElement);
         });

         // Handle ViewPort Tracking
         window.addEventListener('scroll', () => {
            this.handleViewPortTracking();
         })

         // Handle mute tracking
         this.muteBtn.addEventListener('click', () => {
             if (this.video.playing)
             {
                // Recording and not muted
                if (this.times['muted']['started'] > 0 && !this.video.muted)
                {
                    this.times['muted']['segments'].push({
                        "startedAt": this.times['muted']['started'],
                        'endedAt': this.timer.totalSeconds
                    });
                    this.times['muted']['started'] = 0;
                }
                else if (this.times['muted']['started'] === 0 && this.video.muted)
                {
                    // Not recording and muted
                    this.times['muted']['started'] = this.timer.totalSeconds;
                }
             }
             else
             {
                 // Not playing and recording (this shouldn't happen, pauseVideo should take care of this)
                 // I guess it's a fallback now.
                 if (this.times['muted']['started'] > 0)
                {
                    this.times['muted']['segments'].push({
                        "startedAt": this.times['muted']['started'],
                        'endedAt': this.timer.totalSeconds
                    });
                    this.times['muted']['started'] = 0;
                }
             }
        })
    }

    handleViewPortTracking()
    {
        var recordingStarted = this.times['viewPort']['started']
        if (this.video.playing)
        {
            // Is in view port and currently not recording time spent in it
            if (this.videoInViewport() && recordingStarted === 0)
            {
                this.times['viewPort']['started'] = this.timer.totalSeconds;
            }
            // Not in view port and we're currently recording time spent in it
            if (!this.videoInViewport() && recordingStarted > 0)
            {
                // Stop recording, push new sequence and set started to 0
                this.times['viewPort']['segments'].push({
                    "startedAt": started,
                    'endedAt': this.timer.totalSeconds
                });
                this.times['viewPort']['started'] = 0;
            }
        }
        // Not playing, shouldn't be recording but I guess it's a fallback now.
        else if (recordingStarted > 0)
        {
            this.times['viewPort']['segments'].push({
                "startedAt": recordingStarted,
                "endedAt": this.timer.totalSeconds
            });
            this.times['viewPort']['started'] = 0;
        }
    }

}

function injectPlayer(element, src, id=null)
{
    if (id === null)
    {
        id = element.id;
    }
    // Initialize the usedPlayers array if it isn't already
    if (globalThis.usedPlayers === undefined || globalThis.usedPlayers === null)
    {
        globalThis.usedPlayers = [];
    }
    var player = new VideoPlayer(src, id);
    // Remove the thumbnail
    element.removeChild(element.childNodes[0])
    // Replace the thumb nail with the video player
    element.appendChild(player.getHtml());
    player.initialize();
}
