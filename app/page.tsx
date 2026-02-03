"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// Note frequencies (A4 = 440Hz)
const NOTE_FREQUENCIES: Record<string, number> = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392.0,
  "G#": 415.3,
  A: 440.0,
  "A#": 466.16,
  B: 493.88,
}

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

// Scale patterns (semitones from root)
const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  wholeTone: [0, 2, 4, 6, 8, 10],
  blues: [0, 3, 5, 6, 7, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  pentatonicMinor: [0, 3, 5, 7, 10],
  // New modes
  hungarian: [0, 2, 3, 6, 7, 8, 11],
  japanese: [0, 1, 5, 7, 8],
  arabian: [0, 2, 4, 5, 6, 8, 10],
  persian: [0, 1, 4, 5, 6, 8, 11],
  bebop: [0, 2, 4, 5, 7, 9, 10, 11],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}

// Chord types with intervals
const CHORD_TYPES: Record<string, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  "7sus4": [0, 5, 7, 10],
  add9: [0, 4, 7, 14],
  madd9: [0, 3, 7, 14],
  maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  "6": [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  aug: [0, 4, 8],
  "11": [0, 4, 7, 10, 14, 17],
  min11: [0, 3, 7, 10, 14, 17],
  "13": [0, 4, 7, 10, 14, 21],
  "7#9": [0, 4, 7, 10, 15],
  "7b9": [0, 4, 7, 10, 13],
}

type ChordDegree = { deg: number; type: string }

const STYLE_PROGRESSIONS: Record<string, Record<string, ChordDegree[][]>> = {
  modern: {
    major: [
      [{ deg: 1, type: "maj" }, { deg: 5, type: "maj" }, { deg: 6, type: "min" }, { deg: 4, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 4, type: "add9" }, { deg: 6, type: "min7" }, { deg: 5, type: "sus4" }],
      [{ deg: 6, type: "min" }, { deg: 4, type: "maj" }, { deg: 1, type: "maj" }, { deg: 5, type: "maj" }],
      [{ deg: 1, type: "maj7" }, { deg: 3, type: "min7" }, { deg: 4, type: "maj7" }, { deg: 5, type: "dom7" }],
    ],
    minor: [
      [{ deg: 1, type: "min" }, { deg: 6, type: "maj" }, { deg: 3, type: "maj" }, { deg: 7, type: "maj" }],
      [{ deg: 1, type: "min7" }, { deg: 4, type: "min7" }, { deg: 6, type: "maj7" }, { deg: 5, type: "dom7" }],
      [{ deg: 1, type: "min" }, { deg: 7, type: "maj" }, { deg: 6, type: "maj" }, { deg: 7, type: "maj" }],
      [{ deg: 6, type: "maj" }, { deg: 7, type: "maj" }, { deg: 1, type: "min" }, { deg: 1, type: "min" }],
    ],
  },
  electronic: {
    major: [
      [{ deg: 1, type: "sus2" }, { deg: 4, type: "sus2" }, { deg: 5, type: "sus4" }, { deg: 1, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 1, type: "maj" }, { deg: 4, type: "maj" }, { deg: 4, type: "maj" }],
      [{ deg: 6, type: "min7" }, { deg: 4, type: "add9" }, { deg: 1, type: "maj" }, { deg: 5, type: "7sus4" }],
      [{ deg: 1, type: "add9" }, { deg: 5, type: "sus4" }, { deg: 6, type: "min" }, { deg: 4, type: "add9" }],
    ],
    minor: [
      [{ deg: 1, type: "min" }, { deg: 1, type: "min" }, { deg: 6, type: "maj" }, { deg: 7, type: "maj" }],
      [{ deg: 1, type: "madd9" }, { deg: 4, type: "min" }, { deg: 6, type: "maj" }, { deg: 7, type: "sus2" }],
      [{ deg: 1, type: "min7" }, { deg: 3, type: "maj" }, { deg: 6, type: "maj" }, { deg: 7, type: "maj" }],
      [{ deg: 1, type: "min" }, { deg: 7, type: "sus2" }, { deg: 6, type: "sus2" }, { deg: 4, type: "min" }],
    ],
  },
  ambient: {
    major: [
      [{ deg: 1, type: "maj9" }, { deg: 4, type: "maj7" }, { deg: 2, type: "min9" }, { deg: 5, type: "7sus4" }],
      [{ deg: 1, type: "add9" }, { deg: 6, type: "min9" }, { deg: 4, type: "maj9" }, { deg: 5, type: "sus4" }],
      [{ deg: 1, type: "maj7" }, { deg: 3, type: "min7" }, { deg: 6, type: "min9" }, { deg: 4, type: "maj9" }],
      [{ deg: 4, type: "maj9" }, { deg: 1, type: "maj7" }, { deg: 5, type: "sus4" }, { deg: 6, type: "min9" }],
    ],
    minor: [
      [{ deg: 1, type: "min9" }, { deg: 4, type: "min7" }, { deg: 6, type: "maj9" }, { deg: 3, type: "maj7" }],
      [{ deg: 1, type: "min7" }, { deg: 7, type: "maj7" }, { deg: 6, type: "maj9" }, { deg: 4, type: "min9" }],
      [{ deg: 6, type: "maj9" }, { deg: 3, type: "maj7" }, { deg: 7, type: "maj" }, { deg: 1, type: "min9" }],
      [{ deg: 1, type: "madd9" }, { deg: 6, type: "maj7" }, { deg: 7, type: "sus2" }, { deg: 4, type: "min7" }],
    ],
  },
  jazzy: {
    major: [
      [{ deg: 2, type: "min9" }, { deg: 5, type: "dom7" }, { deg: 1, type: "maj9" }, { deg: 6, type: "min7" }],
      [{ deg: 1, type: "maj9" }, { deg: 4, type: "maj7" }, { deg: 3, type: "min7" }, { deg: 6, type: "dom7" }],
      [{ deg: 1, type: "6" }, { deg: 2, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "maj7" }],
      [{ deg: 3, type: "min7" }, { deg: 6, type: "dom7" }, { deg: 2, type: "min7" }, { deg: 5, type: "dom7" }],
    ],
    minor: [
      [{ deg: 1, type: "min9" }, { deg: 4, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min6" }],
      [{ deg: 2, type: "m7b5" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min9" }, { deg: 6, type: "maj7" }],
      [{ deg: 1, type: "min7" }, { deg: 7, type: "dom7" }, { deg: 3, type: "maj7" }, { deg: 6, type: "min7" }],
      [{ deg: 1, type: "min9" }, { deg: 4, type: "dom7" }, { deg: 7, type: "maj7" }, { deg: 3, type: "6" }],
    ],
  },
  lofi: {
    major: [
      [{ deg: 2, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "maj7" }, { deg: 1, type: "maj7" }],
      [{ deg: 1, type: "maj7" }, { deg: 6, type: "min7" }, { deg: 2, type: "min7" }, { deg: 5, type: "7sus4" }],
      [{ deg: 4, type: "maj7" }, { deg: 3, type: "min7" }, { deg: 2, type: "min7" }, { deg: 1, type: "maj7" }],
      [{ deg: 1, type: "maj9" }, { deg: 4, type: "maj7" }, { deg: 6, type: "min9" }, { deg: 5, type: "dom7" }],
    ],
    minor: [
      [{ deg: 1, type: "min9" }, { deg: 4, type: "min7" }, { deg: 7, type: "maj7" }, { deg: 3, type: "maj7" }],
      [{ deg: 6, type: "maj7" }, { deg: 7, type: "maj7" }, { deg: 1, type: "min7" }, { deg: 4, type: "min7" }],
      [{ deg: 1, type: "min7" }, { deg: 6, type: "maj9" }, { deg: 3, type: "maj7" }, { deg: 7, type: "dom7" }],
      [{ deg: 2, type: "m7b5" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min9" }, { deg: 4, type: "min7" }],
    ],
  },
  cinematic: {
    major: [
      [{ deg: 1, type: "maj" }, { deg: 3, type: "min" }, { deg: 4, type: "maj" }, { deg: 1, type: "maj" }],
      [{ deg: 1, type: "sus2" }, { deg: 5, type: "sus4" }, { deg: 6, type: "min" }, { deg: 4, type: "add9" }],
      [{ deg: 6, type: "min" }, { deg: 3, type: "min" }, { deg: 4, type: "maj" }, { deg: 1, type: "sus2" }],
      [{ deg: 1, type: "add9" }, { deg: 6, type: "min" }, { deg: 4, type: "maj" }, { deg: 5, type: "sus4" }],
    ],
    minor: [
      [{ deg: 1, type: "min" }, { deg: 6, type: "maj" }, { deg: 3, type: "maj" }, { deg: 4, type: "min" }],
      [{ deg: 1, type: "madd9" }, { deg: 7, type: "maj" }, { deg: 6, type: "sus2" }, { deg: 6, type: "maj" }],
      [{ deg: 4, type: "min" }, { deg: 1, type: "min" }, { deg: 6, type: "maj" }, { deg: 7, type: "sus2" }],
      [{ deg: 1, type: "min" }, { deg: 5, type: "min" }, { deg: 6, type: "maj" }, { deg: 7, type: "maj" }],
    ],
  },
  rnb: {
    major: [
      [{ deg: 1, type: "maj9" }, { deg: 4, type: "maj7" }, { deg: 2, type: "min9" }, { deg: 5, type: "13" }],
      [{ deg: 1, type: "maj7" }, { deg: 6, type: "min9" }, { deg: 4, type: "maj9" }, { deg: 5, type: "11" }],
      [{ deg: 2, type: "min11" }, { deg: 5, type: "13" }, { deg: 1, type: "maj9" }, { deg: 4, type: "maj7" }],
      [{ deg: 1, type: "6" }, { deg: 3, type: "min7" }, { deg: 6, type: "min9" }, { deg: 2, type: "min7" }],
    ],
    minor: [
      [{ deg: 1, type: "min9" }, { deg: 4, type: "min11" }, { deg: 7, type: "maj9" }, { deg: 3, type: "maj7" }],
      [{ deg: 6, type: "maj9" }, { deg: 7, type: "13" }, { deg: 1, type: "min9" }, { deg: 4, type: "min7" }],
      [{ deg: 1, type: "min9" }, { deg: 5, type: "dom7" }, { deg: 4, type: "min7" }, { deg: 6, type: "maj7" }],
      [{ deg: 2, type: "m7b5" }, { deg: 5, type: "13" }, { deg: 1, type: "min9" }, { deg: 6, type: "maj9" }],
    ],
  },
  gospel: {
    major: [
      [{ deg: 1, type: "maj7" }, { deg: 4, type: "maj9" }, { deg: 5, type: "dom7" }, { deg: 1, type: "maj9" }],
      [{ deg: 4, type: "maj7" }, { deg: 4, type: "min7" }, { deg: 1, type: "maj7" }, { deg: 1, type: "maj7" }],
      [{ deg: 2, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 3, type: "min7" }, { deg: 6, type: "dom7" }],
      [{ deg: 1, type: "maj7" }, { deg: 3, type: "dom7" }, { deg: 6, type: "min9" }, { deg: 2, type: "min7" }],
    ],
    minor: [
      [{ deg: 1, type: "min9" }, { deg: 4, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min7" }],
      [{ deg: 6, type: "maj7" }, { deg: 7, type: "dom7" }, { deg: 1, type: "min9" }, { deg: 5, type: "dom7" }],
      [{ deg: 4, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min9" }, { deg: 6, type: "maj7" }],
      [{ deg: 2, type: "m7b5" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min7" }, { deg: 4, type: "min7" }],
    ],
  },
  funk: {
    major: [
      [{ deg: 1, type: "dom7" }, { deg: 4, type: "dom7" }, { deg: 1, type: "dom7" }, { deg: 5, type: "dom7" }],
      [{ deg: 1, type: "dom7" }, { deg: 1, type: "dom7" }, { deg: 4, type: "dom7" }, { deg: 1, type: "dom7" }],
      [{ deg: 2, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "dom7" }, { deg: 1, type: "dom7" }],
      [{ deg: 1, type: "dom7" }, { deg: 3, type: "dom7" }, { deg: 4, type: "dom7" }, { deg: 5, type: "dom7" }],
    ],
    minor: [
      [{ deg: 1, type: "min7" }, { deg: 4, type: "min7" }, { deg: 1, type: "min7" }, { deg: 5, type: "dom7" }],
      [{ deg: 1, type: "min7" }, { deg: 1, type: "min7" }, { deg: 4, type: "dom7" }, { deg: 1, type: "min7" }],
      [{ deg: 6, type: "dom7" }, { deg: 7, type: "dom7" }, { deg: 1, type: "min7" }, { deg: 1, type: "min7" }],
      [{ deg: 1, type: "min7" }, { deg: 3, type: "maj7" }, { deg: 4, type: "dom7" }, { deg: 5, type: "dom7" }],
    ],
  },
  indie: {
    major: [
      [{ deg: 1, type: "maj" }, { deg: 5, type: "maj" }, { deg: 6, type: "min" }, { deg: 4, type: "maj" }],
      [{ deg: 1, type: "add9" }, { deg: 4, type: "add9" }, { deg: 6, type: "madd9" }, { deg: 5, type: "sus4" }],
      [{ deg: 4, type: "maj" }, { deg: 1, type: "maj" }, { deg: 5, type: "maj" }, { deg: 6, type: "min" }],
      [{ deg: 1, type: "sus2" }, { deg: 3, type: "min" }, { deg: 4, type: "add9" }, { deg: 1, type: "maj" }],
    ],
    minor: [
      [{ deg: 1, type: "min" }, { deg: 3, type: "maj" }, { deg: 7, type: "maj" }, { deg: 4, type: "min" }],
      [{ deg: 1, type: "madd9" }, { deg: 6, type: "sus2" }, { deg: 3, type: "add9" }, { deg: 7, type: "sus4" }],
      [{ deg: 6, type: "maj" }, { deg: 3, type: "maj" }, { deg: 7, type: "maj" }, { deg: 1, type: "min" }],
      [{ deg: 1, type: "min" }, { deg: 4, type: "min" }, { deg: 6, type: "add9" }, { deg: 7, type: "sus2" }],
    ],
  },
  bossa: {
    major: [
      [{ deg: 1, type: "maj9" }, { deg: 2, type: "min9" }, { deg: 3, type: "min7" }, { deg: 6, type: "dom7" }],
      [{ deg: 1, type: "maj7" }, { deg: 7, type: "dim7" }, { deg: 2, type: "min7" }, { deg: 5, type: "dom7" }],
      [{ deg: 1, type: "6" }, { deg: 4, type: "maj7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "maj9" }],
      [{ deg: 2, type: "min7" }, { deg: 5, type: "7#9" }, { deg: 1, type: "maj9" }, { deg: 4, type: "maj7" }],
    ],
    minor: [
      [{ deg: 1, type: "min9" }, { deg: 4, type: "min7" }, { deg: 7, type: "dom7" }, { deg: 3, type: "maj7" }],
      [{ deg: 2, type: "m7b5" }, { deg: 5, type: "7b9" }, { deg: 1, type: "min9" }, { deg: 6, type: "maj7" }],
      [{ deg: 1, type: "min7" }, { deg: 6, type: "maj9" }, { deg: 2, type: "m7b5" }, { deg: 5, type: "dom7" }],
      [{ deg: 1, type: "min6" }, { deg: 4, type: "min9" }, { deg: 7, type: "maj7" }, { deg: 3, type: "6" }],
    ],
  },
  reggaeton: {
    major: [
      [{ deg: 6, type: "min" }, { deg: 4, type: "maj" }, { deg: 1, type: "maj" }, { deg: 5, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 6, type: "min" }, { deg: 4, type: "maj" }, { deg: 5, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 4, type: "maj" }, { deg: 6, type: "min" }, { deg: 5, type: "maj" }],
      [{ deg: 6, type: "min" }, { deg: 5, type: "maj" }, { deg: 4, type: "maj" }, { deg: 1, type: "maj" }],
    ],
    minor: [
      [{ deg: 1, type: "min" }, { deg: 6, type: "maj" }, { deg: 3, type: "maj" }, { deg: 7, type: "maj" }],
      [{ deg: 1, type: "min" }, { deg: 7, type: "maj" }, { deg: 6, type: "maj" }, { deg: 3, type: "maj" }],
      [{ deg: 1, type: "min" }, { deg: 4, type: "min" }, { deg: 6, type: "maj" }, { deg: 7, type: "maj" }],
      [{ deg: 6, type: "maj" }, { deg: 7, type: "maj" }, { deg: 1, type: "min" }, { deg: 1, type: "min" }],
    ],
  },
  country: {
    major: [
      [{ deg: 1, type: "maj" }, { deg: 4, type: "maj" }, { deg: 1, type: "maj" }, { deg: 5, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 5, type: "maj" }, { deg: 4, type: "maj" }, { deg: 1, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 4, type: "maj" }, { deg: 5, type: "dom7" }, { deg: 1, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 6, type: "min" }, { deg: 4, type: "maj" }, { deg: 5, type: "maj" }],
    ],
    minor: [
      [{ deg: 1, type: "min" }, { deg: 4, type: "min" }, { deg: 1, type: "min" }, { deg: 5, type: "min" }],
      [{ deg: 1, type: "min" }, { deg: 7, type: "maj" }, { deg: 1, type: "min" }, { deg: 5, type: "min" }],
      [{ deg: 1, type: "min" }, { deg: 4, type: "min" }, { deg: 6, type: "maj" }, { deg: 5, type: "dom7" }],
      [{ deg: 1, type: "min" }, { deg: 6, type: "maj" }, { deg: 7, type: "maj" }, { deg: 1, type: "min" }],
    ],
  },
  metal: {
    major: [
      [{ deg: 1, type: "maj" }, { deg: 7, type: "maj" }, { deg: 6, type: "min" }, { deg: 5, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 4, type: "maj" }, { deg: 5, type: "maj" }, { deg: 7, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 6, type: "min" }, { deg: 7, type: "maj" }, { deg: 1, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 3, type: "min" }, { deg: 7, type: "maj" }, { deg: 4, type: "maj" }],
    ],
    minor: [
      [{ deg: 1, type: "min" }, { deg: 6, type: "maj" }, { deg: 7, type: "maj" }, { deg: 1, type: "min" }],
      [{ deg: 1, type: "min" }, { deg: 4, type: "min" }, { deg: 5, type: "min" }, { deg: 1, type: "min" }],
      [{ deg: 1, type: "min" }, { deg: 7, type: "maj" }, { deg: 6, type: "maj" }, { deg: 5, type: "maj" }],
      [{ deg: 1, type: "min" }, { deg: 2, type: "dim" }, { deg: 7, type: "maj" }, { deg: 1, type: "min" }],
    ],
  },
  classical: {
    major: [
      [{ deg: 1, type: "maj" }, { deg: 4, type: "maj" }, { deg: 5, type: "dom7" }, { deg: 1, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 5, type: "maj" }, { deg: 6, type: "min" }, { deg: 3, type: "min" }],
      [{ deg: 1, type: "maj" }, { deg: 6, type: "min" }, { deg: 2, type: "min" }, { deg: 5, type: "dom7" }],
      [{ deg: 4, type: "maj" }, { deg: 5, type: "dom7" }, { deg: 3, type: "min" }, { deg: 6, type: "min" }],
    ],
    minor: [
      [{ deg: 1, type: "min" }, { deg: 4, type: "min" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min" }],
      [{ deg: 1, type: "min" }, { deg: 7, type: "maj" }, { deg: 3, type: "maj" }, { deg: 5, type: "dom7" }],
      [{ deg: 6, type: "maj" }, { deg: 3, type: "maj" }, { deg: 7, type: "maj" }, { deg: 1, type: "min" }],
      [{ deg: 1, type: "min" }, { deg: 5, type: "dom7" }, { deg: 6, type: "maj" }, { deg: 5, type: "dom7" }],
    ],
  },
  disco: {
    major: [
      [{ deg: 1, type: "maj7" }, { deg: 2, type: "min7" }, { deg: 3, type: "min7" }, { deg: 4, type: "maj7" }],
      [{ deg: 6, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 4, type: "maj7" }, { deg: 1, type: "maj7" }],
      [{ deg: 1, type: "maj" }, { deg: 4, type: "maj" }, { deg: 5, type: "dom7" }, { deg: 4, type: "maj" }],
      [{ deg: 2, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "maj7" }, { deg: 6, type: "min7" }],
    ],
    minor: [
      [{ deg: 1, type: "min7" }, { deg: 4, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min7" }],
      [{ deg: 6, type: "maj7" }, { deg: 7, type: "dom7" }, { deg: 1, type: "min7" }, { deg: 4, type: "min7" }],
      [{ deg: 1, type: "min" }, { deg: 6, type: "maj" }, { deg: 7, type: "maj" }, { deg: 1, type: "min" }],
      [{ deg: 1, type: "min7" }, { deg: 7, type: "maj7" }, { deg: 6, type: "maj7" }, { deg: 5, type: "dom7" }],
    ],
  },
  // New styles
  synthwave: {
    major: [
      [{ deg: 1, type: "maj7" }, { deg: 5, type: "sus4" }, { deg: 6, type: "min7" }, { deg: 4, type: "maj7" }],
      [{ deg: 1, type: "add9" }, { deg: 4, type: "add9" }, { deg: 5, type: "sus2" }, { deg: 6, type: "min" }],
      [{ deg: 6, type: "min" }, { deg: 5, type: "maj" }, { deg: 4, type: "maj" }, { deg: 1, type: "maj" }],
      [{ deg: 1, type: "maj" }, { deg: 3, type: "min" }, { deg: 4, type: "maj" }, { deg: 5, type: "sus4" }],
    ],
    minor: [
      [{ deg: 1, type: "min7" }, { deg: 4, type: "min" }, { deg: 7, type: "maj" }, { deg: 6, type: "maj" }],
      [{ deg: 1, type: "madd9" }, { deg: 6, type: "maj" }, { deg: 7, type: "add9" }, { deg: 4, type: "min" }],
      [{ deg: 6, type: "maj" }, { deg: 7, type: "maj" }, { deg: 1, type: "min" }, { deg: 5, type: "sus4" }],
      [{ deg: 1, type: "min" }, { deg: 7, type: "sus2" }, { deg: 6, type: "maj" }, { deg: 3, type: "maj" }],
    ],
  },
  edm: {
    major: [
      [{ deg: 1, type: "maj" }, { deg: 5, type: "maj" }, { deg: 6, type: "min" }, { deg: 4, type: "maj" }],
      [{ deg: 1, type: "sus2" }, { deg: 5, type: "sus4" }, { deg: 6, type: "min" }, { deg: 4, type: "sus2" }],
      [{ deg: 6, type: "min" }, { deg: 4, type: "maj" }, { deg: 1, type: "maj" }, { deg: 5, type: "sus4" }],
      [{ deg: 1, type: "add9" }, { deg: 4, type: "add9" }, { deg: 6, type: "min" }, { deg: 5, type: "sus4" }],
    ],
    minor: [
      [{ deg: 1, type: "min" }, { deg: 6, type: "maj" }, { deg: 7, type: "maj" }, { deg: 4, type: "min" }],
      [{ deg: 1, type: "min" }, { deg: 7, type: "maj" }, { deg: 6, type: "maj" }, { deg: 7, type: "maj" }],
      [{ deg: 6, type: "maj" }, { deg: 7, type: "sus2" }, { deg: 1, type: "min" }, { deg: 4, type: "min" }],
      [{ deg: 1, type: "madd9" }, { deg: 4, type: "min" }, { deg: 6, type: "sus2" }, { deg: 7, type: "maj" }],
    ],
  },
  latin: {
    major: [
      [{ deg: 1, type: "maj7" }, { deg: 4, type: "dom7" }, { deg: 1, type: "maj7" }, { deg: 5, type: "dom7" }],
      [{ deg: 2, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "maj7" }, { deg: 6, type: "dom7" }],
      [{ deg: 1, type: "maj7" }, { deg: 2, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "6" }],
      [{ deg: 1, type: "6" }, { deg: 4, type: "maj7" }, { deg: 2, type: "min7" }, { deg: 5, type: "dom7" }],
    ],
    minor: [
      [{ deg: 1, type: "min7" }, { deg: 4, type: "dom7" }, { deg: 1, type: "min7" }, { deg: 5, type: "dom7" }],
      [{ deg: 2, type: "m7b5" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min9" }, { deg: 1, type: "min7" }],
      [{ deg: 1, type: "min7" }, { deg: 4, type: "min7" }, { deg: 7, type: "dom7" }, { deg: 3, type: "maj7" }],
      [{ deg: 1, type: "min6" }, { deg: 4, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min7" }],
    ],
  },
  afrobeat: {
    major: [
      [{ deg: 1, type: "dom7" }, { deg: 4, type: "dom7" }, { deg: 1, type: "dom7" }, { deg: 4, type: "dom7" }],
      [{ deg: 1, type: "maj7" }, { deg: 5, type: "dom7" }, { deg: 4, type: "maj7" }, { deg: 1, type: "maj7" }],
      [{ deg: 1, type: "dom7" }, { deg: 1, type: "dom7" }, { deg: 4, type: "dom7" }, { deg: 5, type: "dom7" }],
      [{ deg: 2, type: "min7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "maj7" }, { deg: 4, type: "dom7" }],
    ],
    minor: [
      [{ deg: 1, type: "min7" }, { deg: 4, type: "dom7" }, { deg: 1, type: "min7" }, { deg: 4, type: "dom7" }],
      [{ deg: 1, type: "min7" }, { deg: 7, type: "dom7" }, { deg: 6, type: "maj7" }, { deg: 5, type: "dom7" }],
      [{ deg: 1, type: "min7" }, { deg: 1, type: "min7" }, { deg: 4, type: "min7" }, { deg: 5, type: "dom7" }],
      [{ deg: 6, type: "maj7" }, { deg: 5, type: "dom7" }, { deg: 1, type: "min7" }, { deg: 4, type: "min7" }],
    ],
  },
}

// Drum patterns by style
const DRUM_STYLE_PATTERNS: Record<string, Record<string, Record<string, number[]>>> = {
  basic: {
    "4": {
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    },
    "3": {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
    "6": {
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
  },
  hiphop: {
    "4": {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    },
    "3": {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
    "6": {
      kick: [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
  },
  house: {
    "4": {
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    },
    "3": {
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      hihat: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
    "6": {
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      hihat: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
  },
  trap: {
    "4": {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    },
    "3": {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
    "6": {
      kick: [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
  },
  dnb: {
    "4": {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    },
    "3": {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
    "6": {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
  },
  reggae: {
    "4": {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    },
    "3": {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      hihat: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
    "6": {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      hihat: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
  },
  shuffle: {
    "4": {
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    },
    "3": {
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      hihat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
    "6": {
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      hihat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
      openHat: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    },
  },
  bossa: {
    "4": {
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      hihat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    },
    "3": {
      kick: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
      snare: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      hihat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    },
    "6": {
      kick: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
      snare: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      hihat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    },
  },
  reggaeton: {
    "4": {
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    "3": {
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      snare: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    "6": {
      kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      snare: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
  none: {
    "4": {
      kick: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    "3": {
      kick: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    "6": {
      kick: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      openHat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  },
}

// Synth rhythm patterns - expanded with arpeggios that work properly
const SYNTH_RHYTHMS: Record<string, { pattern: number[]; name: string; isArp?: boolean; arpDirection?: string }> = {
  sustained: { pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], name: "Sustained" },
  pulse: { pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], name: "Pulse" },
  offbeat: { pattern: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], name: "Offbeat" },
  staccato: { pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], name: "Staccato" },
  syncopated: { pattern: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0], name: "Syncopated" },
  triplet: { pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0], name: "Triplet" },
  dotted: { pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0], name: "Dotted" },
  driving: { pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0], name: "Driving" },
  sparse: { pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], name: "Sparse" },
  // Arpeggio patterns - these trigger individual notes of the chord
  arpUp: { pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], name: "Arp Up", isArp: true, arpDirection: "up" },
  arpDown: { pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], name: "Arp Down", isArp: true, arpDirection: "down" },
  arpUpDown: { pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], name: "Arp U/D", isArp: true, arpDirection: "updown" },
  arpRandom: { pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], name: "Arp Rand", isArp: true, arpDirection: "random" },
}

type Chord = {
  root: string
  type: string
  name: string
  frequencies: number[]
}

type Settings = {
  bpm: number
  timeSignature: number
  barsPerChord: number
  drumsEnabled: boolean
  drumStyle: string
  metronomeEnabled: boolean
  chordVolume: number
  drumVolume: number
  reverbAmount: number
  synthType: string
  synthRhythm: string
}

function formatChordType(type: string): string {
  const formats: Record<string, string> = {
    maj: "",
    min: "m",
    maj7: "maj7",
    min7: "m7",
    dom7: "7",
    "7sus4": "7sus4",
    add9: "add9",
    madd9: "madd9",
    maj9: "maj9",
    min9: "m9",
    sus2: "sus2",
    sus4: "sus4",
    "6": "6",
    min6: "m6",
    dim: "dim",
    dim7: "dim7",
    m7b5: "m7b5",
    aug: "aug",
    "11": "11",
    min11: "m11",
    "13": "13",
    "7#9": "7#9",
    "7b9": "7b9",
  }
  return formats[type] || type
}

function getChordTypeName(type: string): string {
  const names: Record<string, string> = {
    maj: "Major",
    min: "Minor",
    maj7: "Major 7",
    min7: "Minor 7",
    dom7: "Dominant 7",
    "7sus4": "Dom 7sus4",
    add9: "Add 9",
    madd9: "Minor add9",
    maj9: "Major 9",
    min9: "Minor 9",
    sus2: "Sus 2",
    sus4: "Sus 4",
    "6": "Major 6",
    min6: "Minor 6",
    dim: "Diminished",
    dim7: "Dim 7",
    m7b5: "Half-dim",
    aug: "Augmented",
    "11": "Dominant 11",
    min11: "Minor 11",
    "13": "Dominant 13",
    "7#9": "7 Sharp 9",
    "7b9": "7 Flat 9",
  }
  return names[type] || type
}

function getScaleNotes(rootNote: string, mode: string): string[] {
  const rootIndex = NOTES.indexOf(rootNote)
  const scale = SCALES[mode] || SCALES.major
  return scale.map((interval) => NOTES[(rootIndex + interval) % 12])
}

function getChordNotes(rootNote: string, chordType: string, octave: number = 3): number[] {
  const rootIndex = NOTES.indexOf(rootNote)
  const intervals = CHORD_TYPES[chordType] || CHORD_TYPES.maj

  return intervals.map((interval) => {
    const noteIndex = (rootIndex + interval) % 12
    const noteOctave = octave + Math.floor((rootIndex + interval) / 12)
    const note = NOTES[noteIndex]
    const freq = NOTE_FREQUENCIES[note] * Math.pow(2, noteOctave - 4)
    return freq
  })
}

export default function ChordGenerator() {
  const [key, setKey] = useState("C")
  const [mode, setMode] = useState("major")
  const [style, setStyle] = useState("modern")
  const [settings, setSettings] = useState<Settings>({
    bpm: 90,
    timeSignature: 4,
    barsPerChord: 2,
    drumsEnabled: true,
    drumStyle: "basic",
    metronomeEnabled: false,
    chordVolume: 0.7,
    drumVolume: 0.6,
    reverbAmount: 0.4,
    synthType: "pad",
    synthRhythm: "sustained",
  })

  const [bpmInput, setBpmInput] = useState(settings.bpm.toString())

  // Keep bpmInput in sync when settings.bpm changes
  useEffect(() => {
    setBpmInput(settings.bpm.toString())
  }, [settings.bpm])

  const [progression, setProgression] = useState<Chord[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeChordIndex, setActiveChordIndex] = useState(-1)
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(32).fill(4))
  const [savedProgressions, setSavedProgressions] = useState<{ name: string; key: string; mode: string; chords: Chord[] }[]>([])
  const [editingChord, setEditingChord] = useState<{index: number, root: string, type: string} | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const reverbNodeRef = useRef<ConvolverNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const isPlayingRef = useRef(false)
  const currentChordIndexRef = useRef(0)
  const currentBeatRef = useRef(0)
  const nextNoteTimeRef = useRef(0)
  const schedulerTimerRef = useRef<number | null>(null)
  const progressionRef = useRef<Chord[]>([])
  const settingsRef = useRef(settings)
  const activeNodesRef = useRef<Array<OscillatorNode | AudioBufferSourceNode>>([])
  const arpNoteIndexRef = useRef(0)
  const arpDirectionRef = useRef(1)

  // Keep refs in sync
  useEffect(() => {
    progressionRef.current = progression
  }, [progression])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const createReverb = useCallback(() => {
    if (!audioCtxRef.current) return null
    const convolver = audioCtxRef.current.createConvolver()
    const rate = audioCtxRef.current.sampleRate
    const length = rate * 2
    const decay = 2
    const impulse = audioCtxRef.current.createBuffer(2, length, rate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
      }
    }

    convolver.buffer = impulse
    return convolver
  }, [])

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return

    audioCtxRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

    masterGainRef.current = audioCtxRef.current.createGain()
    masterGainRef.current.gain.value = 0.8

    analyserRef.current = audioCtxRef.current.createAnalyser()
    analyserRef.current.fftSize = 256

    reverbNodeRef.current = createReverb()

    masterGainRef.current.connect(analyserRef.current)
    analyserRef.current.connect(audioCtxRef.current.destination)
  }, [createReverb])

  const stopAllNodes = useCallback(() => {
    activeNodesRef.current.forEach((node) => {
      try {
        node.stop()
        node.disconnect()
      } catch {
        // Node might already be stopped
      }
    })
    activeNodesRef.current = []
  }, [])

  const playSingleNote = useCallback((freq: number, time: number, duration: number, synthType: string) => {
    if (!audioCtxRef.current || !masterGainRef.current || !reverbNodeRef.current) return

    const vol = settingsRef.current.chordVolume

    switch (synthType) {
      case "pad": {
        const osc1 = audioCtxRef.current.createOscillator()
        const osc2 = audioCtxRef.current.createOscillator()
        const gain = audioCtxRef.current.createGain()
        const filter = audioCtxRef.current.createBiquadFilter()

        osc1.type = "sawtooth"
        osc2.type = "triangle"
        osc1.frequency.value = freq
        osc2.frequency.value = freq * 1.002

        filter.type = "lowpass"
        filter.frequency.value = 2000
        filter.Q.value = 1

        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(vol * 0.15, time + 0.1)
        gain.gain.setValueAtTime(vol * 0.15, time + duration - 0.1)
        gain.gain.linearRampToValueAtTime(0, time + duration)

        osc1.connect(filter)
        osc2.connect(filter)
        filter.connect(gain)

        const dryGain = audioCtxRef.current.createGain()
        const wetGain = audioCtxRef.current.createGain()
        dryGain.gain.value = 1 - settingsRef.current.reverbAmount
        wetGain.gain.value = settingsRef.current.reverbAmount

        gain.connect(dryGain)
        gain.connect(wetGain)
        dryGain.connect(masterGainRef.current)
        wetGain.connect(reverbNodeRef.current)
        reverbNodeRef.current.connect(masterGainRef.current)

        activeNodesRef.current.push(osc1, osc2)
        osc1.start(time)
        osc2.start(time)
        osc1.stop(time + duration)
        osc2.stop(time + duration)
        break
      }
      case "pluck": {
        const osc = audioCtxRef.current.createOscillator()
        const gain = audioCtxRef.current.createGain()
        const filter = audioCtxRef.current.createBiquadFilter()

        osc.type = "triangle"
        osc.frequency.value = freq

        filter.type = "lowpass"
        filter.frequency.setValueAtTime(4000, time)
        filter.frequency.exponentialRampToValueAtTime(500, time + 0.5)

        gain.gain.setValueAtTime(vol * 0.3, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + Math.min(duration, 1.5))

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(masterGainRef.current)

        activeNodesRef.current.push(osc)
        osc.start(time)
        osc.stop(time + duration)
        break
      }
      case "keys": {
        const osc = audioCtxRef.current.createOscillator()
        const osc2 = audioCtxRef.current.createOscillator()
        const gain = audioCtxRef.current.createGain()
        const filter = audioCtxRef.current.createBiquadFilter()

        osc.type = "sine"
        osc2.type = "triangle"
        osc.frequency.value = freq
        osc2.frequency.value = freq * 2

        filter.type = "lowpass"
        filter.frequency.value = 3000

        gain.gain.setValueAtTime(vol * 0.2, time)
        gain.gain.setValueAtTime(vol * 0.14, time + 0.1)
        gain.gain.linearRampToValueAtTime(0, time + duration - 0.1)

        osc.connect(filter)
        osc2.connect(filter)
        filter.connect(gain)

        const dryGain = audioCtxRef.current.createGain()
        const wetGain = audioCtxRef.current.createGain()
        dryGain.gain.value = 1 - settingsRef.current.reverbAmount * 0.5
        wetGain.gain.value = settingsRef.current.reverbAmount * 0.5

        gain.connect(dryGain)
        gain.connect(wetGain)
        dryGain.connect(masterGainRef.current)
        wetGain.connect(reverbNodeRef.current)
        reverbNodeRef.current.connect(masterGainRef.current)

        activeNodesRef.current.push(osc, osc2)
        osc.start(time)
        osc2.start(time)
        osc.stop(time + duration)
        osc2.stop(time + duration)
        break
      }
      case "strings": {
        const osc1 = audioCtxRef.current.createOscillator()
        const osc2 = audioCtxRef.current.createOscillator()
        const osc3 = audioCtxRef.current.createOscillator()
        const gain = audioCtxRef.current.createGain()
        const filter = audioCtxRef.current.createBiquadFilter()

        osc1.type = "sawtooth"
        osc2.type = "sawtooth"
        osc3.type = "sawtooth"
        osc1.frequency.value = freq
        osc2.frequency.value = freq * 1.003
        osc3.frequency.value = freq * 0.997

        filter.type = "lowpass"
        filter.frequency.value = 1500
        filter.Q.value = 0.5

        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(vol * 0.1, time + 0.15)
        gain.gain.setValueAtTime(vol * 0.1, time + duration - 0.15)
        gain.gain.linearRampToValueAtTime(0, time + duration)

        osc1.connect(filter)
        osc2.connect(filter)
        osc3.connect(filter)
        filter.connect(gain)

        const wetGain = audioCtxRef.current.createGain()
        wetGain.gain.value = settingsRef.current.reverbAmount * 0.8
        gain.connect(masterGainRef.current)
        gain.connect(wetGain)
        wetGain.connect(reverbNodeRef.current)
        reverbNodeRef.current.connect(masterGainRef.current)

        activeNodesRef.current.push(osc1, osc2, osc3)
        osc1.start(time)
        osc2.start(time)
        osc3.start(time)
        osc1.stop(time + duration)
        osc2.stop(time + duration)
        osc3.stop(time + duration)
        break
      }
      case "organ": {
        const oscs = [1, 2, 3, 4].map((harmonic) => {
          const osc = audioCtxRef.current!.createOscillator()
          osc.type = "sine"
          osc.frequency.value = freq * harmonic
          return osc
        })

        const gain = audioCtxRef.current.createGain()

        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(vol * 0.12, time + 0.05)
        gain.gain.setValueAtTime(vol * 0.12, time + duration - 0.1)
        gain.gain.linearRampToValueAtTime(0, time + duration)

        const harmonicGains = [1, 0.5, 0.25, 0.125]
        oscs.forEach((osc, i) => {
          const hGain = audioCtxRef.current!.createGain()
          hGain.gain.value = harmonicGains[i]
          osc.connect(hGain)
          hGain.connect(gain)
        })

        const wetGain = audioCtxRef.current.createGain()
        wetGain.gain.value = settingsRef.current.reverbAmount * 0.3
        gain.connect(masterGainRef.current)
        gain.connect(wetGain)
        wetGain.connect(reverbNodeRef.current)
        reverbNodeRef.current.connect(masterGainRef.current)

        oscs.forEach((osc) => {
          activeNodesRef.current.push(osc)
          osc.start(time)
          osc.stop(time + duration)
        })
        break
      }
      case "bell": {
        const partials = [1, 2.4, 3, 4.5, 5.33]
        const gains = [1, 0.6, 0.4, 0.25, 0.2]

        partials.forEach((partial, i) => {
          const osc = audioCtxRef.current!.createOscillator()
          const gain = audioCtxRef.current!.createGain()

          osc.type = "sine"
          osc.frequency.value = freq * partial

          gain.gain.setValueAtTime(vol * 0.15 * gains[i], time)
          gain.gain.exponentialRampToValueAtTime(0.001, time + duration * (1 - i * 0.15))

          osc.connect(gain)

          const wetGain = audioCtxRef.current!.createGain()
          wetGain.gain.value = settingsRef.current.reverbAmount * 0.6
          gain.connect(masterGainRef.current!)
          gain.connect(wetGain)
          wetGain.connect(reverbNodeRef.current!)
          reverbNodeRef.current!.connect(masterGainRef.current!)

          activeNodesRef.current.push(osc)
          osc.start(time)
          osc.stop(time + duration)
        })
        break
      }
      case "bass": {
        const osc = audioCtxRef.current.createOscillator()
        const osc2 = audioCtxRef.current.createOscillator()
        const gain = audioCtxRef.current.createGain()
        const filter = audioCtxRef.current.createBiquadFilter()

        osc.type = "sawtooth"
        osc2.type = "square"
        osc.frequency.value = freq / 2
        osc2.frequency.value = freq / 2

        filter.type = "lowpass"
        filter.frequency.value = 400
        filter.Q.value = 2

        gain.gain.setValueAtTime(vol * 0.25, time)
        gain.gain.setValueAtTime(vol * 0.2, time + 0.1)
        gain.gain.linearRampToValueAtTime(0, time + duration)

        osc.connect(filter)
        osc2.connect(filter)
        filter.connect(gain)
        gain.connect(masterGainRef.current)

        activeNodesRef.current.push(osc, osc2)
        osc.start(time)
        osc2.start(time)
        osc.stop(time + duration)
        osc2.stop(time + duration)
        break
      }
      case "lead": {
        const osc = audioCtxRef.current.createOscillator()
        const osc2 = audioCtxRef.current.createOscillator()
        const gain = audioCtxRef.current.createGain()
        const filter = audioCtxRef.current.createBiquadFilter()

        osc.type = "sawtooth"
        osc2.type = "square"
        osc.frequency.value = freq
        osc2.frequency.value = freq * 1.005

        filter.type = "lowpass"
        filter.frequency.setValueAtTime(3000, time)
        filter.frequency.linearRampToValueAtTime(1000, time + duration)
        filter.Q.value = 4

        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(vol * 0.18, time + 0.02)
        gain.gain.setValueAtTime(vol * 0.13, time + 0.1)
        gain.gain.linearRampToValueAtTime(0, time + duration)

        osc.connect(filter)
        osc2.connect(filter)
        filter.connect(gain)

        const wetGain = audioCtxRef.current.createGain()
        wetGain.gain.value = settingsRef.current.reverbAmount * 0.4
        gain.connect(masterGainRef.current)
        gain.connect(wetGain)
        wetGain.connect(reverbNodeRef.current)
        reverbNodeRef.current.connect(masterGainRef.current)

        activeNodesRef.current.push(osc, osc2)
        osc.start(time)
        osc2.start(time)
        osc.stop(time + duration)
        osc2.stop(time + duration)
        break
      }
      case "brass": {
        const osc1 = audioCtxRef.current.createOscillator()
        const osc2 = audioCtxRef.current.createOscillator()
        const gain = audioCtxRef.current.createGain()
        const filter = audioCtxRef.current.createBiquadFilter()

        osc1.type = "sawtooth"
        osc2.type = "sawtooth"
        osc1.frequency.value = freq
        osc2.frequency.value = freq * 2.01

        filter.type = "lowpass"
        filter.frequency.setValueAtTime(500, time)
        filter.frequency.linearRampToValueAtTime(2500, time + 0.15)
        filter.frequency.linearRampToValueAtTime(1500, time + duration)
        filter.Q.value = 1

        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(vol * 0.15, time + 0.1)
        gain.gain.setValueAtTime(vol * 0.12, time + 0.2)
        gain.gain.linearRampToValueAtTime(0, time + duration)

        osc1.connect(filter)
        osc2.connect(filter)
        filter.connect(gain)

        const wetGain = audioCtxRef.current.createGain()
        wetGain.gain.value = settingsRef.current.reverbAmount * 0.3
        gain.connect(masterGainRef.current)
        gain.connect(wetGain)
        wetGain.connect(reverbNodeRef.current)
        reverbNodeRef.current.connect(masterGainRef.current)

        activeNodesRef.current.push(osc1, osc2)
        osc1.start(time)
        osc2.start(time)
        osc1.stop(time + duration)
        osc2.stop(time + duration)
        break
      }
      // New synth sounds
      case "fm": {
        const carrier = audioCtxRef.current.createOscillator()
        const modulator = audioCtxRef.current.createOscillator()
        const modGain = audioCtxRef.current.createGain()
        const gain = audioCtxRef.current.createGain()

        carrier.type = "sine"
        modulator.type = "sine"
        carrier.frequency.value = freq
        modulator.frequency.value = freq * 2

        modGain.gain.value = freq * 1.5
        modulator.connect(modGain)
        modGain.connect(carrier.frequency)

        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(vol * 0.2, time + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

        carrier.connect(gain)
        gain.connect(masterGainRef.current)

        activeNodesRef.current.push(carrier, modulator)
        carrier.start(time)
        modulator.start(time)
        carrier.stop(time + duration)
        modulator.stop(time + duration)
        break
      }
      case "supersaw": {
        const oscs: OscillatorNode[] = []
        const gain = audioCtxRef.current.createGain()
        const filter = audioCtxRef.current.createBiquadFilter()

        for (let i = 0; i < 7; i++) {
          const osc = audioCtxRef.current.createOscillator()
          osc.type = "sawtooth"
          osc.frequency.value = freq * (1 + (i - 3) * 0.01)
          osc.connect(filter)
          oscs.push(osc)
        }

        filter.type = "lowpass"
        filter.frequency.value = 4000
        filter.Q.value = 1

        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(vol * 0.08, time + 0.05)
        gain.gain.setValueAtTime(vol * 0.08, time + duration - 0.1)
        gain.gain.linearRampToValueAtTime(0, time + duration)

        filter.connect(gain)

        const wetGain = audioCtxRef.current.createGain()
        wetGain.gain.value = settingsRef.current.reverbAmount * 0.5
        gain.connect(masterGainRef.current)
        gain.connect(wetGain)
        wetGain.connect(reverbNodeRef.current)
        reverbNodeRef.current.connect(masterGainRef.current)

        oscs.forEach((osc) => {
          activeNodesRef.current.push(osc)
          osc.start(time)
          osc.stop(time + duration)
        })
        break
      }
      case "wobble": {
        const osc = audioCtxRef.current.createOscillator()
        const lfo = audioCtxRef.current.createOscillator()
        const lfoGain = audioCtxRef.current.createGain()
        const gain = audioCtxRef.current.createGain()
        const filter = audioCtxRef.current.createBiquadFilter()

        osc.type = "sawtooth"
        osc.frequency.value = freq

        lfo.type = "sine"
        lfo.frequency.value = 4
        lfoGain.gain.value = 1000

        lfo.connect(lfoGain)
        lfoGain.connect(filter.frequency)

        filter.type = "lowpass"
        filter.frequency.value = 1500
        filter.Q.value = 8

        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(vol * 0.2, time + 0.05)
        gain.gain.setValueAtTime(vol * 0.2, time + duration - 0.1)
        gain.gain.linearRampToValueAtTime(0, time + duration)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(masterGainRef.current)

        activeNodesRef.current.push(osc, lfo)
        osc.start(time)
        lfo.start(time)
        osc.stop(time + duration)
        lfo.stop(time + duration)
        break
      }
    }
  }, [])

  const playChord = useCallback(
    (frequencies: number[], time: number, duration: number) => {
      const synthType = settingsRef.current.synthType
      frequencies.forEach((freq) => {
        playSingleNote(freq, time, duration, synthType)
      })
    },
    [playSingleNote]
  )

  const playArpNote = useCallback(
    (frequencies: number[], time: number, duration: number, direction: string) => {
      if (frequencies.length === 0) return

      let noteIndex: number

      switch (direction) {
        case "up":
          noteIndex = arpNoteIndexRef.current % frequencies.length
          arpNoteIndexRef.current++
          break
        case "down":
          noteIndex = (frequencies.length - 1) - (arpNoteIndexRef.current % frequencies.length)
          arpNoteIndexRef.current++
          break
        case "updown":
          const totalCycle = frequencies.length * 2 - 2
          const pos = arpNoteIndexRef.current % totalCycle
          if (pos < frequencies.length) {
            noteIndex = pos
          } else {
            noteIndex = totalCycle - pos
          }
          arpNoteIndexRef.current++
          break
        case "random":
          noteIndex = Math.floor(Math.random() * frequencies.length)
          break
        default:
          noteIndex = 0
      }

      const freq = frequencies[noteIndex]
      playSingleNote(freq, time, duration, settingsRef.current.synthType)
    },
    [playSingleNote]
  )

  const playKick = useCallback((time: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return

    const osc = audioCtxRef.current.createOscillator()
    const gain = audioCtxRef.current.createGain()

    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1)

    const vol = settingsRef.current.drumVolume * 0.8
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3)

    osc.connect(gain)
    gain.connect(masterGainRef.current)

    activeNodesRef.current.push(osc)
    osc.start(time)
    osc.stop(time + 0.3)
  }, [])

  const playSnare = useCallback((time: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return

    const bufferSize = audioCtxRef.current.sampleRate * 0.2
    const buffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = audioCtxRef.current.createBufferSource()
    noise.buffer = buffer

    const noiseFilter = audioCtxRef.current.createBiquadFilter()
    noiseFilter.type = "highpass"
    noiseFilter.frequency.value = 1000

    const noiseGain = audioCtxRef.current.createGain()
    const vol = settingsRef.current.drumVolume * 0.4
    noiseGain.gain.setValueAtTime(vol, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(masterGainRef.current)

    const osc = audioCtxRef.current.createOscillator()
    const oscGain = audioCtxRef.current.createGain()
    osc.frequency.value = 180
    oscGain.gain.setValueAtTime(vol * 0.5, time)
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1)

    osc.connect(oscGain)
    oscGain.connect(masterGainRef.current)

    activeNodesRef.current.push(noise, osc)
    noise.start(time)
    osc.start(time)
    osc.stop(time + 0.2)
  }, [])

  const playHiHat = useCallback((time: number, open: boolean = false) => {
    if (!audioCtxRef.current || !masterGainRef.current) return

    const bufferSize = audioCtxRef.current.sampleRate * (open ? 0.3 : 0.05)
    const buffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = audioCtxRef.current.createBufferSource()
    noise.buffer = buffer

    const filter = audioCtxRef.current.createBiquadFilter()
    filter.type = "highpass"
    filter.frequency.value = 7000

    const gain = audioCtxRef.current.createGain()
    const vol = settingsRef.current.drumVolume * (open ? 0.25 : 0.2)
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.2 : 0.05))

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(masterGainRef.current)

    activeNodesRef.current.push(noise)
    noise.start(time)
  }, [])

  const playMetronome = useCallback((time: number, accent: boolean) => {
    if (!audioCtxRef.current || !masterGainRef.current) return

    const osc = audioCtxRef.current.createOscillator()
    const gain = audioCtxRef.current.createGain()

    osc.frequency.value = accent ? 1000 : 800
    osc.type = "sine"

    gain.gain.setValueAtTime(0.1, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

    osc.connect(gain)
    gain.connect(masterGainRef.current)

    activeNodesRef.current.push(osc)
    osc.start(time)
    osc.stop(time + 0.05)
  }, [])

  const scheduleNote = useCallback(
    (time: number) => {
      if (!isPlayingRef.current) return

      const beatsPerBar = settingsRef.current.timeSignature
      const stepsPerBar = beatsPerBar * 4
      const totalSteps = stepsPerBar * settingsRef.current.barsPerChord

      const drumPatterns = DRUM_STYLE_PATTERNS[settingsRef.current.drumStyle] || DRUM_STYLE_PATTERNS.basic
      const pattern = drumPatterns[String(settingsRef.current.timeSignature)] || drumPatterns["4"]
      const patternStep = currentBeatRef.current % pattern.kick.length

      if (settingsRef.current.drumsEnabled) {
        if (pattern.kick[patternStep]) playKick(time)
        if (pattern.snare[patternStep]) playSnare(time)
        if (pattern.hihat[patternStep]) playHiHat(time)
        if (pattern.openHat[patternStep]) playHiHat(time, true)
      }

      if (settingsRef.current.metronomeEnabled && currentBeatRef.current % 4 === 0) {
        playMetronome(time, currentBeatRef.current % (beatsPerBar * 4) === 0)
      }

      // Synth rhythm handling
      const synthRhythm = SYNTH_RHYTHMS[settingsRef.current.synthRhythm] || SYNTH_RHYTHMS.sustained
      const synthPatternStep = currentBeatRef.current % synthRhythm.pattern.length
      const chordStepInBar = currentBeatRef.current % totalSteps

      const chord = progressionRef.current[currentChordIndexRef.current]
      if (!chord) {
        currentBeatRef.current++
        if (currentBeatRef.current >= totalSteps) {
          currentBeatRef.current = 0
          currentChordIndexRef.current = (currentChordIndexRef.current + 1) % progressionRef.current.length
          arpNoteIndexRef.current = 0
        }
        return
      }

      // Reset arp index at start of new chord
      if (chordStepInBar === 0) {
        arpNoteIndexRef.current = 0
        const audioCtx = audioCtxRef.current
        if (audioCtx) {
          setTimeout(() => {
            setActiveChordIndex(currentChordIndexRef.current)
          }, (time - audioCtx.currentTime) * 1000)
        }
      }

      // For sustained, play at beginning of chord only
      if (settingsRef.current.synthRhythm === "sustained") {
        if (chordStepInBar === 0) {
          const chordDuration = (60 / settingsRef.current.bpm) * beatsPerBar * settingsRef.current.barsPerChord
          playChord(chord.frequencies, time, chordDuration)
        }
      } else if (synthRhythm.isArp) {
        // For arpeggio patterns - play single notes
        if (synthRhythm.pattern[synthPatternStep]) {
          const noteDuration = (60 / settingsRef.current.bpm) / 4 * 1.5
          playArpNote(chord.frequencies, time, noteDuration, synthRhythm.arpDirection || "up")
        }
      } else {
        // For rhythmic patterns, play shorter chords based on pattern
        if (synthRhythm.pattern[synthPatternStep]) {
          const noteDuration = (60 / settingsRef.current.bpm) / 4 * 1.5
          playChord(chord.frequencies, time, noteDuration)
        }
      }

      currentBeatRef.current++
      if (currentBeatRef.current >= totalSteps) {
        currentBeatRef.current = 0
        currentChordIndexRef.current = (currentChordIndexRef.current + 1) % progressionRef.current.length
        arpNoteIndexRef.current = 0
      }
    },
    [playKick, playSnare, playHiHat, playMetronome, playChord, playArpNote]
  )

  const scheduler = useCallback(() => {
    if (!isPlayingRef.current || !audioCtxRef.current) return

    const secondsPerBeat = 60 / settingsRef.current.bpm
    const scheduleAheadTime = 0.2

    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      if (!isPlayingRef.current) break
      scheduleNote(nextNoteTimeRef.current)
      nextNoteTimeRef.current += secondsPerBeat / 4
    }

    if (isPlayingRef.current) {
      schedulerTimerRef.current = window.setTimeout(scheduler, 50)
    }
  }, [scheduleNote])

  const generateProgression = useCallback(() => {
    const modeFamily =
      mode === "minor" || mode === "dorian" || mode === "phrygian" || mode === "locrian" || mode === "aeolian" || mode === "harmonicMinor" || mode === "melodicMinor" || mode === "hungarian" || mode === "persian"
        ? "minor"
        : "major"
    const styleProgs = STYLE_PROGRESSIONS[style] || STYLE_PROGRESSIONS.modern
    const progressions = styleProgs[modeFamily]
    const selectedProg = progressions[Math.floor(Math.random() * progressions.length)]
    const scaleNotes = getScaleNotes(key, mode)

    const newProgression = selectedProg.map((chord) => {
      const rootNote = scaleNotes[(chord.deg - 1) % scaleNotes.length]
      return {
        root: rootNote,
        type: chord.type,
        name: rootNote + formatChordType(chord.type),
        frequencies: getChordNotes(rootNote, chord.type, 3),
      }
    })

    setProgression(newProgression)
    progressionRef.current = newProgression

    if (isPlayingRef.current) {
      currentChordIndexRef.current = 0
      currentBeatRef.current = 0
      arpNoteIndexRef.current = 0
    }
  }, [key, mode, style])

  const updateChord = useCallback((index: number, root: string, type: string) => {
    const frequencies = getChordNotes(root, type, 3)
    const name = root + formatChordType(type)
    const newChord = {
      root,
      type,
      name,
      frequencies,
    }

    const newProgression = [...progressionRef.current]
    newProgression[index] = newChord
    setProgression(newProgression)
    progressionRef.current = newProgression
    setEditingChord(null)
  }, [])

  const startPlayback = useCallback(() => {
    initAudio()

    if (progressionRef.current.length === 0) {
      generateProgression()
    }

    isPlayingRef.current = true
    setIsPlaying(true)
    currentChordIndexRef.current = 0
    currentBeatRef.current = 0
    arpNoteIndexRef.current = 0

    if (audioCtxRef.current) {
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1
    }

    scheduler()
  }, [initAudio, generateProgression, scheduler])

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
    setActiveChordIndex(-1)

    if (schedulerTimerRef.current) {
      clearTimeout(schedulerTimerRef.current)
      schedulerTimerRef.current = null
    }

    // Stop all active audio nodes
    stopAllNodes()

    // Reset and re-initialize audio context for clean state
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
      masterGainRef.current = null
      reverbNodeRef.current = null
      analyserRef.current = null
    }
  }, [stopAllNodes])

  const playChordPreview = useCallback(
    (index: number) => {
      initAudio()
      const chord = progressionRef.current[index]
      if (chord && audioCtxRef.current) {
        playChord(chord.frequencies, audioCtxRef.current.currentTime, 1.5)
      }
    },
    [initAudio, playChord]
  )

  const saveProgression = useCallback(() => {
    if (progression.length === 0) return
    const name = `${key} ${mode} - ${new Date().toLocaleTimeString()}`
    setSavedProgressions((prev) => [...prev, { name, key, mode, chords: progression }])
  }, [progression, key, mode])

  const loadProgression = useCallback((saved: { chords: Chord[] }) => {
    setProgression(saved.chords)
    progressionRef.current = saved.chords
  }, [])

  const exportProgression = useCallback(() => {
    const text = progression.map((c) => c.name).join(" - ")
    navigator.clipboard.writeText(text)
  }, [progression])

  // Generate MIDI file (bonus feature)
  const exportMidi = useCallback(() => {
    // Simple MIDI file generation
    const chordNames = progression.map((c) => c.name).join(" | ")
    const midiText = `CHORD PROGRESSION EXPORT\n========================\nKey: ${key} ${mode}\nStyle: ${style}\nBPM: ${settings.bpm}\nTime: ${settings.timeSignature}/4\n\nProgression:\n${chordNames}\n\nChord Details:\n${progression.map((c, i) => `${i + 1}. ${c.name} (${c.type})`).join("\n")}`
    
    const blob = new Blob([midiText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `progression-${key}-${mode}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [progression, key, mode, style, settings.bpm, settings.timeSignature])

  // Generate initial progression
  useEffect(() => {
    generateProgression()
  }, [generateProgression])

  // Visualizer animation
  useEffect(() => {
    let animationFrame: number

    const animate = () => {
      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)

        const step = Math.floor(bufferLength / 32)
        const newData = Array.from({ length: 32 }, (_, i) => {
          const value = dataArray[i * step]
          return Math.max(4, (value / 255) * 60)
        })

        setVisualizerData(newData)
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement).tagName !== "INPUT") {
        e.preventDefault()
        if (isPlayingRef.current) {
          stopPlayback()
        } else {
          startPlayback()
        }
      }
      if (e.code === "KeyR" && (e.target as HTMLElement).tagName !== "INPUT") {
        generateProgression()
      }
      if (e.code === "KeyS" && (e.target as HTMLElement).tagName !== "INPUT") {
        saveProgression()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [stopPlayback, startPlayback, generateProgression, saveProgression])

  return (
    <div className="min-h-screen bg-[#d4d4d0] text-[#1a1a1a] font-mono selection:bg-[#ff3b30] selection:text-white">
      <div className="max-w-4xl mx-auto p-3 min-h-screen flex flex-col">
        {/* Device Frame */}
        <div className="bg-[#e8e8e4] rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.5)] border border-[#c0c0b8] overflow-hidden">
          
          {/* Top Bar - Ports */}
          <div className="bg-[#2a2a2a] px-4 py-2 flex items-center justify-between text-[9px] text-[#888] uppercase tracking-widest">
            <div className="flex gap-6">
              <span>output</span>
              <span className="text-[#ff3b30]">input</span>
            </div>
            <div className="flex gap-6">
              <span>sync</span>
              <span>midi</span>
            </div>
            <div className="flex gap-6">
              <span>usb</span>
              <span>power</span>
            </div>
          </div>

          {/* Display Area */}
          <div className="bg-[#1a1a1a] m-3 rounded overflow-hidden">
            {/* Product Name Strip */}
            <div className="bg-[#f5f5f0] px-4 py-3 border-b border-[#e0e0dc]">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tracking-tight">CHORD.GEN</span>
                <span className="text-[10px] text-[#666] tracking-wider">II</span>
              </div>
              <div className="text-[9px] text-[#888] tracking-wider mt-0.5">128 CHORD PROGRESSION COMPOSER</div>
            </div>

            {/* LCD Screen */}
            <div className="bg-[#0a0a0a] p-4">
              {/* Status Bar */}
              <div className="flex items-center justify-between mb-3 text-[10px] text-[#666] uppercase">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-[#ff3b30]" : "bg-[#333]"}`} />
                  <span>{isPlaying ? "playing" : "stopped"}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>bar</span>
                  <span className="text-[#ff3b30] font-bold text-lg font-mono tabular-nums">
                    {String(Math.floor(currentBeatRef.current / (settings.timeSignature * 4)) + 1).padStart(2, "0")}.{String((currentBeatRef.current % (settings.timeSignature * 4)) + 1).padStart(1, "0")}
                  </span>
                </div>
              </div>

              {/* Chord Display */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {progression.map((chord, i) => (
                  <button
                    key={i}
                    onClick={() => playChordPreview(i)}
                    className={`relative p-3 rounded transition-all cursor-pointer text-left
                      ${activeChordIndex === i 
                        ? "bg-[#ff3b30] text-white" 
                        : "bg-[#1a1a1a] border border-[#333] text-[#ccc] hover:border-[#ff3b30]"
                      }`}
                  >
                    <div className="text-lg font-bold">
                      {chord.root}
                      <span className="text-xs font-normal opacity-80">{formatChordType(chord.type)}</span>
                    </div>
                    <div className={`text-[9px] uppercase tracking-wider ${activeChordIndex === i ? "text-white/70" : "text-[#666]"}`}>
                      {getChordTypeName(chord.type)}
                    </div>
                    {activeChordIndex === i && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                    <div 
                      className={`absolute top-1 right-4 p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer z-10 ${activeChordIndex === i ? "text-white/70 hover:text-white" : "text-[#444] hover:text-[#ff3b30]"}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingChord({ index: i, root: chord.root, type: chord.type })
                      }}
                    >
                      <Pencil size={10} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Visualizer */}
              <div className="h-12 flex items-end justify-center gap-[2px] bg-[#0f0f0f] rounded p-2">
                {visualizerData.map((height, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-[#ff3b30] rounded-t transition-[height] duration-75"
                    style={{ height: `${height}%`, minHeight: "8%" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="p-3 pt-0">
            {/* Control Row Labels */}
            <div className="grid grid-cols-6 gap-2 mb-2 text-[8px] text-[#888] uppercase tracking-wider px-1">
              <span>key</span>
              <span>mode</span>
              <span>style</span>
              <span>bpm</span>
              <span>time</span>
              <span>bars</span>
            </div>

            {/* Main Control Row */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {/* Key */}
              <div className="bg-white rounded border border-[#c0c0b8] shadow-sm">
                <select
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full bg-transparent px-2 py-2.5 text-sm font-bold uppercase cursor-pointer focus:outline-none appearance-none text-center"
                >
                  {NOTES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Mode */}
              <div className="bg-white rounded border border-[#c0c0b8] shadow-sm">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full bg-transparent px-1 py-2.5 text-[10px] font-bold uppercase cursor-pointer focus:outline-none appearance-none text-center"
                >
                  <option value="major">Maj</option>
                  <option value="minor">Min</option>
                  <option value="dorian">Dor</option>
                  <option value="mixolydian">Mix</option>
                  <option value="lydian">Lyd</option>
                  <option value="phrygian">Phr</option>
                  <option value="locrian">Loc</option>
                  <option value="aeolian">Aeo</option>
                  <option value="harmonicMinor">Hrm</option>
                  <option value="melodicMinor">Mel</option>
                  <option value="wholeTone">Whl</option>
                  <option value="blues">Blu</option>
                  <option value="pentatonicMajor">Pn+</option>
                  <option value="pentatonicMinor">Pn-</option>
                  <option value="hungarian">Hun</option>
                  <option value="japanese">Jpn</option>
                  <option value="arabian">Arb</option>
                  <option value="persian">Per</option>
                  <option value="bebop">Bop</option>
                </select>
              </div>

              {/* Style */}
              <div className="bg-white rounded border border-[#c0c0b8] shadow-sm">
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-transparent px-1 py-2.5 text-[10px] font-bold uppercase cursor-pointer focus:outline-none appearance-none text-center"
                >
                  <option value="modern">Pop</option>
                  <option value="electronic">Elec</option>
                  <option value="ambient">Amb</option>
                  <option value="jazzy">Jazz</option>
                  <option value="lofi">Lofi</option>
                  <option value="cinematic">Cine</option>
                  <option value="rnb">R&B</option>
                  <option value="gospel">Gosp</option>
                  <option value="funk">Funk</option>
                  <option value="indie">Indi</option>
                  <option value="bossa">Boss</option>
                  <option value="reggaeton">Regt</option>
                  <option value="country">Ctry</option>
                  <option value="metal">Metl</option>
                  <option value="classical">Clsc</option>
                  <option value="disco">Disc</option>
                  <option value="synthwave">Synw</option>
                  <option value="edm">EDM</option>
                  <option value="latin">Latn</option>
                  <option value="afrobeat">Afro</option>
                </select>
              </div>

              {/* BPM */}
              <div className="bg-white rounded border border-[#c0c0b8] shadow-sm">
                <input
                  type="number"
                  value={bpmInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setBpmInput(val)
                    const num = parseInt(val)
                    if (!isNaN(num)) {
                      // Update settings only if it's a valid number and within reasonable bounds
                      // but don't clamp here so the user can finish typing
                      if (num >= 1 && num <= 999) {
                        setSettings((s) => ({ ...s, bpm: num }))
                      }
                    }
                  }}
                  onBlur={() => {
                    const num = parseInt(bpmInput)
                    const clamped = Math.max(40, Math.min(200, num || 90))
                    setSettings((s) => ({ ...s, bpm: clamped }))
                    setBpmInput(clamped.toString())
                  }}
                  min={40}
                  max={200}
                  className="w-full bg-transparent px-2 py-2.5 text-sm font-bold text-center focus:outline-none"
                />
              </div>

              {/* Time Signature */}
              <div className="bg-white rounded border border-[#c0c0b8] shadow-sm">
                <select
                  value={settings.timeSignature}
                  onChange={(e) => setSettings((s) => ({ ...s, timeSignature: parseInt(e.target.value) }))}
                  className="w-full bg-transparent px-2 py-2.5 text-sm font-bold uppercase cursor-pointer focus:outline-none appearance-none text-center"
                >
                  <option value="4">4/4</option>
                  <option value="3">3/4</option>
                  <option value="6">6/8</option>
                </select>
              </div>

              {/* Bars */}
              <div className="bg-white rounded border border-[#c0c0b8] shadow-sm">
                <select
                  value={settings.barsPerChord}
                  onChange={(e) => setSettings((s) => ({ ...s, barsPerChord: parseInt(e.target.value) }))}
                  className="w-full bg-transparent px-2 py-2.5 text-sm font-bold uppercase cursor-pointer focus:outline-none appearance-none text-center"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="4">4</option>
                </select>
              </div>
            </div>

            {/* Sound Controls */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div>
                <div className="text-[8px] text-[#888] uppercase tracking-wider mb-1 px-1">synth</div>
                <div className="bg-white rounded border border-[#c0c0b8] shadow-sm">
                  <select
                    value={settings.synthType}
                    onChange={(e) => setSettings((s) => ({ ...s, synthType: e.target.value }))}
                    className="w-full bg-transparent px-2 py-2 text-[10px] font-bold uppercase cursor-pointer focus:outline-none appearance-none text-center"
                  >
                    <option value="pad">Pad</option>
                    <option value="pluck">Pluck</option>
                    <option value="keys">Keys</option>
                    <option value="strings">Strng</option>
                    <option value="organ">Organ</option>
                    <option value="bell">Bell</option>
                    <option value="bass">Bass</option>
                    <option value="lead">Lead</option>
                    <option value="brass">Brass</option>
                    <option value="fm">FM</option>
                    <option value="supersaw">Super</option>
                    <option value="wobble">Wobb</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="text-[8px] text-[#888] uppercase tracking-wider mb-1 px-1">rhythm</div>
                <div className="bg-white rounded border border-[#c0c0b8] shadow-sm">
                  <select
                    value={settings.synthRhythm}
                    onChange={(e) => setSettings((s) => ({ ...s, synthRhythm: e.target.value }))}
                    className="w-full bg-transparent px-2 py-2 text-[10px] font-bold uppercase cursor-pointer focus:outline-none appearance-none text-center"
                  >
                    {Object.entries(SYNTH_RHYTHMS).map(([k, { name }]) => (
                      <option key={k} value={k}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="text-[8px] text-[#888] uppercase tracking-wider mb-1 px-1">drums</div>
                <div className="bg-white rounded border border-[#c0c0b8] shadow-sm">
                  <select
                    value={settings.drumStyle}
                    onChange={(e) => setSettings((s) => ({ ...s, drumStyle: e.target.value }))}
                    className="w-full bg-transparent px-2 py-2 text-[10px] font-bold uppercase cursor-pointer focus:outline-none appearance-none text-center"
                  >
                    <option value="basic">Basic</option>
                    <option value="hiphop">HpHop</option>
                    <option value="house">House</option>
                    <option value="trap">Trap</option>
                    <option value="dnb">DnB</option>
                    <option value="reggae">Regg</option>
                    <option value="shuffle">Shuf</option>
                    <option value="bossa">Bossa</option>
                    <option value="reggaeton">Rgtn</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="text-[8px] text-[#888] uppercase tracking-wider mb-1 px-1">reverb</div>
                <div className="bg-white rounded border border-[#c0c0b8] shadow-sm px-2 py-1.5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.reverbAmount * 100}
                    onChange={(e) => setSettings((s) => ({ ...s, reverbAmount: parseInt(e.target.value) / 100 }))}
                    className="w-full h-2 bg-[#e5e5e0] appearance-none cursor-pointer rounded [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#ff3b30] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Volume Controls */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-[#888] uppercase tracking-wider w-12">chord</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.chordVolume * 100}
                  onChange={(e) => setSettings((s) => ({ ...s, chordVolume: parseInt(e.target.value) / 100 }))}
                  className="flex-1 h-2 bg-[#c0c0b8] appearance-none cursor-pointer rounded [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#1a1a1a] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-[#888] uppercase tracking-wider w-12">drum</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.drumVolume * 100}
                  onChange={(e) => setSettings((s) => ({ ...s, drumVolume: parseInt(e.target.value) / 100 }))}
                  className="flex-1 h-2 bg-[#c0c0b8] appearance-none cursor-pointer rounded [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#1a1a1a] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            </div>

            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSettings((s) => ({ ...s, drumsEnabled: !s.drumsEnabled }))}
                className={`flex-1 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all border
                  ${settings.drumsEnabled 
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" 
                    : "bg-white text-[#888] border-[#c0c0b8]"
                  }`}
              >
                Drums {settings.drumsEnabled ? "On" : "Off"}
              </button>
              <button
                onClick={() => setSettings((s) => ({ ...s, metronomeEnabled: !s.metronomeEnabled }))}
                className={`flex-1 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all border
                  ${settings.metronomeEnabled 
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" 
                    : "bg-white text-[#888] border-[#c0c0b8]"
                  }`}
              >
                Click {settings.metronomeEnabled ? "On" : "Off"}
              </button>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <button
                onClick={exportProgression}
                className="bg-white rounded border border-[#c0c0b8] shadow-sm px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[#f5f5f0] transition-colors"
              >
                Copy
              </button>
              <button
                onClick={saveProgression}
                className="bg-white rounded border border-[#c0c0b8] shadow-sm px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[#f5f5f0] transition-colors"
              >
                Save
              </button>
              <button
                onClick={exportMidi}
                className="bg-white rounded border border-[#c0c0b8] shadow-sm px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[#f5f5f0] transition-colors"
              >
                Export
              </button>
              <button
                onClick={generateProgression}
                className="bg-[#1a1a1a] text-white rounded border border-[#1a1a1a] shadow-sm px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[#333] transition-colors"
              >
                Regen
              </button>
            </div>

            {/* Main Transport */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={isPlaying ? stopPlayback : startPlayback}
                className={`flex items-center justify-center gap-2 py-4 rounded font-bold uppercase text-sm tracking-wider transition-all
                  ${isPlaying 
                    ? "bg-[#ff3b30] text-white" 
                    : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                  }`}
              >
                {isPlaying ? (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Stop
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                  </>
                )}
              </button>
              <button
                onClick={generateProgression}
                className="flex items-center justify-center gap-2 py-4 rounded bg-white border border-[#c0c0b8] font-bold uppercase text-sm tracking-wider hover:bg-[#f5f5f0] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                Generate
              </button>
            </div>

            {/* Saved Progressions */}
            {savedProgressions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#c0c0b8]">
                <div className="text-[8px] text-[#888] uppercase tracking-wider mb-2">Saved</div>
                <div className="flex flex-wrap gap-1">
                  {savedProgressions.map((saved, i) => (
                    <button
                      key={i}
                      onClick={() => loadProgression(saved)}
                      className="bg-white rounded border border-[#c0c0b8] px-2 py-1 text-[9px] uppercase tracking-wider hover:border-[#ff3b30] transition-colors"
                    >
                      {saved.chords.map((c) => c.name).join(" ")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-[#2a2a2a] px-4 py-2 text-center text-[8px] text-[#666] uppercase tracking-widest">
            space = play/stop / r = regenerate / s = save
          </div>
        </div>
      </div>

      <Dialog open={!!editingChord} onOpenChange={(open) => !open && setEditingChord(null)}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-[#e0e0dc]">
          <DialogHeader>
            <DialogTitle className="text-[#ff3b30] uppercase tracking-wider font-mono">Edit Chord</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] uppercase tracking-widest mb-1.5 block">Root Note</label>
                <select
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#ff3b30] text-[#ccc] appearance-none"
                  value={editingChord?.root}
                  onChange={(e) => setEditingChord(prev => prev ? { ...prev, root: e.target.value } : null)}
                >
                  {NOTES.map(note => (
                    <option key={note} value={note}>{note}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] uppercase tracking-widest mb-1.5 block">Chord Type</label>
                <select
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#ff3b30] text-[#ccc] appearance-none"
                  value={editingChord?.type}
                  onChange={(e) => setEditingChord(prev => prev ? { ...prev, type: e.target.value } : null)}
                >
                  {Object.keys(CHORD_TYPES).map(type => (
                    <option key={type} value={type}>{getChordTypeName(type)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <button
              onClick={() => editingChord && updateChord(editingChord.index, editingChord.root, editingChord.type)}
              className="w-full bg-[#ff3b30] text-white py-3 rounded font-bold uppercase text-sm tracking-widest hover:bg-[#ff3b30]/90 transition-all shadow-[0_2px_10px_rgba(255,59,48,0.3)]"
            >
              Update Chord
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
