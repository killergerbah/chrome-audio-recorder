class Recorder {

    constructor() {
        this.recording = false;
        this.recorder = null;
        this.stream = null;
        this.audio = null;
    }

    start() {
        if (this.recording) {
            console.error("Already recording, cannot start");
            return;
        }

        chrome.tabCapture.capture({audio: true}, stream => this._start(stream));
        chrome.browserAction.setBadgeText({text: 'rec'}, () => {});
    }

    _start(stream) {
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        recorder.ondataavailable = (e) => {
            chunks.push(e.data);
        };
        recorder.onstop = (e) => {
            const blob = new Blob(chunks, {type: 'audio/x-wav'});
            blob.arrayBuffer().then(buffer => this._sendBuffer(buffer));
        };
        recorder.start();
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();

        this.recorder = recorder;
        this.recording = true;
        this.stream = stream;
        this.audio = audio;
    }

    _sendBuffer(buffer) {
        chrome.tabs.query({active: true}, tabs => {
            if (tabs.length === 0) {
                console.error("No active tabs found");
                return;
            }

            const tab = tabs[0];
            chrome.tabs.sendMessage(tab.id, {
                command: 'audio-data',
                data: this._base64(buffer)
            });
        })
    }

    _base64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const length = bytes.byteLength;

        for (let i = 0; i < length; ++i) {
            binary += String.fromCharCode(bytes[i]);
        }

        return window.btoa(binary);
    }

    stop() {
        if (!this.recording) {
            console.error("Not recording, unable to stop");
            return;
        }

        this.recording = false;
        this.recorder.stop();
        this.recorder = null;
        this.stream.getAudioTracks()[0].stop();
        this.stream = null;
        this.audio.pause();
        this.audio.srcObject = null;
        this.audio = null;
        
        chrome.browserAction.setBadgeText({}, () => {});
    }
}

const recorder = new Recorder();

chrome.commands.onCommand.addListener((command) => {
    switch (command) {
        case 'start':
            console.log("Started recording");
            recorder.start();
            break;
        case 'stop':
            console.log("Stopped recording");
            recorder.stop();
            break;
    }
});