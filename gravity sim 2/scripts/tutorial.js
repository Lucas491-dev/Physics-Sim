console.log("hellomum");
const tutorialSteps = [
	"Welcome to the gravity simulator! Let's get started with some of the basics.",
	"Use the mouse wheel to zoom in and out.",
	"Click and drag to pan around the simulation.",
	"Lets zoom in on this planet to see whats going on, notice how the force vector (red) points towards the center of the sun, showing the direction of the gravitational pull.",
    "The velocity vector (blue) is perpendicular to the force vector, indicating the direction of motion.",
	"Newton's law of gravitation states that every point mass attracts every other point mass by a force acting along the line intersecting both points.",
    "The formula is given by: \\(F = G\\frac{M m}{r^2}\\), where F is the gravitational force between two masses, G is the gravitational constant, M and m are the masses of the objects, and r is the distance between their centers.",
	"But if both vectors are acting on the object, why does it not just fall straight into the planet? This is because the object has a tangential velocity (blue vector) that is sufficient to keep it in orbit around the planet, balancing the inward pull of gravity (red vector).",
	"Notice how this planet has an elliptical orbit. This demonstrates Keplers first law of planetary motion, which states that planets move in elliptical orbits with the sun at one focus.",
	"Why  sun doesn't move much even though it experiences the same gravitional force as the planet? This is because the sun has a much larger mass, resulting in a much smaller acceleration according to Newton's second law of motion \\(F=m a\\).",
    "Look at how the planet speeds up as it gets closer to the sun and slows down as it moves away. This is explained by Keplers second law of planetary motion, which states that a line segment joining a planet and the sun sweeps out equal areas during equal intervals of time.",
    "Now switching to an outer planet. It hasn't even completed a full orbit yet!",
    "This is evidence of Keplers third law of planetary motion, which states that the square of the orbital period of a planet is proportional to the cube of the semi-major axis of its orbit. \\(T^2 \\propto R^3\\)",
    "Wait this planet has a moon! The moon orbits the planet while the planet orbits the sun, both following the same gravitational principles we've discussed.",
    "Thisn't isn't the full picture. Einsteins theory of general relativity describes gravity not as a force but as a curvature of spacetime caused by mass and energy.",
];
let currentStep = 0;
import { setTutorialCamera, setTutorialVector,setTutorialSpacetimeGrid } from "./gravitysim.js";
//import the function to change camera index
import {setGraphForTutorial} from "./graphResults.js";
const tutorialText = document.getElementById("tutorialText");
const tutorialTitle = document.getElementById("tutorialTitle");
const currentStepSpan = document.getElementById("currentStep");
const totalStepsSpan = document.getElementById("totalSteps");
const progressBar = document.getElementById("progressBar");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const exitBtn = document.getElementById("exitBtn");
const tutorialContainer = document.querySelector(".tutorial-container");

totalStepsSpan.textContent = tutorialSteps.length;

function updateTutorial() {
    tutorialText.innerHTML = tutorialSteps[currentStep]; 
    //update the text content
    currentStepSpan.textContent = currentStep + 1;
    progressBar.value = currentStep + 1;
    //set the progress bar and current step
    prevBtn.disabled = currentStep === 0;
    nextBtn.disabled = currentStep === tutorialSteps.length - 1;
    nextBtn.innerHTML =
        currentStep === tutorialSteps.length - 1 ? "Finish" : '<i class="fa fa-arrow-right"></i>';
    //say if tis the lase step
    // Trigger MathJax to re-render in case of an error
    MathJax.typesetPromise().catch(err => console.log(err));
     updateCurrentStep() // Update camera and vector visibility based on the current step
     //seperated to make it cleaner so i can add stuff separately
}
nextBtn.addEventListener("click", () => {
	if (currentStep < tutorialSteps.length - 1) {
		currentStep++;
		updateTutorial();
	} else {
		closeTutorial();
	}
});

prevBtn.addEventListener("click", () => {
	if (currentStep > 0) {
		currentStep--;
		updateTutorial();
	}
});

exitBtn.addEventListener("click", closeTutorial);

function closeTutorial() {
	tutorialContainer.style.display = "none";
}

updateTutorial();
function updateCurrentStep() {
    if (currentStep == 3) {
        setTutorialCamera(0); // Zoom in on the planet at step 3
        setTutorialVector(true)
    }if(currentStep == 9){
        setTutorialCamera(2);
        setTutorialVector(true);
    }
    if(currentStep == 8){
        setTutorialCamera(1);
        setTutorialVector(false);
        setGraphForTutorial(false);
    }
    if(currentStep == 10){
        setTutorialCamera(1);
        setTutorialVector(true);
        setGraphForTutorial(true);
    }
    if(currentStep == 11){
        setTutorialCamera(3);
        setTutorialVector(true);
        setGraphForTutorial(true);
    }
    if(currentStep == 13){
        setTutorialCamera(4);
        setTutorialVector(false);
        setGraphForTutorial(true);
        setTutorialSpacetimeGrid(false);
    }
     if(currentStep == 14){
        setTutorialCamera(0);
        setTutorialVector(false);
        setGraphForTutorial(false);
        setTutorialSpacetimeGrid(true);
    }
}