# WARNING
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

** Ignore everything from here down **
### Usage
To start, you'll need to do the normal thing and place `<script src='/place/you/put/it/'></script>` wherever you like (I'm partial to the head tag).
To actually use the script you'll need to add an onclick event to whatever element is to be replaced. This onlick must call `globalThis.playerManager.injectVideo(this, <src here>, <optional id here>)` .
We pass `this` so the player manager has access to the element (so it can inject the player as its child). You **can** pass an optional id; this is mainly in case you're using something like Django where you may want to give an element an id of something like `{{video.name}}`.
If a video with that name already exists, a warning will be logged to the console a number will be appended to the id and the elements id **will be replaced with the new id** to ensure we never get more than one player on a DOM query.

You can provide a thumbnail for the video to display but if you don't the use will see a basic black screen with a fake play button overlaid on it. This is to prevent having a bunch of videos loaded into memory at the same time.
**NOTE:** a maximum of 4 videos will be loaded at the same time and the order in which they are removed (See [Auto Culling](#culling-videos)) follows FIFO.


### Culling Videos
There's no reason to have a bunch of videos loaded at once so this will replace any loaded videos with the provided thumbnail or a black screen with a fake play button overlay