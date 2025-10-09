import {
	timeStep,
	velocityList,
	currentCameraIndex,
	bodies,
} from "./gravitysim.js";
//import timestep and the list of velocities from the module handling the sim
const {
	SciChartSurface,
	NumericAxis,
	FastLineRenderableSeries,
	XyDataSeries,
	EllipsePointMarker,
	SciChartJSDarkv2Theme,
	NumberRange,
	MouseWheelZoomModifier,
	ZoomPanModifier,
	ZoomExtentsModifier,
} = SciChart;
//import the sections i need
export let displayGraph = false;
SciChartSurface.UseCommunityLicense(); //set license so it stops complaining

const initSciChart = async () => {
	const { sciChartSurface, wasmContext } = await SciChartSurface.create(
		"scichart-root",
		{
			theme: new SciChartJSDarkv2Theme(),
			title: "Velocity of " + (bodies?.[currentCameraIndex]?.name ?? "Unknown"),
			titleStyle: { fontSize: 15 },
		}
	);

	// X-axis
	sciChartSurface.xAxes.add(
		new NumericAxis(wasmContext, { axisTitle: "Time (s)" })
	);
	//Y-axis
	sciChartSurface.yAxes.add(
		new NumericAxis(wasmContext, { axisTitle: "Velocity (2e8 ms)" })
	);

	// Data series with FIFO so it scrolls
	const dataSeries = new XyDataSeries(wasmContext, { fifoCapacity: 20000 }); 
	//keep only a set number of points
	//define the line series
	const lineSeries = new FastLineRenderableSeries(wasmContext, {
		stroke: "steelblue",
		strokeThickness: 3,
		dataSeries,
		pointMarker: new EllipsePointMarker(wasmContext, {
			width: 6,
			height: 6,
			fill: "#fff",
		}),
	});

	sciChartSurface.renderableSeries.add(lineSeries);

	// add interactivity
	sciChartSurface.chartModifiers.add(
		new MouseWheelZoomModifier(),
		new ZoomPanModifier(),
		new ZoomExtentsModifier()
	);

	return { dataSeries, sciChartSurface };
};
const { dataSeries, sciChartSurface } = await initSciChart();
let lastAppendIndex = 0; // index in velocityList we've appended up to
let t = 0;
let LastIValue;
function renderLoop() {
	// Append all new velocities that have been pushed since last frame
	while (lastAppendIndex < velocityList.length) {
		const v = velocityList[lastAppendIndex];
		dataSeries.append(t, v);
		t += timeStep;
		lastAppendIndex++;
		//add another item with the current time
	}
	if (LastIValue != currentCameraIndex) {
		updateChartTitle();
	}
	LastIValue = currentCameraIndex;
	// keep the visible window
	const windowSeconds = 100;
	sciChartSurface.xAxes.get(0).visibleRange = new NumberRange(
		Math.max(0, t - windowSeconds),
		t
	);
	if (displayGraph == true) {
		requestAnimationFrame(renderLoop);
	}
}
document.getElementById("displayGraphs").addEventListener("click", () => {
	if (displayGraph == false) {
		updateChartTitle();
		if (currentCameraIndex == -1){
			alert("Please Select A Planet!")
		}else{
		displayGraph = true;
		document.getElementById("scichart-root").style.display = "block";
		document.getElementById("graphBox").style.display = "block";
		requestAnimationFrame(renderLoop);
		}
	} else {
		displayGraph = false;
		document.getElementById("scichart-root").style.display = "none";
		document.getElementById("graphBox").style.display = "none";
	}
});
function updateChartTitle() {
	if (bodies && bodies[currentCameraIndex]) {
		sciChartSurface.title = "Velocity of " + bodies[currentCameraIndex].name; //update the title with current title
		t = 0;
		dataSeries.clear();
		lastAppendIndex = 0; //reset the last appended time
	}
}
