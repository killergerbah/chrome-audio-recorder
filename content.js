function saveToFile(base64) {
    const binary = atob(base64);
    const bytes = new Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    const buffer = new Uint8Array(bytes);
    const blob = new Blob([buffer], {type: 'audio/wav'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = 'chrome-audio-' + Date.now() + '.wav';
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.command) {
        case 'audio-data':
            saveToFile(request.data);
            break;
        default:
            console.error("Unknown command " + request.command);
    }
});