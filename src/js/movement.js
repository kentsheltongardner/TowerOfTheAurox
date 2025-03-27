var Walk;
(function (Walk) {
    Walk[Walk["Go"] = 0] = "Go";
    Walk[Walk["Stop"] = 1] = "Stop";
    Walk[Walk["Turn"] = 2] = "Turn";
    Walk[Walk["Kill"] = 3] = "Kill";
    Walk[Walk["Goal"] = 4] = "Goal";
    Walk[Walk["Portal"] = 5] = "Portal";
})(Walk || (Walk = {}));
export default Walk;
