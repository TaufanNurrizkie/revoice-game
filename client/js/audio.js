// client/js/audio.js
// Synth Audio Engine for RE:VOICE (Retro 8-bit style)

window.AudioEngine = (function() {
  let ctx = null;
  let bgmOsc = null;
  let bgmGain = null;
  let isMuted = false;
  let initialized = false;
  let bgmInterval = null;

  const notes = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  };

  function init() {
    if (initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioContext();
      initialized = true;
      console.log('AudioEngine initialized');
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  function playTone(freq, type, duration, vol = 0.1, slideFreq = null) {
    if (!ctx || isMuted) return;
    
    // Resume context if suspended (browser auto-play policy)
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideFreq, ctx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(vol, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function playSequence(sequence) {
    if (!ctx || isMuted) return;
    if (ctx.state === 'suspended') ctx.resume();

    let time = ctx.currentTime;
    sequence.forEach(note => {
      if (note.freq > 0) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = note.type || 'square';
        osc.frequency.value = note.freq;
        
        gainNode.gain.setValueAtTime(note.vol || 0.1, time);
        gainNode.gain.linearRampToValueAtTime(0, time + note.duration - 0.05);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + note.duration);
      }
      time += note.duration;
    });
  }

  let stepAlternator = false;

  function play(sfx) {
    if (!initialized) init();

    switch (sfx) {
      case 'move':
        // Pac-Man "waka waka" style - alternating slide direction with louder volume
        if (stepAlternator) {
          playTone(400, 'triangle', 0.12, 0.15, 200); // "wa"
        } else {
          playTone(200, 'triangle', 0.12, 0.15, 400); // "ka"
        }
        stepAlternator = !stepAlternator;
        break;
      case 'pickup':
        // Classic coin / pickup sound
        playSequence([
          { freq: notes.B4, duration: 0.1, type: 'square', vol: 0.08 },
          { freq: notes.E5, duration: 0.3, type: 'square', vol: 0.08 }
        ]);
        break;
      case 'correct':
        // Happy ding ding
        playSequence([
          { freq: notes.C5, duration: 0.15, type: 'sine', vol: 0.15 },
          { freq: notes.E5, duration: 0.15, type: 'sine', vol: 0.15 },
          { freq: notes.G5, duration: 0.3, type: 'sine', vol: 0.15 }
        ]);
        break;
      case 'wrong':
        // Buzz / error
        playTone(150, 'sawtooth', 0.4, 0.2, 100);
        break;
      case 'complete':
        // Level complete fanfare
        playSequence([
          { freq: notes.G4, duration: 0.15, type: 'square', vol: 0.15 },
          { freq: notes.C5, duration: 0.15, type: 'square', vol: 0.15 },
          { freq: notes.E5, duration: 0.15, type: 'square', vol: 0.15 },
          { freq: notes.G5, duration: 0.4, type: 'square', vol: 0.15 },
          { freq: notes.E5, duration: 0.15, type: 'square', vol: 0.15 },
          { freq: notes.G5, duration: 0.6, type: 'square', vol: 0.15 }
        ]);
        break;
      case 'ghost':
        // Spooky wavering
        playSequence([
          { freq: 400, duration: 0.2, type: 'sine', vol: 0.15 },
          { freq: 350, duration: 0.2, type: 'sine', vol: 0.15 },
          { freq: 400, duration: 0.2, type: 'sine', vol: 0.15 },
          { freq: 300, duration: 0.4, type: 'sine', vol: 0.15 },
        ]);
        break;
    }
  }

  // Melodic looping BGM
  function startBGM() {
    if (!initialized) init();
    if (!ctx || isMuted || bgmInterval) return;

    // A simple, mysterious 8-bit melody loop
    const melody = [
      { freq: notes.A3, dur: 0.3 }, { freq: notes.E4, dur: 0.3 }, { freq: notes.A4, dur: 0.6 },
      { freq: notes.G4, dur: 0.3 }, { freq: notes.F4, dur: 0.3 }, { freq: notes.E4, dur: 0.6 },
      { freq: notes.D4, dur: 0.3 }, { freq: notes.F4, dur: 0.3 }, { freq: notes.A4, dur: 0.6 },
      { freq: notes.E4, dur: 0.6 }, { freq: 0, dur: 0.6 } // rest
    ];

    let noteIndex = 0;
    
    function playNextNote() {
      if (isMuted) return;
      const note = melody[noteIndex];
      if (note.freq > 0) {
        playTone(note.freq, 'square', note.dur * 0.8, 0.03); // very soft
      }
      
      noteIndex = (noteIndex + 1) % melody.length;
      bgmInterval = setTimeout(playNextNote, note.dur * 1000);
    }
    
    playNextNote();
  }

  function stopBGM() {
    if (bgmInterval) {
      clearTimeout(bgmInterval);
      bgmInterval = null;
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) stopBGM();
    else startBGM();
    return isMuted;
  }

  return { init, play, startBGM, stopBGM, toggleMute };
})();
