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