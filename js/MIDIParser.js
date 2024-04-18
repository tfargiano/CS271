// Description: This file contains the code to parse MIDI files and process the data.
// Called by songTimeline.js to process the data and create the visualization.

// Function to process the data remains unchanged
function processMusicData(data) {
  const intervals = [];
  const intervalDuration = 2.5; // seconds

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
      endTime: (i + 1) * intervalDuration
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
        }
      }
    });
  });

  return intervals;
}