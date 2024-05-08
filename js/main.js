console.log("Hello World!!");

let songTimeline;

let promises = [
    d3.json("midis/BeethovenStringSeparate.json")
];

Promise.all(promises)
    .then(function (data) {
        createVis(data)
    })
    .catch(function (err) {
        console.log(err)
});

window.ticks = [0,2000];

function createVis(data) {
    songTimeline = new Timeline("songTimeline", data[0]);
    trackList = new trackSelector("trackList", data[0]);
    focusRegion = new ZoomedRegion("focusRegion", data[0], window.ticks, []);
}



// React to 'brushed' event and update arrow
function arrowBrushed(interval0, interval1) {
    let startEndIntervals = [interval0, interval1];

    // exits if page elements and data are not loaded
    if (!songTimeline || !startEndIntervals) return;

    songTimeline.arrow.updateVis(startEndIntervals);
}