class trackSelector {
    constructor(parentElementId, data) {
        this.parentElement = document.getElementById(parentElementId);
        this.data = data;
        this.parentElement.innerHTML = "";
        this.tlist = [];
        this.renderTrackList();
    }

    renderTrackList() {
        const trackListContainer = document.getElementById("trackList");
        // Clear the container before adding track buttons
        trackListContainer.innerHTML = "";

        this.data.tracks.forEach(track => {
            if (track.name !== "pizzicato strings I" && track.name !== "pizzicato strings II" && track.name !== "pizzicato strings III") {
                const trackButton = document.createElement("button");
                trackButton.textContent = track.name;
                trackButton.classList.add("trackButton"); // Add common class
                trackButton.addEventListener("click", () => {
                    if (trackButton.classList.contains("deselected")) {
                        // If the button is deselected, remove 'deselected' class to select the track
                        // let focus = new ZoomedRegion("focusRegion", data[0], [0, 2000], []);
                        this.tlist = this.tlist.filter(item => item !== track.name)
                        trackButton.classList.remove("deselected");
                        console.log(this.tlist);

                    } else {
                        // If the button is selected, add 'deselected' class to deselect the track
                        this.tlist.push(track.name)
                        trackButton.classList.add("deselected");
                        console.log(this.tlist);
                    }
                    // this.toggleTrackButton(trackButton);
                });

                trackListContainer.appendChild(trackButton);
            }
        });
    }

    // toggleTrackButton(button) {
    //     if (button.classList.contains("deselected")) {
    //         // If the button is deselected, remove 'deselected' class to select the track
    //         // let focus = new ZoomedRegion("focusRegion", data[0], [0, 2000], []);
    //         this.tlist.push()
    //         button.classList.remove("deselected");
    //     } else {
    //         // If the button is selected, add 'deselected' class to deselect the track
    //         button.classList.add("deselected");
    //     }
    // }
}







// class trackSelector {
//     constructor(parentElementId, data) {
//         this.parentElement = document.getElementById(parentElementId);
//         this.data = data;
//         this.parentElement.innerHTML = "";
//         this.renderTrackList();
//     }
//
//     renderTrackList() {
//         const trackListContainer = document.getElementById("trackList");
//         // Clear the container before adding track buttons
//         trackListContainer.innerHTML = "";
//
//         this.data.tracks.forEach(track => {
//             const trackButton = document.createElement("button");
//             trackButton.textContent = track.name;
//             trackButton.addEventListener("click", () => {
//                 // trackListContainer.appendChild(trackButton);
//
//                 // console.log("Toggling track visibility: " + track.name);
//             });
//         });
//     }
// }
//
//
//
//
//



