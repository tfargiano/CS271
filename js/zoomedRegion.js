class ZoomedRegion {
    constructor(parentElementId, data) {
        this.parentElement = document.getElementById(parentElementId);
        this.data = data;
        this.startTick = 7000;
        this.endTick = 8500;
        this.displayData = [];
        // console.log(this.data);
        this.initVis();
    }

    initVis() {
        this.vfRenderer = new Vex.Flow.Renderer(this.parentElement, Vex.Flow.Renderer.Backends.SVG);
        this.vfRenderer.resize(1200, 16000);
        this.context = this.vfRenderer.getContext();
        this.data.tracks.forEach((track, index) => {
            this.tracknum = index;
            this.prepareData();
            this.render();
        });
        // this.stave = new Vex.Flow.Stave(10, 40, 750);
        // this.stave.addClef("treble").addTimeSignature("2/4").setContext(this.context).draw();

    }

    prepareData() {
        let vis = this;

        const startMeasure = Math.floor(vis.startTick / vis.data.header.ppq / 2) * 2 * vis.data.header.ppq;
        const endMeasure = Math.ceil(vis.endTick / vis.data.header.ppq / 2) * 2 * vis.data.header.ppq;
        // console.log("Start M: " + startMeasure);
        // console.log("End M: " + endMeasure);

        // this.data.track.forEach(track)



        const track = this.data.tracks[this.tracknum];
        const notes = track.notes.filter(note => note.ticks >= startMeasure && note.ticks < endMeasure)
            .map(note => {
                let noteParts = note.name.match(/([A-G])(#|b)?(\d+)/);
                if (!noteParts) {
                    console.error("Invalid note format:", note.name);
                    return null;
                }
                let noteName = `${noteParts[1].toUpperCase()}${noteParts[2] || ""}/${noteParts[3]}`;
                console.log(note.ticks);
                return [new Vex.Flow.StaveNote({
                    keys: [noteName],
                    duration: vis.mapDuration(note.durationTicks, note.ticks)
                }), note.ticks];
            }).filter(n => n != null);

        this.displayData = notes;
        // console.log(notes)
    }

    mapDuration(durationTicks, noteStartTick) {
        const tempo = this.getTempoAtTick(noteStartTick);
        // console.log("Tempo: " + tempo);
        const quarterNoteTicks = this.data.header.ppq;
        const ticksPerSecond = quarterNoteTicks * tempo / 60;
        const durationInSeconds = durationTicks / ticksPerSecond;
        const quarterNotes = durationInSeconds * tempo / 60;

        if (quarterNotes >= 1) return "h";
        if (quarterNotes >= 0.5) return "q";
        if (quarterNotes >= 0.25) return "8";
        else return "8";
    }

    getTempoAtTick(tick) {
        let currentTempo = this.data.header.tempos[0].bpm; // default to the first tempo
        let tempo_index = 0;
        for (let tempo of this.data.header.tempos) {
            if (tempo.ticks > tick) break;
            tempo_index = tempo_index + 1;
            // currentTempo = tempo.bpm;
        }
        currentTempo = this.data.header.tempos[tempo_index - 1].bpm;
        return currentTempo;
    }


    render() {
        const measureLengthInTicks = this.data.header.ppq * 2; // Assuming 2/4 time
        let currentTick = Math.floor(this.startTick / measureLengthInTicks) * measureLengthInTicks;

        let staveX = 0; // X position for the first stave, slightly indented
        const staveWidth = 200; // Define stave width
        const staveSpacing = 0; // Spacing between staves
        let staveY = 50 + 100 * this.tracknum; // Start staves lower to avoid cutting off high notes
        let i = 0;


        while (currentTick < this.endTick) {
            let measureEndTick = currentTick + measureLengthInTicks;

            // Filter notes that start within the current measure
            let measureNotes = this.displayData.filter(note => note[1] >= currentTick && note[1] < measureEndTick);
            // console.log(measureNotes);
                // .map(note => note[0]); // Extract StaveNotes from tuples

            if (measureNotes.length === 0) {
                if (i < 1) {
                    let stave = new Vex.Flow.Stave(staveX, staveY, staveWidth + 50);
                    stave.addClef("treble").addTimeSignature("2/4").addKeySignature("Eb").setContext(this.context).draw();
                    let rest = new Vex.Flow.StaveNote({
                        keys: ["b/4"], // Position does not matter for rests
                        duration: "hr", // Half note rest
                        align_center: true
                    })
                    //     .addModifier(new Vex.Flow.GraceNoteGroup({
                    //     beams: false,
                    //     slash: false
                    // }), 0);
                    Vex.Flow.Formatter.FormatAndDraw(this.context, stave, [rest]);
                    staveX += staveWidth + 50 + staveSpacing;
                } else {
                    let stave = new Vex.Flow.Stave(staveX, staveY, staveWidth);
                    stave.setContext(this.context).draw();
                    let rest = new Vex.Flow.StaveNote({
                        keys: ["b/4"], // Position does not matter for rests
                        duration: "hr", // Half note rest
                        align_center: true
                    });
                    // }).addModifier(new Vex.Flow.GraceNoteGroup({
                    //     beams: false,
                    //     slash: false
                    // }), 0);
                    Vex.Flow.Formatter.FormatAndDraw(this.context, stave, [rest]);
                    staveX += staveWidth + staveSpacing;
                }


                // Add a half note rest

            }
            else {let notesByTick = {};
                measureNotes.forEach(note => {
                    if (!notesByTick[note[1]]) {
                        notesByTick[note[1]] = [];
                    }
                    notesByTick[note[1]].push(note[0]);
                });
                console.log(measureNotes);

                let startRest = measureNotes[0][1] - currentTick;
                let endRest = currentTick + measureLengthInTicks - measureNotes[measureNotes.length-1][1] - Math.round(measureNotes[measureNotes.length-1][0].ticks["numerator"]/21.3333333)
                console.log(measureNotes[measureNotes.length-1][0].ticks["numerator"])
                console.log(startRest)
                console.log(endRest)

                let measureNotesLow = [];
                let measureNotesHigh = [];

                if (startRest != 0) {
                    let rest = new Vex.Flow.StaveNote({
                        keys: ["b/4"], // Position does not matter for rests
                        duration: this.mapDuration(startRest/2, currentTick) + "r" // Half note rest
                        // align_center: true
                    });
                    measureNotesLow.push(rest);
                    measureNotesHigh.push(rest);
                }


                Object.keys(notesByTick).forEach(tick => {
                    let notes = notesByTick[tick];
                    if (notes.length > 1) {
                        notes[0].setStemDirection(Vex.Flow.StaveNote.STEM_DOWN);
                        notes[1].setStemDirection(Vex.Flow.StaveNote.STEM_UP);
                        measureNotesLow.push(notes[0]);
                        measureNotesHigh.push(notes[1]);
                    } else {
                        // Default to stem up if there's only one note at this tick
                        notes[0].setStemDirection(Vex.Flow.StaveNote.STEM_DOWN);
                        measureNotesLow.push(notes[0]);
                    }
                });
                // console.log(measureNotesLow);
                // console.log(measureNotesHigh);
                if (endRest > 0) {
                    let rest = new Vex.Flow.StaveNote({
                        keys: ["b/4"], // Position does not matter for rests
                        duration: this.mapDuration(endRest/2, currentTick) + "r" // Half note rest
                        // align_center: true
                    });
                    measureNotesLow.push(rest);
                    if (measureNotesHigh.length > 0) {
                        measureNotesHigh.push(rest);
                    }

                    // measureNotesHigh.push(rest);
                }



                if (measureNotesLow.length > 0) {
                    // Check if there's enough space to draw the next stave on the current line
                    if (staveX + staveWidth > this.vfRenderer.width) {
                        staveY += staveSpacing + 100; // Move down to the next line, add vertical space for stave
                        staveX = 0; // Reset X to start position with slight indent
                    }

                    // Create and draw the stave at the current position

                    if (i < 1) {
                        let stave = new Vex.Flow.Stave(staveX, staveY, staveWidth + 50);
                        stave.addClef("treble").addTimeSignature("2/4").addKeySignature("Eb").setContext(this.context).draw();
                        Vex.Flow.Formatter.FormatAndDraw(this.context, stave, measureNotesLow);
                        if (measureNotesHigh.length > 0) {
                            Vex.Flow.Formatter.FormatAndDraw(this.context, stave, measureNotesHigh);
                        }
                        staveX += staveWidth + 50 + staveSpacing;
                    } else {
                        let stave = new Vex.Flow.Stave(staveX, staveY, staveWidth);
                        stave.setContext(this.context).draw();
                        Vex.Flow.Formatter.FormatAndDraw(this.context, stave, measureNotesLow);
                        if (measureNotesHigh.length > 0) {
                            Vex.Flow.Formatter.FormatAndDraw(this.context, stave, measureNotesHigh);
                        }
                        staveX += staveWidth + staveSpacing;
                    }

                    // console.log(i);


                    // Layout and draw notes
                    // Add spacing after each stave
                }

            }

            i += 1;
            // console.log(i)
            currentTick += measureLengthInTicks; // Advance to the next measure
        }
    }
}











// OLD CODE

// render() {
//     // Assuming 2/4 time, where each measure has 2 beats and a quarter note gets one beat
//     let measureLengthInTicks = this.data.header.ppq * 2;
//     let currentTick = Math.floor(this.startTick / measureLengthInTicks) * measureLengthInTicks;
//
//     let first_stave = true;
//     let mC = 0;
//
//     while (currentTick < this.endTick) {
//         let measureEndTick = currentTick + measureLengthInTicks;
//
//         // Filter notes that start within the current measure
//         let measureNotes = this.displayData.filter(note =>
//             note[1] >= currentTick && note[1] < measureEndTick
//         );
//
//         console.log(`Measure starting at tick ${currentTick} has ${measureNotes.length} notes`);
//
//         // Gets filtered notes VexNote objects only
//         let measureNotes_VexNotes = [];
//         let notes_ticksVisited = []
//         if (measureNotes.length == 1) {
//             measureNotes_VexNotes.push(measureNotes[0][0]);
//         }
//         else {
//             let i = 0;
//             while (i < measureNotes.length) {
//                 if (measureNotes[i+1][1] == measureNotes[i][1]) {
//                     measureNotes[i][0].keys = "(" + measureNotes[i][0].keys + ", " + measureNotes[i+1][0].keys + ")"
//                     // console.log("Multi", measureNotes[i][0])
//                     measureNotes_VexNotes.push(measureNotes[i][0]);
//                     i += 2;
//
//                 } else {
//                     measureNotes_VexNotes.push(measureNotes[i][0]);
//                     i += 1;
//                     console.log("Extra", measureNotes_VexNotes)
//                 }
//             }
//         }
//         // console.log(measureNotes_VexNotes);
//
//
//
//
//         if (measureNotes.length > 0) {
//            /*
//             let voice = new Vex.Flow.Voice({
//                 num_beats: 2,  // This should match your time signature '2/4'
//                 beat_value: 4,
//                 resolution: Vex.Flow.RESOLUTION
//             }).setStrict(false);
//             */
//
//             // voice.addTickables(measureNotes_VexNotes);
//             // const formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], 700);
//             // voice.draw(this.context, this.stave);
//             let current_stave_x;
//             let current_stave_width;
//             if (first_stave) {
//                 first_stave = false;
//                 let current_stave = new Vex.Flow.Stave(0, 100, 300);
//                 current_stave.addClef("treble").addTimeSignature("2/4").setContext(this.context).draw();
//                 Vex.Flow.Formatter.FormatAndDraw(this.context, current_stave, measureNotes_VexNotes);
//                 console.log(measureNotes_VexNotes);
//                 // this.current_stave_x = current_stave.x;
//                 this.current_stave_height = current_stave.height;
//                 mC = mC + 1;
//             }
//             else
//             {
//                 let current_stave = new Vex.Flow.Stave(0, 100*mC + this.current_stave_height, 300);
//                 current_stave.setContext(this.context).draw();
//                 current_stave.addClef("treble").addTimeSignature("2/4").setContext(this.context).draw();
//                 Vex.Flow.Formatter.FormatAndDraw(this.context, current_stave, measureNotes_VexNotes);
//                 mC = mC + 1;
//             }
//         }
//
//         currentTick += measureLengthInTicks; // Advance to the next measure
//     }
// }