// Description: This file contains the code to parse MIDI files and process the data.
// Called by songTimeline.js to process the data and create the visualization.

// Function to process the data remains unchanged
function processMusicData(data) {
  const intervals = [];
  const intervalDuration = 1; // seconds

  // Determine the total duration of the piece
  let totalDuration = 0;
  data.tracks.forEach(track => {
    track.notes.forEach(note => {
      const noteEnd = note.time + note.duration;
      if (noteEnd > totalDuration) {
        totalDuration = noteEnd;
      }
    });
  });

  // Calculate how many intervals we have
  const numberOfIntervals = Math.ceil(totalDuration / intervalDuration);

  // Initialize intervals dictionary
  for (let i = 0; i < numberOfIntervals; i++) {
    intervals.push({
      intervalId: i,
      instruments: {},
      startTime: i * intervalDuration,
      endTime: (i + 1) * intervalDuration,
      velocitySum: 0,
      velocityDenom: 0,
      velocityAvg: 0
    });
    data.tracks.forEach(track => {
      intervals[i]["instruments"][track.name] = 0; // Initialize each instrument as not playing
    });
  }

  // Check each note to see if it plays in each interval
  data.tracks.forEach(track => {
    track.notes.forEach(note => {
      const startInterval = Math.floor(note.time / intervalDuration);
      const endInterval = Math.floor((note.time + note.duration) / intervalDuration);
      for (let i = startInterval; i <= endInterval; i++) {
        if (intervals[i]) {
          intervals[i]["instruments"][track.name] = 1; // Mark as playing
          intervals[i]["velocitySum"] = intervals[i]["velocitySum"] + note.velocity; // Sum note velocities in interval
          intervals[i]["velocityDenom"] = intervals[i]["velocityDenom"] + 1; // Count number of notes in interval
        }
      }
    });
  });

  // Get average velocity in each interval
  for (let i = 0; i < numberOfIntervals; i++) {
    if (intervals[i]["velocityDenom"] > 0) { // Checks there are notes in interval (prevent div by 0)
      intervals[i]["velocityAvg"] = intervals[i]["velocitySum"] / intervals[i]["velocityDenom"]
    }
    // Don't need to explicitly write else clause; default is that velocityAvg = 0
  }

  return intervals;
}