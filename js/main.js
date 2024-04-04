console.log("Hello World");

let songTimeline;

// React to 'brushed' event and update all bar charts
// function brushed(date0, date1) {
//     // exits if page elements and data are not loaded
//     let brushRegion = [date0, date1];
//     for (let i = 0; i < configs.length; i++) {
//         barcharts[i].selectionChanged(brushRegion);
//     }
// }

function createVis(data) {
    songTimeline = new Timeline("songTimeline", 12345)
}