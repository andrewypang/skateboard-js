let video;
let videoProperties = {};
let poseNet;
let poses = [];
let playing = false;
let showingVideoOverlay = true;
let showingPoseNetOverlay = true;
let completion;
let playbackTrack = {};
let frameRate = 24;
let recordedBlobs = [];

function setup() {
    let canvasWidth = 1080;

    // set videoProperties with width and height to insure consistency and matches with PoseNet
    videoProperties.width = canvasWidth;
    videoProperties.height = 720;

    // set playbackTrack width to the full width of the canvas and set height to anything that looks good
    playbackTrack.width = canvasWidth;
    playbackTrack.height = 96;

    createCanvas(canvasWidth, (videoProperties.height + playbackTrack.height));
    /*
     *   |-------------------|
     *   |                   |
     *   |       VIDEO       |
     *   |                   |
     *   |-------------------|
     *   |  PLAYBACK TRACK   |
     *   |-------------------|
     */

    // specify multiple formats for different browsers
    video = createVideo(['skateboard-data-clips/fs-ramp.mov'], videoCallback);
    video.hide(); // by default video shows up in separate dom element. hide it and draw it to the canvas instead

    button_play = createButton('play');
    button_play.mousePressed(toggleVideoPlayPause); // attach button listener

    button_toggleVideoOverlay = createButton('Toggle Video Overlay');
    button_toggleVideoOverlay.mousePressed(toggleVideoOverlay);

    button_togglePoseNet = createButton('Toggle PoseNet');
    button_togglePoseNet.mousePressed(togglePoseNet);

    button_previousFrame = createButton('Previous Frame');
    button_previousFrame.mousePressed(previousFrame);

    button_nextFrame = createButton('Next Frame');
    button_nextFrame.mousePressed(nextFrame);

    button_saveFrame = createButton('Save Frame');
    button_saveFrame.mousePressed(saveFrame);

    button_exportVideo = createButton('Export Frame');
    button_exportVideo.mousePressed(exportVideo);

    button_stopRecording = createButton('Stop Recording');
    button_stopRecording.mousePressed(stopRecording);

}

// This function is called when the video loads and is ready
function videoCallback() {
    console.log("Successful video callback. Initializing PoseNet");
    video.volume(0); //set the volume to 0
    video.size(width, videoProperties.height); //set the video size relative to the canvas size

    // set some options
    let options = {
        imageScaleFactor: 1,
        minConfidence: 0.1
    }

    // Create a new poseNet method
    poseNet = ml5.poseNet(video, options, modelLoaded);
    poseNet.on('pose', function (results) {
        poses = results;
    });
}

function modelLoaded() {
    console.log('PoseNet ready');
}

// plays or pauses the video depending on current state
function toggleVideoPlayPause() {
    if (playing) {
        video.pause();
        button_play.html('play');
    } else {
        video.loop();
        button_play.html('pause');
    }
    playing = !playing;
}

function toggleVideoOverlay() {
    showingVideoOverlay = !showingVideoOverlay;
}

function togglePoseNet() {
    showingPoseNetOverlay = !showingPoseNetOverlay;
}

function nextFrame() {
    video.pause();
    let currentTime = video.time();
    video.time(currentTime + (1 / frameRate));
}

function previousFrame() {
    video.pause();
    let currentTime = video.time();
    video.time(currentTime - (1 / frameRate));
}

function saveFrame() {
    saveCanvas('myCanvas', 'jpg');
}

function exportVideo() {
    console.log("exporting video!");

    //go to the beginning of video
    video.time(0);
    video.elt.loop = false;



    // video.onended(stopRecording);
    video.elt.onended = (event) => {
        mediaRecorder.requestData(); //ensure getting the last bit of the Blob
        stopRecording();
    };

    // declare options for mediaRecorder
    var mediaRecorderOptions = {
        videoBitsPerSecond: 2500000,
        mimeType: 'video/webm'
    }

    let cStream = document.querySelector('canvas').captureStream();
    mediaRecorder = new MediaRecorder(cStream, mediaRecorderOptions);
    mediaRecorder.start();
    mediaRecorder.ondataavailable = function (e) {
        recordedBlobs.push(e.data);
    }
    mediaRecorder.onstop = downloadVideo;

    video.play();

}

function downloadVideo() {
    // Below is download link

    let url;
    const blob = new Blob(recordedBlobs);
    url = window.URL.createObjectURL(blob, {
        type: 'video/webm'
    });

    // Get file name from video src(returns FULL path, ie: C://)
    let fileName = (video.src).split("/").pop(); // take full path of video and extract filename(with extension)
    fileName = fileName.split('.').slice(0, -1).join('.'); //take filename and remove extension


    // Creates a download link to download the video file
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = fileName + "-clip" + ".webm";
    a.click(); //Clicking the link to start downloading the file
    window.URL.revokeObjectURL(url);
}

function stopRecording() {
    mediaRecorder.stop();
}

function draw() {
    background(150);

    //get elapsed time of video
    completion = video.time() / video.duration();

    push();
    fill(255);
    stroke(20);
    strokeWeight(4);
    ellipse(completion * width, videoProperties.height + (playbackTrack.height / 2), 16, 16);
    pop();

    if (showingVideoOverlay) {
        image(video, 0, 0, width, videoProperties.height);
    }

    if (showingPoseNetOverlay) {
        // check if pose is found aka exist
        if (poses.length > 0) {
            drawSkeleton(poses);
            drawKeypoints(poses);
        }
    }

}

// The following comes from https://ml5js.org/docs/posenet-webcam
// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                push();
                fill(255);
                stroke(20);
                strokeWeight(4);
                ellipse(round(keypoint.position.x), round(keypoint.position.y), 8, 8);
                pop();
            }
        }
    }
}

// A function to draw the skeletons
function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255);
            strokeWeight(1);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}