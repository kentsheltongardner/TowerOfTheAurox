var Walk;
(function (Walk) {
    Walk[Walk["Walk"] = 0] = "Walk";
    // Stop, 
    Walk[Walk["Turn"] = 1] = "Turn";
    // Kill,
    Walk[Walk["Goal"] = 2] = "Goal";
    Walk[Walk["Jump"] = 3] = "Jump";
})(Walk || (Walk = {}));
export default Walk;
