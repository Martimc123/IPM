// Bakeoff #2 - Seleção de Alvos e Fatores Humanos
// IPM 2020-21, Semestre 2
// Entrega: até dia 7 de Maio às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 3 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 19;      // Add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // Set to 'true' before sharing during the simulation and bake-off days

// Target and grid properties (DO NOT CHANGE!)
let PPI, PPCM;
let TARGET_SIZE;
let TARGET_PADDING, MARGIN, LEFT_PADDING, TOP_PADDING;
let continue_button;

// Metrics
let testStartTime, testEndTime;// time between the start and end of one attempt (48 trials)
let hits 			 = 0;      // number of successful selections
let misses 			 = 0;      // number of missed selections (used to calculate accuracy)
let database;                  // Firebase DB  

// Study control parameters
let draw_targets     = false;  // used to control what to show in draw()
let trials 			 = [];     // contains the order of targets that activate in the test
let current_trial    = 0;      // the current trial number (indexes into trials array above)
let attempt          = 0;      // users complete each test twice to account for practice (attemps 0 and 1)
let fitts_IDs        = [];     // add the Fitts ID for each selection here (-1 when there is a miss)

// ADDED: mouse position to calculate Fitts ID
let fitts_mouseX;
let fitts_mouseY;


// ADDED: global variables responsible for sound effects
var wrongSound;
var rightSound;
var slider;
var slidera;

// ADDED: preload status
function preload(){
  rightSound =  loadSound("hit.mp3");
  wrongSound = loadSound("miss.mp3");

}

// Target class (position and width)
class Target
{
  constructor(x, y, w)
  {
    this.x = x;
    this.y = y;
    this.w = w;
  }
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);    // window size in px before we go into fullScreen()
  frameRate(60);             // frame rate (DO NOT CHANGE!)
  
  randomizeTrials();         // randomize the trial order at the start of execution
  
  textFont("Arial", 18);     // font size for the majority of the text
  drawUserIDScreen();        // draws the user input screen (student number and display size)
}

function drawAlvo(xloc, yloc, size, num, isOverlay) {
  const steps = size / num;
  for (let i = 0; i < num; i++) {
    if (i%2==0)
	{
      if (isOverlay && i == 0) {
        fill(color(0,104,245));
        ellipse(xloc, yloc, size - i * steps, size - i * steps);
      }
      else {
	    fill(color(255,0,0));
	    ellipse(xloc, yloc, size - i * steps, size - i * steps);
      }
	}
	else
	{
	  fill(color(255,255,255));
	  ellipse(xloc, yloc, size - i * steps, size - i * steps);
	}
  }
}

function drawOutline(xloc, yloc, size, num) {
  const steps = size / num;
  for (let i = 0; i < num; i++) {
    if (i==0)
	{
	  fill(color(0,104,245));
	  ellipse(xloc, yloc, size - i * steps, size - i * steps);
	}
	else
	{
      fill(color(155,155,155));
	  ellipse(xloc, yloc, size - i * steps, size - i * steps);
	}
  }
}

function compareTargets(target1, target2) {
  return target1.x === target2.x && target1.y === target2.y;
}

// Runs every frame and redraws the screen
function draw()
{
  if (draw_targets)
  {
    // The user is interacting with the 4x4 target grid
    background(color(0,0,0));        // sets background to black
    
    // Print trial count at the top left-corner of the canvas
    fill(color(255,255,255));
    textAlign(LEFT);
    text("Trial " + (current_trial + 1) + " of " + trials.length, 50, 20);
    
    // Draw all 16 targets
	for (var i = 0; i < 16; i++) drawTarget(i);
    
    // ADDED: linhas para targets
    let previous_target = getTargetBounds(trials[current_trial-1]);
    let current_target = getTargetBounds(trials[current_trial]);
    let next_target = getTargetBounds(trials[current_trial+1]);
      
    // linha para anterior
    stroke(255,0,0);
    strokeWeight(4);
    line(current_target.x, current_target.y, previous_target.x, previous_target.y);
    
    // linha para proximo
    if (!compareTargets(previous_target, current_target)) {
      stroke(0,104,245);
      strokeWeight(4);
      line(current_target.x, current_target.y, next_target.x, next_target.y);
    }
    
    // indica x2
    if (compareTargets(current_target, next_target)) {
      drawX2(current_target);
    }

    noStroke();
  }
}

// ADDED
function drawX2(target) {
  stroke(0, 104, 245);
  strokeWeight(5);
  //noStroke();
  fill(color(0, 104, 245));
  fill(color(255, 255, 255));
  textAlign(CENTER);
  textStyle(BOLD);
  text("x2", target.x, target.y+6);
  textAlign(LEFT);
  textStyle(NORMAL);
  
}

// ADDED: sound effect to the hits
function soundHit(slider){
  wrongSound.stop();
  rightSound.setVolume(slider.value());
  rightSound.play();
}

// ADDED: sound effect to misses
function soundMiss(slidera){
    rightSound.stop();
    wrongSound.setVolume(slidera.value());
    wrongSound.play();
}

// Print and save results at the end of 48 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE! 
  let accuracy			= parseFloat(hits * 100) / parseFloat(hits + misses);
  let test_time         = (testEndTime - testStartTime) / 1000;
  let time_per_target   = nf((test_time) / parseFloat(hits + misses), 0, 3);
  let penalty           = constrain((((parseFloat(95) - (parseFloat(hits * 100) / parseFloat(hits + misses))) * 0.2)), 0, 100);
  let target_w_penalty	= nf(((test_time) / parseFloat(hits + misses) + penalty), 0, 3);
  let timestamp         = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  background(color(0,0,0));   // clears screen
  fill(color(255,255,255));   // set text fill color to white
  text(timestamp, 10, 20);    // display time on screen (top-left corner)
  
  textAlign(CENTER);
  text("Attempt " + (attempt + 1) + " out of 2 completed!", width/2, 60); 
  text("Hits: " + hits, width/2, 100);
  text("Misses: " + misses, width/2, 120);
  text("Accuracy: " + accuracy + "%", width/2, 140);
  text("Total time taken: " + test_time + "s", width/2, 160);
  text("Average time per target: " + time_per_target + "s", width/2, 180);
  text("Average time for each target (+ penalty): " + target_w_penalty + "s", width/2, 220);
  
  // Print Fitts IDS (one per target, -1 if failed selection)
  // ADDED: print Fitts
  let base_text_y = 260;
  let aux_text_y = base_text_y + 20;
  // header
  text("Fitts Index of Performance", width/2, base_text_y);
  textAlign(LEFT);
  // left column
  text("Target 1: ---", width*(1/4), aux_text_y);
  for(let j = 2; j <= 24; j++) {
    aux_text_y += 20;
    if(fitts_IDs[j-1] === -1)
      text("Target " + j + ": MISSED", width*(1/4), aux_text_y);
    else  
      text("Target " + j + ": " + fitts_IDs[j-1].toFixed(3), width*(1/4), aux_text_y);
  }
  // right column
  aux_text_y = base_text_y;
  for(let j = 25; j <= 48; j++) { 
    aux_text_y += 20;
    if(fitts_IDs[j-1] === -1)
      text("Target " + j + ": MISSED", width*(3/5), aux_text_y);
    else  
      text("Target " + j + ": " + fitts_IDs[j-1].toFixed(3), width*(3/5), aux_text_y);
  }

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:       GROUP_NUMBER,
        assessed_by:        student_ID,
        test_completed_by:  timestamp,
        attempt:            attempt,
        hits:               hits,
        misses:             misses,
        accuracy:           accuracy,
        attempt_duration:   test_time,
        time_per_target:    time_per_target,
        target_w_penalty:   target_w_penalty,
        fitts_IDs:          fitts_IDs
  }
  
  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Mouse button was pressed - lets test to see if hit was in the correct target
function mousePressed() 
{ 
  // Only look for mouse releases during the actual test
  // (i.e., during target selections)
  if (draw_targets)
  {
    
    // Get the location and size of the target the user should be trying to select
    let target = getTargetBounds(trials[current_trial]);   
    
    // Check to see if the mouse cursor is inside the target bounds,
    // increasing either the 'hits' or 'misses' counters
    // ADDED: calculate Fitts
    // ADDED: Sound Slider
    slider = createSlider(0,1,0.5,0.4,0.3);
    slidera = createSlider(0.2,0.4);
    if (dist(target.x, target.y, mouseX, mouseY) < target.w/2)  {
        
        //sound effect
        soundHit(slider);
        
      
        hits++;                                                   
        fitts_IDs[current_trial] = Math.log2(dist(target.x, target.y, fitts_mouseX, fitts_mouseY)/target.w + 1);
    }
    else {
        
        soundMiss(slidera);
    
        misses++;
        fitts_IDs[current_trial] = -1;
    }
      
    current_trial++;                 // Move on to the next trial/target
    
    // Check if the user has completed all 48 trials
    if (current_trial === trials.length)
    {
      testEndTime = millis();
      draw_targets = false;          // Stop showing targets and the user performance results
      printAndSavePerformance();     // Print the user's results on-screen and send these to the DB
      attempt++;                      
      
      // If there's an attempt to go create a button to start this
      if (attempt < 2)
      {
        continue_button = createButton('START 2ND ATTEMPT');
        continue_button.mouseReleased(continueTest);
        continue_button.position(width/2 - continue_button.size().width/2, height/2 - continue_button.size().height/2);
      }
    } 
  }
  
  // ADDED: save mouse position for next Fitts ID calculation
  fitts_mouseX = mouseX;
  fitts_mouseY = mouseY;
  
}

// Draw target on-screen
function drawTarget(i)
{
  // Get the location and size for target (i)
  let target = getTargetBounds(i);             

  // Check whether this target is the target the user should be trying to select
  if (trials[current_trial] === i) 
  { 
    current_target = getTargetBounds(trials[current_trial]);
    drawAlvo(current_target.x, current_target.y, current_target.w,6, false);
    // if next target is the same
    if (trials[current_trial+1] === i)
      drawAlvo(current_target.x, current_target.y, current_target.w,6, true);
  }
  // Check wheter this target is the next target
  else if (trials[current_trial+1] === i)
  { 
    next_target = getTargetBounds(trials[current_trial+1]);
    drawOutline(next_target.x, next_target.y, next_target.w, 6);
  }
  // Does not draw a border if this is not the target the user
  // should be trying to select
  else {          
    // Draws the target
    noStroke();
    fill(color(155,155,155));                 
    circle(target.x, target.y, target.w);
  }
}

// Returns the location and size of a given target
function getTargetBounds(i)
{
  var x = parseInt(LEFT_PADDING) + parseInt((i % 4) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);
  var y = parseInt(TOP_PADDING) + parseInt(Math.floor(i / 4) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);

  return new Target(x, y, TARGET_SIZE);
}

// Evoked after the user starts its second (and last) attempt
function continueTest()
{
  // Re-randomize the trial order
  shuffle(trials, true);
  current_trial = 0;
  print("trial order: " + trials);
  
  // Resets performance variables
  hits = 0;
  misses = 0;
  fitts_IDs = [];
  
  continue_button.remove();
  
  // Shows the targets again
  draw_targets = true;
  testStartTime = millis();  
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized() 
{
  resizeCanvas(windowWidth, windowHeight);
    
  let display    = new Display({ diagonal: display_size }, window.screen);

  // DO NOT CHANGE THESE!
  PPI            = display.ppi;                        // calculates pixels per inch
  PPCM           = PPI / 2.54;                         // calculates pixels per cm
  TARGET_SIZE    = 1.5 * PPCM;                         // sets the target size in cm, i.e, 1.5cm
  TARGET_PADDING = 1.5 * PPCM;                         // sets the padding around the targets in cm
  MARGIN         = 1.5 * PPCM;                         // sets the margin around the targets in cm

  // Sets the margin of the grid of targets to the left of the canvas (DO NOT CHANGE!)
  LEFT_PADDING   = width/2 - TARGET_SIZE - 1.5 * TARGET_PADDING - 1.5 * MARGIN;        
  
  // Sets the margin of the grid of targets to the top of the canvas (DO NOT CHANGE!)
  TOP_PADDING    = height/2 - TARGET_SIZE - 1.5 * TARGET_PADDING - 1.5 * MARGIN;
  
  // Starts drawing targets immediately after we go fullscreen
  draw_targets = true;
}