import { timeStep, velocityList } from "./gravitysim.js";
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
export let displayGraph = false;

//import the parts of SciChart
const initSciChart = async () => {
	const { sciChartSurface, wasmContext } = await SciChartSurface.create(
		"scichart-root",
		{
			theme: new SciChartJSDarkv2Theme(),
			title: "Velocity of Planet 2 Over Time",
			titleStyle: { fontSize: 15 },
		}
	);

	// Axes
	sciChartSurface.xAxes.add(
		new NumericAxis(wasmContext, { axisTitle: "Time (s)" })
	);
	sciChartSurface.yAxes.add(
		new NumericAxis(wasmContext, { axisTitle: "Velocity (ms)" })
	);

	// Data series with FIFO so it scrolls
	const dataSeries = new XyDataSeries(wasmContext, { fifoCapacity: 2000 }); // keep last 200 points

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

function renderLoop() {
	// Append all new velocities that have been pushed since last frame
	while (lastAppendIndex < velocityList.length) {
		const v = velocityList[lastAppendIndex];
		dataSeries.append(t, v);
		t += timeStep;
		lastAppendIndex++;
	}

	// keep the visible window
	const windowSeconds = 10;
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
    displayGraph = true
		document.getElementById("scichart-root").style.display = "block";
    document.getElementById("graphBox").style.display = "block";
		requestAnimationFrame(renderLoop);
	} else {
    displayGraph= false
		document.getElementById("scichart-root").style.display = "none";
    document.getElementById("graphBox").style.display = "none";
	}
});
