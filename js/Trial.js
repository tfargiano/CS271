d3.json("Beethoven5_1.json").then(function(jsonData) {
  // Once the data is loaded, process it
  const result = processMusicData(jsonData);

  // Log or use the result here, inside the Promise resolution
  console.log(result);
}).catch(function(error) {
  // Handle any errors that occur during the loading process
  console.error("Error loading the JSON file:", error);
});

function processMusicData(data) {
  const intervals = [];
  const intervalDuration = 5; // seconds

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

  // Initialize intervals array with dictionaries for instrument activity
  for (let i = 0; i < numberOfIntervals; i++) {
    intervals.push({
      intervalId: i,
      instruments: {},
      startTime: i * intervalDuration,
      endTime: (i + 1) * intervalDuration
    });
    data.tracks.forEach(track => {
      if (track.instrument && track.instrument.name) {
        intervals[i].instruments[track.instrument.name] = 0; // Initialize each instrument as not playing
      }
    });
  }

  // Assign note activity to intervals
  data.tracks.forEach(track => {
    track.notes.forEach(note => {
      const startInterval = Math.floor(note.time / intervalDuration);
      const endInterval = Math.floor((note.time + note.duration) / intervalDuration);
      for (let i = startInterval; i <= endInterval; i++) {
        if (intervals[i] && track.instrument && track.instrument.name) {
          intervals[i].instruments[track.instrument.name] = 1; // Mark as playing
        }
      }
    });
  });

  return intervals;
}
