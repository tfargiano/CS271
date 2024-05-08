// Description: This file contains the code to parse MIDI files and process the data.
// Called by songTimeline.js to process the data and create the visualization.
const intervalDuration = 1; 
const panningWeights = {
  "Flauti" : 2, "Oboi" : 2, "Clarinetti in Si b" : 2, "Fagotti" : 2, "Corni in Mi b" : 3,
  "Trombe in Do" : 2, "Timpani (Sol, Do)" : 1, "Violini I" : 3, "Violini II" : 2, "Viole" : 2, "pizzicato strings I" : 1,
  "Violoncelli" : 3, "pizzicato strings II" : 1, "Contrabassi" : 1, "pizzicato strings III" : 1
}
const panningValues = {
  "Flauti" : -0.4, "Oboi" : -0.2, "Clarinetti in Si b" : 0, "Fagotti" : 0.2, "Corni in Mi b" : -0.2,
  "Trombe in Do" : 0.2, "Timpani (Sol, Do)" : -0.2, "Violini I" : -0.85, "Violini II" : -0.6, "Viole" : 0, "pizzicato strings I" : 0,
  "Violoncelli" : 0.6, "pizzicato strings II" : 0, "Contrabassi" : 0.85, "pizzicato strings III" : 0
}

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
      stereoPanningSum: 0,
      stereoPanningDenom: 0,
      stereoPanningAvg: 0,
      startTime: i * intervalDuration,
      endTime: (i + 1) * intervalDuration,
      velocitySum: 0,
      velocityDenom: 0,
      velocityAvg: 0,
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

          let panningValue = panningValues[track.name];
          let panningWeight = panningWeights[track.name]; 
          intervals[i]["stereoPanningSum"] = intervals[i]["stereoPanningSum"] + calcStereoPan(panningValue, panningWeight);
          intervals[i]["stereoPanningDenom"] = intervals[i]["stereoPanningDenom"] + panningWeight;
        }
      }
    });
  });

  // Get average velocity in each interval
  for (let i = 0; i < numberOfIntervals; i++) {
    if (intervals[i]["velocityDenom"] > 0) { // Checks there are notes in interval (prevent div by 0)
      intervals[i]["velocityAvg"] = intervals[i]["velocitySum"] / intervals[i]["velocityDenom"];
    }
    // Don't need to explicitly write else clause; default is that velocityAvg = 0
    if (intervals[i]["stereoPanningDenom"] > 0) {
      intervals[i]["stereoPanningAvg"] = intervals[i]["stereoPanningSum"] / intervals[i]["stereoPanningDenom"];
    }
  }

  // update intervals to calculate ticks
  intervals.forEach(interval => {
    interval.startTick = calculateTicksFromTime(interval.startTime, tempos, ppq);
    interval.endTick = calculateTicksFromTime(interval.endTime, tempos, ppq);
  });

  return intervals;
}

function calcStereoPan(panningValue, panningWeight) {
  let angle = -90 + ((panningValue + 1) * 90);
  return angle * panningWeight;
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
