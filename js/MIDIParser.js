// Description: This file contains the code to parse MIDI files and process the data.
// Called by songTimeline.js to process the data and create the visualization.
const intervalDuration = 1; 

// Function to process the data remains unchanged
function processMusicData(data) {
  let intervals = [];
  let tempos = data.header.tempos;
  // ensures tempos are sorted by ticks
  tempos.sort((a, b) => a.ticks - b.ticks);
  let ppq = data.header.ppq;

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
      velocityAvg: 0,
      stereoL: 0,
      stereoR: 0,
      startTick: 0,
      endTick: 0
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
  }

  // update intervals to calculate ticks
  intervals.forEach(interval => {
    interval.startTick = calculateTicksFromTime(interval.startTime, tempos, ppq);
    interval.endTick = calculateTicksFromTime(interval.endTime, tempos, ppq);
  });

  return intervals;
}

function calculateTicksFromTime(timeInSeconds, tempos, ppq) {
  let currentTicks = 0;
  let lastTimeInSeconds = 0;  // Start time in seconds
  let lastBPM = tempos[0].bpm;

  for (const tempo of tempos) {
      // Calculate the time in seconds at which this tempo change occurs
      const tempoChangeTimeInSeconds = lastTimeInSeconds + (tempo.ticks / (lastBPM / 60 * ppq));
      if (timeInSeconds < tempoChangeTimeInSeconds) {
          // Calculate ticks for the period up to the current time if it's before the tempo change
          currentTicks += (timeInSeconds - lastTimeInSeconds) * (lastBPM * ppq / 60);
          return currentTicks;
      }
      // Calculate ticks for the period up to the next tempo change
      currentTicks += (tempoChangeTimeInSeconds - lastTimeInSeconds) * (lastBPM * ppq / 60);
      lastTimeInSeconds = tempoChangeTimeInSeconds;
      lastBPM = tempo.bpm;
  }

  // Handle time after the last known tempo change
  if (timeInSeconds > lastTimeInSeconds) {
      currentTicks += (timeInSeconds - lastTimeInSeconds) * (lastBPM * ppq / 60);
  }

  return currentTicks;
}
