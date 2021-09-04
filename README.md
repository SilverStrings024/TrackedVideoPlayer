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