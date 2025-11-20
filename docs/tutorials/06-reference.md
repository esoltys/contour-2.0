# Tutorial Part 6: Reference

Quick reference guide and comparisons with other music coding tools.

**Previous:** [Part 5: Advanced](05-advanced.md)

---

## What's Next?

You've learned:
- ✅ Creating patterns with PatternBuilder and mini-notation
- ✅ Transforming patterns (transpose, fast, slow, retrograde)
- ✅ Pattern algebra (stack, append, palindrome)
- ✅ Euclidean rhythms for algorithmic composition
- ✅ Building multi-track compositions
- ✅ Exporting to MIDI and audio
- ✅ Live coding and performance
- ✅ Advanced algorithmic techniques

---

## Quick Reference

### Common Patterns

```typescript
// Basic pattern creation
pattern().fromNotation('C4 E4 G4').build()

// Transformations
.transpose(5)      // Up 5 semitones
.fast(2)           // Double speed
.slow(2)           // Half speed
.retrograde()      // Reverse
.palindrome()      // Forward + reverse

// Combinations
.stack(otherPattern)   // Simultaneous
.append(otherPattern)  // Sequential

// Conditional
.every(4, p => p.retrograde())

// Euclidean
Pattern.euclidean(steps, pulses, rotation)
```

### Mini-Notation Syntax

```
C4 E4 G4         Notes
C4*4             Repetition
~                Rest
[E4 G4]          Subdivision
C4@2             Longer duration
Cmaj7            Chord symbol
```

### Common Imports

```typescript
import {
  pattern,
  Pattern,
  Voice,
  Track,
  Composition,
  BPM,
  Durations,
  C, D, E, F, G, A, B,
  Cs, Eb, Fs  // Sharps and flats
} from '@contour/core';

import { MIDIRenderer } from '@contour/plugin-midi';
```


---

## Coming From Other Tools

If you've used other music coding tools, this section will help you understand Contour in terms you already know.

### Coming from TidalCycles / Strudel

Contour is heavily inspired by TidalCycles! Here's how concepts map:

**Pattern Creation:**
```haskell
-- TidalCycles
d1 $ sound "bd sn bd sn"

-- Contour
pattern().fromNotation('C2 D2 C2 D2').build()
```

**Pattern Transformations:**
```haskell
-- TidalCycles
d1 $ fast 2 $ sound "bd sn"
d1 $ slow 2 $ sound "bd sn"
d1 $ rev $ sound "bd sn hh cp"

-- Contour
pattern().fromNotation('C2 D2').build().fast(2)
pattern().fromNotation('C2 D2').build().slow(2)
pattern().fromNotation('C2 D2 E2 F2').build().retrograde()
```

**Euclidean Rhythms:**
```haskell
-- TidalCycles
d1 $ euclid 5 16 $ sound "bd"

-- Contour
Pattern.euclidean(16, 5).transpose(36)  // C2
```

**Pattern Algebra:**
```haskell
-- TidalCycles
d1 $ stack [sound "bd*4", sound "hh*8"]
d1 $ cat [sound "bd", sound "sn"]

-- Contour
kick.stack(hihat)
pattern1.append(pattern2)
```

**Every N Cycles:**
```haskell
-- TidalCycles
d1 $ every 4 rev $ sound "bd sn hh cp"

-- Contour
pattern().fromNotation('C2 D2 E2 F2')
  .build()
  .every(4, p => p.retrograde())
```

**Key Differences:**
- Contour is TypeScript (type-safe at compile time)
- No sample playback yet (synths only)
- Explicit composition structure (Track/Voice/Pattern hierarchy)
- MIDI export built-in
- Hot-reload via Vite instead of ghci

**What's Familiar:**
- ✅ Mini-notation syntax
- ✅ Pattern transformations (fast, slow, rev)
- ✅ Euclidean rhythms
- ✅ Pattern stacking and sequencing
- ✅ Live coding workflow

### Coming from Sonic Pi

Sonic Pi users will find Contour more functional and less imperative, but many concepts translate:

**Playing Notes:**
```ruby
# Sonic Pi
play 60
sleep 1
play 64
sleep 1

# Contour (declarative instead of imperative)
pattern().fromNotation('C4 E4').build()
```

**Looping:**
```ruby
# Sonic Pi
live_loop :melody do
  play 60
  sleep 0.5
end

# Contour (patterns loop automatically)
const melody = pattern().fromNotation('C4').build();
// Pattern loops by default in playback
```

**Scales:**
```ruby
# Sonic Pi
play_pattern_timed scale(:c, :major), 0.5

# Contour
pattern().fromNotation('C4 D E F G A B C5').build()
```

**Effects and Synths:**
```ruby
# Sonic Pi
use_synth :beep
with_fx :reverb do
  play 60
end

# Contour (instrument specification)
new Voice(pattern, 'synth')
// Effects via Tone.js in browser
```

**Sample Playback:**
```ruby
# Sonic Pi
sample :bd_haus

# Contour
// Not yet implemented - use MIDI notes for drums
pattern().fromNotation('C2').build()  // Kick on C2
```

**Key Differences:**
- Contour is declarative, not imperative (no `sleep`, no sequential execution)
- Patterns are immutable (transformations create new patterns)
- TypeScript instead of Ruby
- Browser-based (Tone.js) instead of SuperCollider
- MIDI export built-in

**What's Familiar:**
- ✅ Live coding workflow
- ✅ Musical concepts (notes, scales, chords)
- ✅ Synth specification
- ✅ Hot-reload development

### Coming from Overtone

Overtone users will appreciate Contour's functional approach:

**Playing Notes:**
```clojure
; Overtone
(definst saw-wave [freq 440 amp 0.3]
  (* amp (saw freq)))

(saw-wave 440)

; Contour (Tone.js handles synthesis)
const pattern = new Pattern([
  { type: 'note', frequency: Hz(440), duration: 1, time: 0, velocity: 100 }
]);
```

**Patterns and Sequences:**
```clojure
; Overtone with leipzig
(play-note (phrase [1 1 1 1] [60 64 67 72]))

; Contour
pattern().fromNotation('C4 E4 G4 C5').build()
```

**Functional Transformations:**
```clojure
; Overtone
(map #(* % 2) [1 2 3 4])

; Contour (map over events)
pattern.map((event, i) => ({
  ...event,
  velocity: Velocity(event.velocity * 2)
}))
```

**Live Coding:**
```clojure
; Overtone
(defn melody []
  (play-note ...))

; Edit function and re-evaluate

; Contour (hot-reload)
export const melody = pattern()
  .fromNotation('C4 E4 G4')
  .build();
// Save file → instant audio update
```

**Key Differences:**
- TypeScript/JavaScript instead of Clojure
- Browser-based (Tone.js) instead of SuperCollider
- Immutable patterns (like Clojure data structures!)
- Visual dev tools (Monaco editor, debug panel)
- MIDI export built-in

**What's Familiar:**
- ✅ Functional programming paradigm
- ✅ Immutable data structures
- ✅ Pattern transformations
- ✅ REPL-style development
- ✅ Live coding workflow

### Coming from Max/MSP or Pure Data

Max/MSP and Pd users will find Contour quite different, but here's how to think about it:

**Patching vs. Coding:**
```
Max/MSP:  [Visual patching of objects]
Contour:  Code-based composition
```

**Objects vs. Functions:**
```
Max/MSP:  [metro] → [counter] → [select] → [makenote]
Contour:  pattern().fromNotation(...).build()
```

**Scheduling:**
```
Max/MSP:  [metro 500] (triggers every 500ms)
Contour:  Uses Tone.Transport (musical time, not clock time)
```

**Data Flow:**
```
Max/MSP:  Hot inlets (bang), cold inlets (store)
Contour:  Functional transformations (pattern.transpose(5))
```

**Key Differences:**
- Text-based, not visual patching
- Functional/declarative instead of dataflow
- Higher-level musical abstractions
- No low-level DSP (Tone.js handles that)
- Version control friendly (it's just code!)

**What Translates:**
- ✅ Musical timing and scheduling
- ✅ Synthesis and audio generation
- ✅ Live performance capability
- ✅ Modular, composable approach

### Coming from Web Audio API

If you've coded directly with Web Audio API:

**Creating Oscillators:**
```javascript
// Web Audio API
const audioCtx = new AudioContext();
const oscillator = audioCtx.createOscillator();
oscillator.frequency.value = 440;
oscillator.connect(audioCtx.destination);
oscillator.start();

// Contour (abstracted via Tone.js)
const pattern = new Pattern([
  { type: 'note', frequency: Hz(440), duration: 1, time: 0 }
]);
const voice = new Voice(pattern, 'synth');
await voice.play();
```

**Scheduling:**
```javascript
// Web Audio API
oscillator.start(audioCtx.currentTime + 1);
oscillator.stop(audioCtx.currentTime + 2);

// Contour (musical time via Tone.Transport)
const pattern = new Pattern([
  { type: 'note', pitch: 60, duration: 1, time: 0 }
]);
// Scheduling handled automatically
```

**Key Differences:**
- Contour uses Tone.js (built on Web Audio API)
- Musical abstractions instead of low-level nodes
- Automatic memory management (no manual node disposal in most cases)
- Musical time (beats) instead of audio time (seconds)
- Pattern-based composition

**What's Familiar:**
- ✅ Browser-based audio
- ✅ JavaScript/TypeScript
- ✅ AudioContext under the hood
- ✅ Synthesis and effects

### Coming from MIDI Sequencers (Ableton, FL Studio, Logic)

If you're used to DAWs and MIDI sequencers:

**Piano Roll → Patterns:**
```
DAW:       [Visual piano roll with notes placed on grid]
Contour:   pattern().fromNotation('C4 E4 G4 C5').build()
```

**Tracks → Tracks:**
```javascript
// Similar concept!
const track = new Track('Melody', [
  new Voice(melodyPattern, 'piano')
]);
```

**Arrangement → Composition:**
```javascript
const song = new Composition('My Song', BPM(120))
  .addTrack(melodyTrack)
  .addTrack(bassTrack)
  .addTrack(drumTrack);
```

**MIDI Effects:**
```
DAW MIDI FX:  [Transpose +7] → [Delay] → [Arpeggiator]
Contour:      pattern.transpose(7).map(...custom logic...)
```

**Automation:**
```
DAW:       Draw automation curves
Contour:   pattern.map((event, i) => ({
             ...event,
             velocity: Velocity(50 + i * 10)  // Crescendo
           }))
```

**Key Differences:**
- Text-based, not GUI
- Functional transformations instead of MIDI effects
- Version control friendly
- Algorithmic generation built-in
- Live coding support

**What's Familiar:**
- ✅ Track-based organization
- ✅ MIDI export
- ✅ Tempo and time signatures
- ✅ Multi-track compositions
- ✅ Piano roll concept (via mini-notation)
