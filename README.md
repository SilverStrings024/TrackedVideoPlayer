## WARNINGS
[ **!!!IMPORTANT!!!** ] I'm new to JavaScript so, forgive me for any stupid mistakes or anything. I will be refining this as time goes on!

This player uses the `BroadcastChannel` web API which is **NOT** compatible with some browsers. [Refer to the compatibility chart](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API#browser_compatibility)<br/>
Also, pay very close attention to the "Where it will work" section of [this link](https://www.digitalocean.com/community/tutorials/js-broadcastchannel-api).

**This is NOT DONE** and has 0 optimizations. Unless you fix it yourself, I would highly recommend not using this in anything except personal/practice projects.

I'm still adapting this from a past project so there may be some left over project specific code.

This is a video player for tracking how long a user watches/plays a video.

### What it tracks
1. Amount of time the video stayed in viewport while playing
2. Skipped and replayed 'clips' **NOTE: these are in whole seconds as time stamps (so one minute would be stored as 60)**
3. The clips when the video was in the viewport
4. Amount of time the video played while muted
5. Total time in seconds that the video played
and more

This video player is fully self contained, records how long a person has watched a video as accurately as possible and comes with a timer :)

If you find a way to cheat the player please either submit a pull request or an issue and I will get to it asap!

## **Ignore everything from here down** - because this isn't done and this file is a WIP
# Contents
1. [QuickStart](#quickstart)<br/>
2. [Usage](#usage)<br/>
3. [Configuration](#configuration)<br/>
4. [How Things Work](#how-things-work)<br/>
    1. [Viewport Tracking](#viewport-tracking)<br/>
    2. [Focus Tracking](#focus-tracking)<br/>
    3. [Manager Communicaton](#manager-communication)<br/>
    4. [Player Culling](#player-culling)<br/>

# QuickStart
1. Clone the repo or add the following to your `<head>` tag `<script src="https://cdn.jsdelivr.net/gh/SilverStrings024/TrackedVideoPlayer/player.js"></script>`<br/>
2. [Configure the manager](#configuration) or use the defaults<br/>
3. Bind `window.playerManager.injectPlayer(this, <video source here>, <Optional video id here>, <start time in seconds here...defaults to 0>)` to the `onclick` event of whatever element is to be replaced with a player.<br/>
Make sure it works by loading up your page, clicking a few videos (be sure to click more than your set max to test culling), and making sure the controls work.<br/>
Note that it would be smart to make sure the managers can communicate by opening a new window/tab (in the same browser) and running the same test.<br/>
You **should** see that the managers will cull any videos outside of the viewport on each new injection and cull the oldest videos if there are more than the max amount of players in each windows viewport.<br/>

# Usage
[ **NOTE** ] This will attempt to replace the `innerHtml` of the parent node of whatever element holds the onclick that will inject the player, please account for this in your page source code.

To start, you'll need to do the normal thing and either clone the repo somewhere into your project then load player.js into your html

Alternatively, you can do the following in your head tag

Load the player - `<script src="https://cdn.jsdelivr.net/gh/SilverStrings024/TrackedVideoPlayer/player.js"></script>`

To actually use the script you'll need to add an onclick event to whatever element is to hold the video.<br/>


This onlick must call `window.playerManager.injectVideo(this, <src here>, <optional id here>)` whether in its own function or in the onclick attribute of your element.


We pass `this` so the player manager has access to the element (so it can inject the player as its child). You **can** pass an optional id that the player will use both in JS and in its HTML; this is mainly in case you're using something like Django where you may want to give an element an id of something like `{{video.name}}`.


If a video with that name already exists, a warning will be logged to the console a number will be appended to the id and the elements id **will be replaced with the new id** to ensure we never get more than one player on a DOM query. [**NOT IMPLEMENTED**]

You can provide a thumbnail for the video to display but if you don't the use will see an image of a black box with a play button on it. This is to prevent having a bunch of videos loaded into memory at the same time so this can also be used on lower end hardware (like TV boxes).<br/>
**NOTE:** a maximum of 3 videos will be loaded at the same time and the order in which they are removed (See [Auto Culling](#culling-videos)) follows FIFO.


## Culling Videos [**NOT IMPLEMENTED**]
To prevent a memory leak/too much consumption, the player manager will keep track of all rendered/injected video players. Each time a new video is injected, the Player Manager will check and see how many videos are currently loaded; if there will be more than 3 videos that would be loaded after injecting the new one, it will check if any videos are outside of the viewport. If any videos are indeed outside of the view port, then it will record the elapsed time of the player, destroy its html and all references to its object, then it will replace the html with the default "thumbnail" or the thumbnail you provided.<br/>

#### How about multiple windows?
Let's say the user opens 4 seperate windows and tries to have each window load a video.
In this case, the manager will notice that more than the default max amount of videos are in the viewport; it will then take the video that was loaded first and cull it. This means that the user **will** see the video get replaced with the thumbnail.
If you don't want that the user to see this happen, raise the max amount of videos that can be loaded at once but remember; the more videos that are loaded, the more memory will be used.
