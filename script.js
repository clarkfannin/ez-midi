let midi = null;

const keyBtns = document.querySelectorAll(".key");

const midiMap = {
    Z: 60,
    S: 61,
    X: 62,
    D: 63,
    C: 64,
    V: 65,
    G: 66,
    B: 67,
    H: 68,
    N: 69,
    J: 70,
    M: 71,
    ",": 72,
    L: 73,
    ".": 74,
    ";": 75,
    "/": 76,
    Q: 77, // C4 + 12 + 5
    2: 78,
    W: 79,
    3: 80,
    E: 81,
    4: 82,
    R: 83,
    T: 84,
    6: 85,
    Y: 86,
    7: 87,
    U: 88,
    I: 89, // C5 + 12 + 5
    9: 90,
    O: 91,
    0: 92,
    P: 93,
    "-": 94,
    "[": 95,
    "]": 96
}

function onMIDISuccess(midiAccess) {
    console.log("MIDI ready!");
    midi = midiAccess;
    
    console.log("Available outputs:", midi.outputs.size);
}

function onMIDIFailure(msg) {
    console.error(`Failed to get MIDI access - ${msg}`);
}

document.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();
    if (midiMap[key]) {
        const btn = document.querySelector(`[data-key="${key}"]`);
        const noteOnMessage = [0x90, midiMap[key], 0x7f];
        
        if (midi) {
            const portID = Array.from(midi.outputs.keys())[0];
            if (portID) {
                const output = midi.outputs.get(portID);
                if (output) {
                    output.send(noteOnMessage);
                }
            }
        }
        
        if (btn) {
            btn.classList.add('active');
        } else {
            console.log('No button found for key:', key);
        }
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toUpperCase();
    if (midiMap[key]) {
        const btn = document.querySelector(`[data-key="${key}"]`);
        if (btn) {
            btn.classList.remove('active');
        }
        
        // Stop MIDI note here
        if (midi) {
            const portID = Array.from(midi.outputs.keys())[0];
            if (portID) {
                const output = midi.outputs.get(portID);
                if (output) {
                    const noteOffMessage = [0x80, midiMap[key], 0];
                    output.send(noteOffMessage);
                }
            }
        }
    }
});


navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
