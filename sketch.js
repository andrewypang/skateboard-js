let video;
let poseNet;
let poses = [];
let playing = false;

function setup() {
    createCanvas(1080, 720);

    // specify multiple formats for different browsers
    video = createVideo(['skateboard-data-clips/wallride.mov', 'skateboard-data-clips/wallride.webm'], videoCallback);
    video.hide(); // by default video shows up in separate dom element. hide it and draw it to the canvas instead

    button = createButton('play');
    button.mousePressed(toggleVid); // attach button listener


}

// This function is called when the video loads
function videoCallback() {
    // video.loop();
    console.log("Successful video callback. Initialize PoseNet");
    video.volume(0);
    video.size(width, height);

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
function toggleVid() {
    if (playing) {
        video.pause();
        button.html('play');
    } else {
        video.loop();
        button.html('pause');
    }
    playing = !playing;
}


function draw() {
    background(150);
    image(video, 0, 0, width, height);

    // check if pose is found aka exist
    if (poses.length > 0) {


        drawSkeleton(poses);
        drawKeypoints(poses);

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
                fill(255);
                stroke(20);
                strokeWeight(4);
                ellipse(round(keypoint.position.x), round(keypoint.position.y), 8, 8);
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