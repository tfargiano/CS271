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

function createVis(data) {
    songTimeline = new Timeline("songTimeline", data[0]);
}