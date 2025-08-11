let midi = null;
let midiOutput = null;
let midiOutputs = [];

const keyBtns = document.querySelectorAll(".key");
const midiOutputSelect = document.getElementById("midi-output-select");
const midiStatus = document.getElementById("midi-status");
const statusIndicator = midiStatus
	? midiStatus.querySelector(".status-indicator")
	: null;
const statusText = midiStatus ? midiStatus.querySelector(".status-text") : null;

if (navigator.requestMIDIAccess) {
	navigator
		.requestMIDIAccess({ sysex: false })
		.then(onMIDISuccess, onMIDIFailure);
} else if (midiStatus) {
	updateMidiStatus(false, "Web MIDI not supported");
}

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
	Q: 77,
	2: 78,
	W: 79,
	3: 80,
	E: 81,
	R: 82,
	5: 83,
	T: 84,
	6: 85,
	Y: 86,
	7: 87,
	U: 88,
	I: 89,
	9: 90,
	O: 91,
	0: 92,
	P: 93,
	"[": 94,
	"=": 95,
	"]": 96,
};

const transposeDownBtn = document.getElementById("transpose-down-btn");
const transposeUpBtn = document.getElementById("transpose-up-btn");
const transposeValueEl = document.getElementById("transpose-value");
let transposeAmount = 0;

transposeDownBtn.addEventListener("click", () => {
	for (let key in midiMap) {
		if (midiMap[key] <= 20) return;
		midiMap[key] -= 12;
	}
	transposeAmount --;
	if (transposeValueEl) transposeValueEl.textContent = transposeAmount;
	console.log(midiMap);
});

transposeUpBtn.addEventListener("click", () => {
	for (let key in midiMap) {
		if (midiMap[key] >= 127) return;
		midiMap[key] += 12;
	}
	transposeAmount ++;
	if (transposeValueEl) transposeValueEl.textContent = transposeAmount;
	console.log(midiMap);
});

function onMIDISuccess(midiAccess) {
	console.log("MIDI ready!");
	midi = midiAccess;

	midi.onstatechange = handleMIDIStateChange;

	updateMidiOutputs();

	midiOutputSelect.addEventListener("change", handleOutputSelect);
}

function onMIDIFailure(msg) {
	console.error(`Failed to get MIDI access - ${msg}`);
	updateMidiStatus(false, "MIDI access denied");
}

function updateMidiOutputs() {
	if (!midi) return;

	while (midiOutputSelect.options.length > 1) {
		midiOutputSelect.remove(1);
	}

	midiOutputs = Array.from(midi.outputs.values());

	if (midiOutputs.length === 0) {
		updateMidiStatus(false, "No MIDI outputs found");
		return;
	}

	midiOutputs.forEach((output, index) => {
		const option = document.createElement("option");
		option.value = index;
		option.textContent = output.name || `Output ${index + 1}`;
		midiOutputSelect.appendChild(option);
	});

	if (midiOutputs.length > 0) {
		midiOutputSelect.value = 0;
		handleOutputSelect({ target: midiOutputSelect });
	}
}

function handleOutputSelect(event) {
	const selectedIndex = parseInt(event.target.value);

	if (
		isNaN(selectedIndex) ||
		selectedIndex < 0 ||
		selectedIndex >= midiOutputs.length
	) {
		midiOutput = null;
		updateMidiStatus(false, "No output selected");
		return;
	}

	midiOutput = midiOutputs[selectedIndex];
	updateMidiStatus(true, `Connected to ${midiOutput.name}`);

	console.log(`Selected MIDI output: ${midiOutput.name}`);
}

function handleMIDIStateChange(event) {
	console.log("MIDI state changed:", event.port.name, event.port.state);
	updateMidiOutputs();
}

function updateMidiStatus(isConnected, message) {
	if (isConnected) {
		statusIndicator.className = "status-indicator connected";
		statusText.textContent = message;
		midiStatus.title = "MIDI output connected";
	} else {
		statusIndicator.className = "status-indicator disconnected";
		statusText.textContent = message;
		midiStatus.title = "MIDI output not connected";
	}
}

const pressedKeys = new Set();

document.addEventListener("keydown", (e) => {
	let key = e.key.toUpperCase();
	if ([",", ".", ";", "/", "-", "[", "]"].includes(e.key)) {
		key = e.key;
	}

	if (midiMap[key] !== undefined && !pressedKeys.has(key)) {
		pressedKeys.add(key);

		const btn = document.querySelector(`[data-key="${key}"]`);
		const noteOnMessage = [0x90, midiMap[key], 0x7f];

		if (midiOutput) {
			try {
				midiOutput.send(noteOnMessage);
			} catch (error) {
				console.error("Error sending MIDI message:", error);
				updateMidiStatus(false, "MIDI send error");
			}
		}

		if (btn) {
			btn.classList.add("active");
		}
	}
});

document.addEventListener("keyup", (e) => {
	let key = e.key.toUpperCase();
	if ([",", ".", ";", "/", "-", "[", "]"].includes(e.key)) {
		key = e.key;
	}

	if (midiMap[key] !== undefined && pressedKeys.has(key)) {
		pressedKeys.delete(key);

		const btn = document.querySelector(`[data-key="${key}"]`);
		if (btn) {
			btn.classList.remove("active");
		}

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
