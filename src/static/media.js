/*
let p = navigator.mediaDevices.getUserMedia({ audio: true, video: true });

p.then(function(mediaStream) {
    let video = document.querySelector('video');
    video.src = window.URL.createObjectURL(mediaStream);
    video.onloadedmetadata = function(e) {
        // Do something with the video here.
        alert('play');
    };
});

p.catch(function(err) { console.log(err.name); }); // always check for errors at the end.*/


let promisifiedOldGUM = function(constraints) {

    // First get ahold of getUserMedia, if present
    let getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia);

    // Some browsers just don't implement it - return a rejected promise with an error
    // to keep a consistent interface
    if(!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }

    // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
    return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
    });

}

// Older browsers might not implement mediaDevices at all, so we set an empty object first
if(navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
}

// Some browsers partially implement mediaDevices. We can't just assign an object
// with getUserMedia as it would overwrite existing properties.
// Here, we will just add the getUserMedia property if it's missing.
if(navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
}


// Prefer camera resolution nearest to 1280x720.
let constraints = { audio: true, video: { width: 1280, height: 720 } };

navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
        let video = document.querySelector('video');
        video.src = window.URL.createObjectURL(stream);
        video.onloadedmetadata = function(e) {
            video.play();
        };
    })
    .catch(function(err) {
        console.log(err.name + ": " + err.message);
    });