// Assuming jsonData is the parsed JSON object from your JSON file
const jsonData = d3.json("data/Beethoven5_1.json");

// Function to process the data
function processMusicData(data) {
  const intervals = {};
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

  // Initialize intervals dictionary
  for (let i = 0; i < numberOfIntervals; i++) {
    intervals[i] = {};
    data.tracks.forEach(track => {
      intervals[i][track.name] = 0; // Initialize each instrument as not playing
    });
  }

  // Check each note to see if it plays in each interval
  data.tracks.forEach(track => {
    track.notes.forEach(note => {
      const startInterval = Math.floor(note.time / intervalDuration);
      const endInterval = Math.floor((note.time + note.duration) / intervalDuration);
      for (let i = startInterval; i <= endInterval; i++) {
        if (intervals[i]) {
          intervals[i][track.name] = 1; // Mark as playing
        }
      }
    });
  });

  return intervals;
}

// Call the function with the JSON data
const result = processMusicData(jsonData);
console.log(result);
