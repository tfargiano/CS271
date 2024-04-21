/*
 * Zoomed Region - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the MIDI dataset as a JSON, filtered by the brush - highlighted region in songTimeline
*/

class ZoomedRegion {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];

        console.log(this.data);
        this.initVis();
    }

    /*
     * Initialize visualization (e.g. XXX TO ADD XXX)
     */

    initVis() {
        let vis = this;

        // need to see result of console.log(this.data) to understand how to showcase
        // list of instrument names playing in each interval
    }
}