## WARNINGS
This player uses the `BroadcastChannel` web API which is **NOT** compatible with some browsers. [Refer to the compatibility chart](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API#browser_compatibility)<br/>
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

## **Ignore everything from here down**
### Usage
To start, you'll need to do the normal thing and place `<script src='/place/you/put/it/'></script>` wherever you like (I'm partial to the head tag).<br/>
To actually use the script you'll need to add an onclick event to whatever element is to hold the video.<br/>
This onlick must call `globalThis.playerManager.injectVideo(this, <src here>, <optional id here>)`.
We pass `this` so the player manager has access to the element (so it can inject the player as its child). You **can** pass an optional id that the player will use both in JS and in its HTML; this is mainly in case you're using something like Django where you may want to give an element an id of something like `{{video.name}}`.
If a video with that name already exists, a warning will be logged to the console a number will be appended to the id and the elements id **will be replaced with the new id** to ensure we never get more than one player on a DOM query. [**NOT IMPLEMENTED**]

You can provide a thumbnail for the video to display but if you don't the use will see an image of a black box with a play button on it. This is to prevent having a bunch of videos loaded into memory at the same time so this can also be used on lower end hardware (like TV boxes).<br/>
**NOTE:** a maximum of 3 videos will be loaded at the same time and the order in which they are removed (See [Auto Culling](#culling-videos)) follows FIFO.


### Culling Videos [**NOT IMPLEMENTED**]
To prevent a memory leak/too much consumption, the player manager will keep track of all rendered/injected video players. Each time a new video is injected, the Player Manager will check and see how many videos are currently loaded; if there will be more than 3 videos that would be loaded after injecting the new one, it will check if any videos are outside of the viewport. If any videos are indeed outside of the view port, then it will record the elapsed time of the player, destroy its html and all references to its object, then it will replace the html with the default "thumbnail" or the thumbnail you provided.<br/>

#### How about multiple windows?
Let's say the user opens 4 seperate windows and tries to have each window load a video.
In this case, the manager will notice that more than the default max amount of videos are in the viewport; it will then take the video that was loaded first and cull it. This means that the user **will** see the video get replaced with the thumbnail.
If you don't want that the user to see this happen, raise the max amount of videos that can be loaded at once but remember; the more videos that are loaded, the more memory will be used.
